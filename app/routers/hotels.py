# 酒店相关路由
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Hotel, City
from app.schemas import HotelCreate, HotelUpdate, HotelResponseUpdated
import json

router = APIRouter(prefix="/api/hotels", tags=["酒店管理"])

@router.get("/", response_model=List[HotelResponseUpdated], summary="获取酒店列表")
def get_hotels(
    skip: int = Query(0, ge=0, description="跳过记录数"),
    limit: int = Query(100, ge=1, le=100, description="返回记录数"),
    name: Optional[str] = Query(None, description="酒店名称（模糊搜索）"),
    city_id: Optional[int] = Query(None, description="城市ID"),
    min_price: Optional[float] = Query(None, ge=0, description="最低价格"),
    max_price: Optional[float] = Query(None, ge=0, description="最高价格"),
    tag: Optional[str] = Query(None, description="标签筛选"),
    star_level: Optional[int] = Query(None, ge=1, le=5, description="星级筛选"),
    min_rating: Optional[float] = Query(None, ge=0, le=5, description="最低评分"),
    is_recommended: Optional[bool] = Query(None, description="是否推荐"),
    db: Session = Depends(get_db)
):
    """
    获取酒店列表，支持分页和筛选
    """
    query = db.query(Hotel)
    
    # 名称模糊搜索
    if name:
        query = query.filter(Hotel.name.like(f"%{name}%"))
    
    # 城市筛选
    if city_id:
        query = query.filter(Hotel.city_id == city_id)
    
    # 价格范围筛选
    if min_price is not None:
        query = query.filter(Hotel.base_price >= min_price)
    if max_price is not None:
        query = query.filter(Hotel.base_price <= max_price)
    
    # 标签筛选
    if tag:
        query = query.filter(Hotel.tags.like(f"%{tag}%"))
    
    # 星级筛选
    if star_level:
        query = query.filter(Hotel.star_level == star_level)
    
    # 评分筛选
    if min_rating is not None:
        query = query.filter(Hotel.rating >= min_rating)
    
    # 推荐筛选
    if is_recommended is not None:
        query = query.filter(Hotel.is_recommended == is_recommended)
    
    hotels = query.order_by(Hotel.is_recommended.desc(), Hotel.rating.desc()).offset(skip).limit(limit).all()
    
    # 加载城市信息
    for hotel in hotels:
        if hotel.city_id:
            hotel.city = db.query(City).filter(City.id == hotel.city_id).first()
    
    return hotels

@router.get("/{hotel_id}", response_model=HotelResponseUpdated, summary="获取酒店详情")
def get_hotel(hotel_id: int, db: Session = Depends(get_db)):
    """
    根据ID获取酒店详情
    """
    hotel = db.query(Hotel).filter(Hotel.id == hotel_id).first()
    if not hotel:
        raise HTTPException(status_code=404, detail="酒店不存在")
    
    # 增加浏览次数
    hotel.view_count = (hotel.view_count or 0) + 1
    db.commit()
    
    # 加载城市信息
    if hotel.city_id:
        hotel.city = db.query(City).filter(City.id == hotel.city_id).first()
    
    return hotel

@router.post("/", response_model=HotelResponseUpdated, summary="创建酒店")
def create_hotel(hotel: HotelCreate, db: Session = Depends(get_db)):
    """
    创建新酒店（管理员功能）
    """
    # 检查酒店名称是否已存在
    existing_hotel = db.query(Hotel).filter(Hotel.name == hotel.name).first()
    if existing_hotel:
        raise HTTPException(status_code=400, detail="酒店名称已存在")
    
    db_hotel = Hotel(**hotel.dict())
    db.add(db_hotel)
    db.commit()
    db.refresh(db_hotel)
    return db_hotel

@router.put("/{hotel_id}", response_model=HotelResponseUpdated, summary="更新酒店信息")
def update_hotel(hotel_id: int, hotel_update: HotelUpdate, db: Session = Depends(get_db)):
    """
    更新酒店信息（管理员功能）
    """
    db_hotel = db.query(Hotel).filter(Hotel.id == hotel_id).first()
    if not db_hotel:
        raise HTTPException(status_code=404, detail="酒店不存在")
    
    # 更新字段
    update_data = hotel_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_hotel, field, value)
    
    db.commit()
    db.refresh(db_hotel)
    return db_hotel

@router.delete("/{hotel_id}", summary="删除酒店")
def delete_hotel(hotel_id: int, db: Session = Depends(get_db)):
    """
    删除酒店（管理员功能）
    """
    db_hotel = db.query(Hotel).filter(Hotel.id == hotel_id).first()
    if not db_hotel:
        raise HTTPException(status_code=404, detail="酒店不存在")
    
    db.delete(db_hotel)
    db.commit()
    return {"message": "酒店删除成功"}

@router.get("/{hotel_id}/tags", summary="获取酒店标签列表")
def get_hotel_tags(hotel_id: int, db: Session = Depends(get_db)):
    """
    获取酒店标签列表（解析JSON）
    """
    hotel = db.query(Hotel).filter(Hotel.id == hotel_id).first()
    if not hotel:
        raise HTTPException(status_code=404, detail="酒店不存在")
    
    try:
        tags = json.loads(hotel.tags) if hotel.tags else []
    except:
        tags = []
    
    return {"tags": tags}
