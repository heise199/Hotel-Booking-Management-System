# 优惠券相关路由
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.database import get_db
from app.models import Coupon, UserCoupon, User, Booking
from app.schemas import CouponCreate, CouponUpdate, CouponResponse, UserCouponResponse
from app.auth import get_current_user_optional

router = APIRouter(prefix="/api/coupons", tags=["优惠券管理"])

@router.get("/", response_model=List[CouponResponse], summary="获取优惠券列表")
def get_coupons(
    hotel_id: Optional[int] = Query(None, description="酒店ID"),
    is_active: Optional[bool] = Query(None, description="是否启用"),
    db: Session = Depends(get_db)
):
    """
    获取优惠券列表（管理员功能）
    """
    query = db.query(Coupon)
    
    if hotel_id:
        query = query.filter(
            (Coupon.hotel_id == hotel_id) | (Coupon.hotel_id.is_(None))
        )
    if is_active is not None:
        query = query.filter(Coupon.is_active == is_active)
    
    coupons = query.filter(
        Coupon.start_date <= date.today(),
        Coupon.end_date >= date.today()
    ).all()
    return coupons

@router.get("/available", response_model=List[CouponResponse], summary="获取可用优惠券列表")
def get_available_coupons(
    hotel_id: Optional[int] = Query(None, description="酒店ID"),
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    获取用户可用的优惠券列表（用户ID从JWT token获取）
    """
    # 必须登录才能查看可用优惠券
    if not current_user:
        raise HTTPException(status_code=401, detail="请先登录")
    
    user = current_user
    user_id = current_user.id  # 使用token中的用户ID
    
    query = db.query(Coupon).filter(
        Coupon.is_active == True,
        Coupon.start_date <= date.today(),
        Coupon.end_date >= date.today()
    )
    
    # 筛选适用酒店
    if hotel_id:
        query = query.filter(
            (Coupon.hotel_id == hotel_id) | (Coupon.hotel_id.is_(None))
        )
    
    # 筛选适用用户等级
    if user.vip_level:
        vip_levels = ["all", user.vip_level]
        query = query.filter(Coupon.user_level.in_(vip_levels))
    
    coupons = query.all()
    return coupons

@router.get("/my", response_model=List[UserCouponResponse], summary="获取我的优惠券")
def get_my_coupons(
    status: Optional[str] = Query(None, description="状态筛选：unused/used/expired"),
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    获取用户拥有的优惠券列表（用户ID从JWT token获取）
    """
    # 必须登录才能查看我的优惠券
    if not current_user:
        raise HTTPException(status_code=401, detail="请先登录")
    
    query = db.query(UserCoupon).filter(UserCoupon.user_id == current_user.id)  # 使用token中的用户ID
    
    if status:
        query = query.filter(UserCoupon.status == status)
    
    user_coupons = query.order_by(UserCoupon.obtained_time.desc()).all()
    
    # 加载优惠券详情
    for uc in user_coupons:
        uc.coupon = db.query(Coupon).filter(Coupon.id == uc.coupon_id).first()
    
    return user_coupons

@router.post("/", response_model=CouponResponse, summary="创建优惠券")
def create_coupon(coupon: CouponCreate, db: Session = Depends(get_db)):
    """
    创建优惠券（管理员功能）
    """
    # 检查优惠券代码是否已存在
    existing = db.query(Coupon).filter(Coupon.coupon_code == coupon.coupon_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="优惠券代码已存在")
    
    db_coupon = Coupon(**coupon.dict())
    db.add(db_coupon)
    db.commit()
    db.refresh(db_coupon)
    return db_coupon

@router.post("/obtain/{coupon_id}", response_model=UserCouponResponse, summary="领取优惠券")
def obtain_coupon(
    coupon_id: int,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    用户领取优惠券（用户ID从JWT token获取）
    """
    # 必须登录才能领取优惠券
    if not current_user:
        raise HTTPException(status_code=401, detail="请先登录")
    
    user_id = current_user.id  # 使用token中的用户ID
    
    # 检查优惠券是否存在
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="优惠券不存在")
    
    if not coupon.is_active:
        raise HTTPException(status_code=400, detail="优惠券未启用")
    
    if date.today() < coupon.start_date or date.today() > coupon.end_date:
        raise HTTPException(status_code=400, detail="优惠券不在有效期内")
    
    # 检查是否已领取
    existing = db.query(UserCoupon).filter(
        UserCoupon.user_id == user_id,
        UserCoupon.coupon_id == coupon_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="已领取过该优惠券")
    
    # 检查发放数量限制
    if coupon.total_count > 0:
        used_count = db.query(UserCoupon).filter(UserCoupon.coupon_id == coupon_id).count()
        if used_count >= coupon.total_count:
            raise HTTPException(status_code=400, detail="优惠券已领完")
    
    # 创建用户优惠券
    user_coupon = UserCoupon(
        user_id=user_id,
        coupon_id=coupon_id,
        expire_time=coupon.end_date
    )
    
    db.add(user_coupon)
    db.commit()
    db.refresh(user_coupon)
    user_coupon.coupon = coupon
    return user_coupon

@router.get("/{coupon_id}", response_model=CouponResponse, summary="获取优惠券详情")
def get_coupon(coupon_id: int, db: Session = Depends(get_db)):
    """
    根据ID获取优惠券详情
    """
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="优惠券不存在")
    return coupon
