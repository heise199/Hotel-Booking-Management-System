# 预订相关路由
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import date, datetime, timedelta
from decimal import Decimal
from app.database import get_db
from app.models import Booking, Hotel, User, BookingStatus
from app.schemas import BookingCreate, BookingUpdate, BookingResponseUpdated
from app.routers.pricing import calculate_price
from app.auth import get_current_user_optional
import uuid

router = APIRouter(prefix="/api/bookings", tags=["预订管理"])

@router.post("/", response_model=BookingResponseUpdated, summary="创建预订")
def create_booking(
    booking: BookingCreate, 
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    创建酒店预订（用户ID从JWT token获取）
    """
    # 必须登录才能创建预订
    if not current_user:
        raise HTTPException(status_code=401, detail="请先登录")
    
    user_id = current_user.id  # 使用token中的用户ID
    
    # 验证日期
    if booking.check_out_date <= booking.check_in_date:
        raise HTTPException(status_code=400, detail="离店日期必须晚于入住日期")
    
    if booking.check_in_date < date.today():
        raise HTTPException(status_code=400, detail="入住日期不能是过去日期")
    
    # 计算入住天数
    nights = (booking.check_out_date - booking.check_in_date).days
    
    # 检查酒店是否存在
    hotel = db.query(Hotel).filter(Hotel.id == booking.hotel_id).first()
    if not hotel:
        raise HTTPException(status_code=404, detail="酒店不存在")
    
    # 检查房间可用性（简化版：检查可用房间数）
    if hotel.available_rooms < booking.room_count:
        raise HTTPException(status_code=400, detail="可用房间不足")
    
    # 检查日期冲突（简化版：检查该日期段是否有足够房间被预订）
    conflicting_bookings = db.query(Booking).filter(
        and_(
            Booking.hotel_id == booking.hotel_id,
            Booking.status.in_(["pending", "confirmed"]),
            or_(
                and_(Booking.check_in_date <= booking.check_in_date, Booking.check_out_date > booking.check_in_date),
                and_(Booking.check_in_date < booking.check_out_date, Booking.check_out_date >= booking.check_out_date),
                and_(Booking.check_in_date >= booking.check_in_date, Booking.check_out_date <= booking.check_out_date)
            )
        )
    ).all()
    
    total_conflicting_rooms = sum(b.room_count for b in conflicting_bookings)
    if hotel.available_rooms - total_conflicting_rooms < booking.room_count:
        raise HTTPException(status_code=400, detail="所选日期房间已被预订")
    
    # 计算价格
    price_info = calculate_price(
        hotel_id=booking.hotel_id,
        check_in_date=booking.check_in_date,
        check_out_date=booking.check_out_date,
        user_id=user_id,
        db=db
    )
    
    # 生成预订编号
    booking_no = f"BK{datetime.now().strftime('%Y%m%d')}{str(uuid.uuid4())[:5].upper()}"
    
    # 创建预订
    db_booking = Booking(
        booking_no=booking_no,
        user_id=user_id,
        hotel_id=booking.hotel_id,
        check_in_date=booking.check_in_date,
        check_out_date=booking.check_out_date,
        nights=nights,
        room_count=booking.room_count,
        base_price=price_info["base_price"],
        discount_rate=price_info["discount_rate"],
        final_price=price_info["final_price"] * booking.room_count * nights,
        status="confirmed",
        confirm_time=datetime.now(),
        notes=booking.notes
    )
    
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    return db_booking

@router.get("/", response_model=List[BookingResponseUpdated], summary="获取预订列表")
def get_bookings(
    hotel_id: Optional[int] = Query(None, description="酒店ID"),
    status: Optional[str] = Query(None, description="预订状态"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    获取预订列表，支持按酒店、状态筛选
    普通用户只能查看自己的预订，管理员可以查看所有
    """
    query = db.query(Booking)
    
    # 必须登录才能查看预订列表
    if not current_user:
        raise HTTPException(status_code=401, detail="请先登录")
    
    # 如果是普通用户，只能查看自己的预订；管理员可以查看所有
    if current_user.role != "admin":
        query = query.filter(Booking.user_id == current_user.id)
    if hotel_id:
        query = query.filter(Booking.hotel_id == hotel_id)
    if status:
        query = query.filter(Booking.status == status)
    
    bookings = query.order_by(Booking.booking_time.desc()).offset(skip).limit(limit).all()
    return bookings

@router.get("/{booking_id}", response_model=BookingResponseUpdated, summary="获取预订详情")
def get_booking(booking_id: int, db: Session = Depends(get_db)):
    """
    根据ID获取预订详情（包含酒店信息）
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="预订不存在")
    
    # 加载酒店信息
    if booking.hotel_id:
        booking.hotel = db.query(Hotel).filter(Hotel.id == booking.hotel_id).first()
        # 加载城市信息
        if booking.hotel and booking.hotel.city_id:
            from app.models import City
            booking.hotel.city = db.query(City).filter(City.id == booking.hotel.city_id).first()
    
    return booking

@router.put("/{booking_id}/cancel", response_model=BookingResponseUpdated, summary="取消预订")
def cancel_booking(booking_id: int, db: Session = Depends(get_db)):
    """
    取消预订
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="预订不存在")
    
    if booking.status == "cancelled":
        raise HTTPException(status_code=400, detail="预订已取消")
    
    if booking.status == "completed":
        raise HTTPException(status_code=400, detail="已完成预订不能取消")
    
    booking.status = "cancelled"
    booking.cancel_time = datetime.now()
    db.commit()
    db.refresh(booking)
    return booking

@router.put("/{booking_id}", response_model=BookingResponseUpdated, summary="更新预订信息")
def update_booking(booking_id: int, booking_update: BookingUpdate, db: Session = Depends(get_db)):
    """
    更新预订信息（主要用于管理员修改状态）
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="预订不存在")
    
    update_data = booking_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(booking, field, value)
    
    db.commit()
    db.refresh(booking)
    return booking
