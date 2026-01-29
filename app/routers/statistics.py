# 统计分析路由
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_
from typing import List, Dict
from datetime import date, datetime, timedelta
from decimal import Decimal
from app.database import get_db
from app.models import Booking, Hotel, User, BookingStatus
from app.schemas import StatisticsResponse
import pandas as pd

router = APIRouter(prefix="/api/statistics", tags=["统计分析"])

@router.get("/overview", summary="获取统计概览")
def get_statistics_overview(
    start_date: date = Query(None, description="开始日期"),
    end_date: date = Query(None, description="结束日期"),
    hotel_id: int = Query(None, description="酒店ID（不传则统计所有酒店）"),
    db: Session = Depends(get_db)
):
    """
    获取预订统计概览
    """
    query = db.query(Booking)
    
    if start_date:
        query = query.filter(Booking.check_in_date >= start_date)
    if end_date:
        query = query.filter(Booking.check_in_date <= end_date)
    if hotel_id:
        query = query.filter(Booking.hotel_id == hotel_id)
    
    # 总预订数
    total_bookings = query.count()
    
    # 总营收
    total_revenue = query.filter(
        Booking.status.in_(["confirmed", "completed"])
    ).with_entities(func.sum(Booking.final_price)).scalar() or Decimal(0)
    
    # 按状态统计
    bookings_by_status = db.query(
        Booking.status,
        func.count(Booking.id).label('count')
    ).group_by(Booking.status).all()
    
    status_stats = [{"status": status, "count": count} for status, count in bookings_by_status]
    
    return {
        "total_bookings": total_bookings,
        "total_revenue": float(total_revenue),
        "bookings_by_status": status_stats
    }

@router.get("/by-date", summary="按日期统计预订量")
def get_statistics_by_date(
    start_date: date = Query(..., description="开始日期"),
    end_date: date = Query(..., description="结束日期"),
    group_by: str = Query("day", pattern="^(day|week|month)$", description="分组方式：day/week/month"),
    hotel_id: int = Query(None, description="酒店ID"),
    db: Session = Depends(get_db)
):
    """
    按日期统计预订量（用于生成趋势图）
    """
    query = db.query(Booking).filter(
        Booking.check_in_date >= start_date,
        Booking.check_in_date <= end_date
    )
    
    if hotel_id:
        query = query.filter(Booking.hotel_id == hotel_id)
    
    bookings = query.all()
    
    if not bookings:
        return {"dates": [], "counts": [], "revenues": []}
    
    # 使用pandas进行数据处理
    df = pd.DataFrame([{
        "date": b.check_in_date,
        "count": 1,
        "revenue": float(b.final_price) if b.status in ["confirmed", "completed"] else 0
    } for b in bookings])
    
    # 按分组方式聚合
    if group_by == "day":
        df_grouped = df.groupby("date").agg({"count": "sum", "revenue": "sum"}).reset_index()
    elif group_by == "week":
        df["week"] = df["date"].dt.to_period("W").dt.start_time
        df_grouped = df.groupby("week").agg({"count": "sum", "revenue": "sum"}).reset_index()
        df_grouped.rename(columns={"week": "date"}, inplace=True)
    elif group_by == "month":
        df["month"] = df["date"].dt.to_period("M").dt.start_time
        df_grouped = df.groupby("month").agg({"count": "sum", "revenue": "sum"}).reset_index()
        df_grouped.rename(columns={"month": "date"}, inplace=True)
    
    df_grouped = df_grouped.sort_values("date")
    
    return {
        "dates": [d.strftime("%Y-%m-%d") for d in df_grouped["date"]],
        "counts": df_grouped["count"].tolist(),
        "revenues": df_grouped["revenue"].tolist()
    }

@router.get("/by-hotel", summary="按酒店统计预订量")
def get_statistics_by_hotel(
    start_date: date = Query(None, description="开始日期"),
    end_date: date = Query(None, description="结束日期"),
    limit: int = Query(10, ge=1, le=50, description="返回前N个酒店"),
    db: Session = Depends(get_db)
):
    """
    按酒店统计预订量和营收
    """
    query = db.query(
        Hotel.id,
        Hotel.name,
        func.count(Booking.id).label('booking_count'),
        func.sum(Booking.final_price).label('total_revenue')
    ).join(Booking, Hotel.id == Booking.hotel_id)
    
    if start_date:
        query = query.filter(Booking.check_in_date >= start_date)
    if end_date:
        query = query.filter(Booking.check_in_date <= end_date)
    
    query = query.filter(
        Booking.status.in_(["confirmed", "completed"])
    ).group_by(Hotel.id, Hotel.name).order_by(func.count(Booking.id).desc()).limit(limit)
    
    results = query.all()
    
    return [{
        "hotel_id": r.id,
        "hotel_name": r.name,
        "booking_count": r.booking_count,
        "total_revenue": float(r.total_revenue or 0)
    } for r in results]

@router.get("/by-user-type", summary="按用户类型统计")
def get_statistics_by_user_type(
    start_date: date = Query(None, description="开始日期"),
    end_date: date = Query(None, description="结束日期"),
    db: Session = Depends(get_db)
):
    """
    按用户类型统计（新用户 vs 老用户）
    """
    query = db.query(Booking).filter(
        Booking.status.in_(["confirmed", "completed"])
    )
    
    if start_date:
        query = query.filter(Booking.check_in_date >= start_date)
    if end_date:
        query = query.filter(Booking.check_in_date <= end_date)
    
    bookings = query.all()
    
    # 判断每个用户是否为新用户
    new_user_count = 0
    old_user_count = 0
    new_user_revenue = Decimal(0)
    old_user_revenue = Decimal(0)
    
    user_first_booking = {}
    
    for booking in bookings:
        user_id = booking.user_id
        booking_date = booking.check_in_date
        
        if user_id not in user_first_booking:
            # 查找该用户的首次预订
            first_booking = db.query(Booking).filter(
                Booking.user_id == user_id
            ).order_by(Booking.booking_time.asc()).first()
            
            if first_booking:
                user_first_booking[user_id] = first_booking.booking_time.date()
            else:
                user_first_booking[user_id] = booking_date
        
        is_new_user = user_first_booking[user_id] == booking_date
        
        if is_new_user:
            new_user_count += 1
            new_user_revenue += booking.final_price
        else:
            old_user_count += 1
            old_user_revenue += booking.final_price
    
    return {
        "new_users": {
            "count": new_user_count,
            "revenue": float(new_user_revenue)
        },
        "old_users": {
            "count": old_user_count,
            "revenue": float(old_user_revenue)
        }
    }
