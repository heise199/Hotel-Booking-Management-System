# 房间类型相关路由
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import RoomType, Hotel
from app.schemas import RoomTypeCreate, RoomTypeUpdate, RoomTypeResponse

router = APIRouter(prefix="/api/room-types", tags=["房间类型管理"])

@router.get("/hotel/{hotel_id}", response_model=List[RoomTypeResponse], summary="获取酒店的房间类型列表")
def get_room_types_by_hotel(hotel_id: int, db: Session = Depends(get_db)):
    """
    获取指定酒店的所有房间类型
    """
    # 检查酒店是否存在
    hotel = db.query(Hotel).filter(Hotel.id == hotel_id).first()
    if not hotel:
        raise HTTPException(status_code=404, detail="酒店不存在")
    
    room_types = db.query(RoomType).filter(RoomType.hotel_id == hotel_id).all()
    return room_types

@router.get("/{room_type_id}", response_model=RoomTypeResponse, summary="获取房间类型详情")
def get_room_type(room_type_id: int, db: Session = Depends(get_db)):
    """
    根据ID获取房间类型详情
    """
    room_type = db.query(RoomType).filter(RoomType.id == room_type_id).first()
    if not room_type:
        raise HTTPException(status_code=404, detail="房间类型不存在")
    return room_type

@router.post("/", response_model=RoomTypeResponse, summary="创建房间类型")
def create_room_type(room_type: RoomTypeCreate, db: Session = Depends(get_db)):
    """
    创建新房间类型（管理员功能）
    """
    # 检查酒店是否存在
    hotel = db.query(Hotel).filter(Hotel.id == room_type.hotel_id).first()
    if not hotel:
        raise HTTPException(status_code=404, detail="酒店不存在")
    
    db_room_type = RoomType(**room_type.dict())
    db.add(db_room_type)
    db.commit()
    db.refresh(db_room_type)
    return db_room_type

@router.put("/{room_type_id}", response_model=RoomTypeResponse, summary="更新房间类型")
def update_room_type(room_type_id: int, room_type_update: RoomTypeUpdate, db: Session = Depends(get_db)):
    """
    更新房间类型信息（管理员功能）
    """
    db_room_type = db.query(RoomType).filter(RoomType.id == room_type_id).first()
    if not db_room_type:
        raise HTTPException(status_code=404, detail="房间类型不存在")
    
    update_data = room_type_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_room_type, field, value)
    
    db.commit()
    db.refresh(db_room_type)
    return db_room_type

@router.delete("/{room_type_id}", summary="删除房间类型")
def delete_room_type(room_type_id: int, db: Session = Depends(get_db)):
    """
    删除房间类型（管理员功能）
    """
    db_room_type = db.query(RoomType).filter(RoomType.id == room_type_id).first()
    if not db_room_type:
        raise HTTPException(status_code=404, detail="房间类型不存在")
    
    db.delete(db_room_type)
    db.commit()
    return {"message": "房间类型删除成功"}
