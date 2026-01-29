# 评论相关路由
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Review, Hotel, User, Booking
from app.schemas import ReviewCreate, ReviewResponse
from app.auth import get_current_user_optional

router = APIRouter(prefix="/api/reviews", tags=["评论管理"])

@router.get("/", response_model=List[ReviewResponse], summary="获取评论列表")
def get_reviews(
    hotel_id: Optional[int] = Query(None, description="酒店ID"),
    user_id: Optional[int] = Query(None, description="用户ID"),
    status: Optional[str] = Query(None, description="审核状态"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    获取评论列表，支持按酒店、用户、状态筛选
    """
    query = db.query(Review)
    
    if hotel_id:
        query = query.filter(Review.hotel_id == hotel_id)
    if user_id:
        query = query.filter(Review.user_id == user_id)
    if status:
        query = query.filter(Review.status == status)
    
    reviews = query.order_by(Review.created_at.desc()).offset(skip).limit(limit).all()
    return reviews

@router.get("/hotel/{hotel_id}", response_model=List[ReviewResponse], summary="获取酒店的评论列表")
def get_hotel_reviews(
    hotel_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    获取指定酒店的评论列表（只返回已审核通过的）
    """
    reviews = db.query(Review).filter(
        Review.hotel_id == hotel_id,
        Review.status == "approved"
    ).order_by(Review.created_at.desc()).offset(skip).limit(limit).all()
    return reviews

@router.post("/", response_model=ReviewResponse, summary="创建评论")
def create_review(
    review: ReviewCreate, 
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    用户创建评论（用户ID从JWT token获取）
    """
    # 必须登录才能创建评论
    if not current_user:
        raise HTTPException(status_code=401, detail="请先登录")
    
    user_id = current_user.id  # 使用token中的用户ID
    
    # 检查酒店是否存在
    hotel = db.query(Hotel).filter(Hotel.id == review.hotel_id).first()
    if not hotel:
        raise HTTPException(status_code=404, detail="酒店不存在")
    
    # 如果指定了预订ID，检查预订是否存在且属于该用户
    if review.booking_id:
        booking = db.query(Booking).filter(
            Booking.id == review.booking_id,
            Booking.user_id == user_id
        ).first()
        if not booking:
            raise HTTPException(status_code=404, detail="预订不存在或不属于该用户")
    
    # 创建评论
    db_review = Review(
        user_id=user_id,
        hotel_id=review.hotel_id,
        booking_id=review.booking_id,
        rating=review.rating,
        title=review.title,
        content=review.content,
        images=review.images,
        service_rating=review.service_rating,
        cleanliness_rating=review.cleanliness_rating,
        location_rating=review.location_rating,
        value_rating=review.value_rating,
        is_anonymous=review.is_anonymous,
        status="pending"  # 默认待审核
    )
    
    db.add(db_review)
    
    # 更新酒店的评分和评论数（简化版：这里只更新评论数，评分可以后续通过定时任务计算）
    hotel.review_count = db.query(Review).filter(
        Review.hotel_id == hotel.id,
        Review.status == "approved"
    ).count() + 1
    
    db.commit()
    db.refresh(db_review)
    return db_review

@router.get("/{review_id}", response_model=ReviewResponse, summary="获取评论详情")
def get_review(review_id: int, db: Session = Depends(get_db)):
    """
    根据ID获取评论详情
    """
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="评论不存在")
    return review
