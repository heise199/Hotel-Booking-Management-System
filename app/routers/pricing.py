# 价格管理和促销策略路由
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Dict
from datetime import date, datetime
from decimal import Decimal
from app.database import get_db
from app.models import PriceRule, Hotel, Booking, User, PriceRuleType, Holiday
from app.schemas import PriceRuleCreate, PriceRuleUpdate, PriceRuleResponse, PriceCalculationRequest, PriceCalculationResponse
from app.auth import get_current_user_optional

router = APIRouter(prefix="/api/pricing", tags=["价格管理"])

def calculate_price(
    hotel_id: int,
    check_in_date: date,
    check_out_date: date,
    user_id: int = None,
    db: Session = None
) -> Dict:
    """
    计算预订价格（考虑所有价格规则）
    返回: {
        "base_price": 基础价格,
        "discount_rate": 总折扣率,
        "final_price": 最终价格,
        "applied_rules": 应用的规则列表
    }
    """
    # 获取酒店基础价格
    hotel = db.query(Hotel).filter(Hotel.id == hotel_id).first()
    if not hotel:
        raise HTTPException(status_code=404, detail="酒店不存在")
    
    base_price = float(hotel.base_price)
    nights = (check_out_date - check_in_date).days
    total_discount = 0.0
    applied_rules = []
    
    # 获取所有启用的价格规则
    rules = db.query(PriceRule).filter(
        PriceRule.is_active == True,
        or_(
            PriceRule.hotel_id == hotel_id,
            PriceRule.hotel_id.is_(None)
        )
    ).all()
    
    # 检查节假日
    holidays = db.query(Holiday).filter(
        Holiday.holiday_date >= check_in_date,
        Holiday.holiday_date < check_out_date
    ).all()
    is_holiday_period = len(holidays) > 0
    
    # 检查是否为新用户
    is_new_user = False
    if user_id:
        user_bookings = db.query(Booking).filter(Booking.user_id == user_id).count()
        is_new_user = user_bookings == 0
    
    # 应用各种规则
    for rule in rules:
        rule_applied = False
        
        # 将 rule_type 转换为字符串进行比较（兼容数据库中的字符串值）
        # 如果 rule_type 是枚举对象，获取其值；如果是字符串，直接使用
        if isinstance(rule.rule_type, str):
            rule_type_str = rule.rule_type
        elif hasattr(rule.rule_type, 'value'):
            rule_type_str = rule.rule_type.value
        else:
            rule_type_str = str(rule.rule_type).lower()
        
        if rule_type_str == "weekend":
            # 周末规则：检查入住日期和离店日期是否包含周末
            check_in_weekday = check_in_date.weekday() + 1  # 1=周一, 7=周日
            if rule.day_of_week and check_in_weekday == rule.day_of_week:
                total_discount += float(rule.discount_rate)
                applied_rules.append(rule.rule_name)
                rule_applied = True
            elif not rule.day_of_week and check_in_weekday >= 5:  # 周六或周日
                total_discount += float(rule.discount_rate)
                applied_rules.append(rule.rule_name)
                rule_applied = True
        
        elif rule_type_str == "holiday":
            # 节假日规则
            if is_holiday_period:
                total_discount += float(rule.discount_rate)
                applied_rules.append(rule.rule_name)
                rule_applied = True
        
        elif rule_type_str == "season":
            # 季节性规则
            if rule.start_date and rule.end_date:
                if rule.start_date <= check_in_date <= rule.end_date:
                    total_discount += float(rule.discount_rate)
                    applied_rules.append(rule.rule_name)
                    rule_applied = True
        
        elif rule_type_str == "new_user":
            # 新用户规则
            if is_new_user:
                total_discount += float(rule.discount_rate)
                applied_rules.append(rule.rule_name)
                rule_applied = True
        
        elif rule_type_str == "long_stay":
            # 连住优惠
            if rule.min_nights and nights >= rule.min_nights:
                total_discount += float(rule.discount_rate)
                applied_rules.append(rule.rule_name)
                rule_applied = True
    
    # 计算最终价格（折扣率可以是负数表示涨价）
    final_price = base_price * (1 - total_discount / 100.0)
    if final_price < 0:
        final_price = 0
    
    return {
        "base_price": Decimal(str(base_price)),
        "discount_rate": Decimal(str(total_discount)),
        "final_price": Decimal(str(final_price)),
        "applied_rules": applied_rules
    }

@router.post("/calculate", response_model=PriceCalculationResponse, summary="计算预订价格")
def calculate_booking_price(
    request: PriceCalculationRequest, 
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    计算预订价格（考虑所有价格规则）
    """
    # 确定用户ID：优先使用token中的用户，忽略请求中的user_id（安全考虑）
    user_id = current_user.id if current_user else request.user_id
    
    result = calculate_price(
        hotel_id=request.hotel_id,
        check_in_date=request.check_in_date,
        check_out_date=request.check_out_date,
        user_id=user_id,
        db=db
    )
    return PriceCalculationResponse(**result)

@router.get("/rules", response_model=List[PriceRuleResponse], summary="获取价格规则列表")
def get_price_rules(
    hotel_id: int = None,
    is_active: bool = None,
    db: Session = Depends(get_db)
):
    """
    获取价格规则列表
    """
    query = db.query(PriceRule)
    
    if hotel_id:
        query = query.filter(
            or_(
                PriceRule.hotel_id == hotel_id,
                PriceRule.hotel_id.is_(None)
            )
        )
    
    if is_active is not None:
        query = query.filter(PriceRule.is_active == is_active)
    
    rules = query.all()
    return rules

@router.post("/rules", response_model=PriceRuleResponse, summary="创建价格规则")
def create_price_rule(rule: PriceRuleCreate, db: Session = Depends(get_db)):
    """
    创建价格规则（管理员功能）
    """
    db_rule = PriceRule(**rule.dict())
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule

@router.put("/rules/{rule_id}", response_model=PriceRuleResponse, summary="更新价格规则")
def update_price_rule(rule_id: int, rule_update: PriceRuleUpdate, db: Session = Depends(get_db)):
    """
    更新价格规则（管理员功能）
    """
    db_rule = db.query(PriceRule).filter(PriceRule.id == rule_id).first()
    if not db_rule:
        raise HTTPException(status_code=404, detail="价格规则不存在")
    
    update_data = rule_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_rule, field, value)
    
    db.commit()
    db.refresh(db_rule)
    return db_rule

@router.delete("/rules/{rule_id}", summary="删除价格规则")
def delete_price_rule(rule_id: int, db: Session = Depends(get_db)):
    """
    删除价格规则（管理员功能）
    """
    db_rule = db.query(PriceRule).filter(PriceRule.id == rule_id).first()
    if not db_rule:
        raise HTTPException(status_code=404, detail="价格规则不存在")
    
    db.delete(db_rule)
    db.commit()
    return {"message": "价格规则删除成功"}
