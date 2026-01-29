# 城市相关路由
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import City
from app.schemas import CityResponse

router = APIRouter(prefix="/api/cities", tags=["城市管理"])

@router.get("/", response_model=List[CityResponse], summary="获取城市列表")
def get_cities(
    is_hot: bool = Query(None, description="是否只获取热门城市"),
    db: Session = Depends(get_db)
):
    """
    获取城市列表，支持筛选热门城市
    """
    query = db.query(City)
    
    if is_hot is not None:
        query = query.filter(City.is_hot == is_hot)
    
    cities = query.order_by(City.is_hot.desc(), City.name.asc()).all()
    return cities

@router.get("/{city_id}", response_model=CityResponse, summary="获取城市详情")
def get_city(city_id: int, db: Session = Depends(get_db)):
    """
    根据ID获取城市详情
    """
    city = db.query(City).filter(City.id == city_id).first()
    if not city:
        raise HTTPException(status_code=404, detail="城市不存在")
    return city
