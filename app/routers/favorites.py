# 收藏相关路由
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Favorite, Hotel, User
from app.schemas import FavoriteCreate, FavoriteResponse, HotelResponse
from app.auth import get_current_user_optional

router = APIRouter(prefix="/api/favorites", tags=["收藏管理"])

@router.post("/", response_model=FavoriteResponse, summary="添加收藏")
def add_favorite(
    favorite: FavoriteCreate, 
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    用户收藏酒店（用户ID从JWT token获取）
    """
    # 必须登录才能收藏
    if not current_user:
        raise HTTPException(status_code=401, detail="请先登录")
    
    user_id = current_user.id  # 使用token中的用户ID
    
    # 检查酒店是否存在
    hotel = db.query(Hotel).filter(Hotel.id == favorite.hotel_id).first()
    if not hotel:
        raise HTTPException(status_code=404, detail="酒店不存在")
    
    # 检查是否已收藏
    existing_favorite = db.query(Favorite).filter(
        Favorite.user_id == user_id,
        Favorite.hotel_id == favorite.hotel_id
    ).first()
    
    if existing_favorite:
        raise HTTPException(status_code=400, detail="已收藏该酒店")
    
    # 创建收藏
    db_favorite = Favorite(user_id=user_id, hotel_id=favorite.hotel_id)
    db.add(db_favorite)
    db.commit()
    db.refresh(db_favorite)
    return db_favorite

@router.delete("/{favorite_id}", summary="取消收藏")
def remove_favorite(
    favorite_id: int, 
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    用户取消收藏（用户ID从JWT token获取）
    """
    # 必须登录才能取消收藏
    if not current_user:
        raise HTTPException(status_code=401, detail="请先登录")
    
    favorite = db.query(Favorite).filter(
        Favorite.id == favorite_id,
        Favorite.user_id == current_user.id  # 使用token中的用户ID
    ).first()
    
    if not favorite:
        raise HTTPException(status_code=404, detail="收藏不存在")
    
    db.delete(favorite)
    db.commit()
    return {"message": "取消收藏成功"}

@router.delete("/hotel/{hotel_id}", summary="根据酒店ID取消收藏")
def remove_favorite_by_hotel(
    hotel_id: int, 
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    根据酒店ID取消收藏（用户ID从JWT token获取）
    """
    # 必须登录才能取消收藏
    if not current_user:
        raise HTTPException(status_code=401, detail="请先登录")
    
    favorite = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,  # 使用token中的用户ID
        Favorite.hotel_id == hotel_id
    ).first()
    
    if not favorite:
        raise HTTPException(status_code=404, detail="未收藏该酒店")
    
    db.delete(favorite)
    db.commit()
    return {"message": "取消收藏成功"}

@router.get("/", response_model=List[FavoriteResponse], summary="获取收藏列表")
def get_favorites(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    获取用户的收藏列表（用户ID从JWT token获取）
    """
    # 必须登录才能查看收藏列表
    if not current_user:
        raise HTTPException(status_code=401, detail="请先登录")
    
    favorites = db.query(Favorite).filter(
        Favorite.user_id == current_user.id  # 使用token中的用户ID
    ).offset(skip).limit(limit).all()
    
    # 加载酒店信息
    for favorite in favorites:
        favorite.hotel = db.query(Hotel).filter(Hotel.id == favorite.hotel_id).first()
    
    return favorites

@router.get("/check/{hotel_id}", summary="检查是否已收藏")
def check_favorite(
    hotel_id: int, 
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    检查用户是否已收藏指定酒店（用户ID从JWT token获取）
    如果未登录，返回未收藏
    """
    if not current_user:
        return {"is_favorited": False, "favorite_id": None}
    
    favorite = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,  # 使用token中的用户ID
        Favorite.hotel_id == hotel_id
    ).first()
    
    return {"is_favorited": favorite is not None, "favorite_id": favorite.id if favorite else None}
