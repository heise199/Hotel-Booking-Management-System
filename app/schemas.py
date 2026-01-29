# Pydantic模式定义（用于请求和响应验证）
from __future__ import annotations
from pydantic import BaseModel, Field, field_serializer
from typing import Optional, List
from datetime import date, datetime, time
from decimal import Decimal

# ========== 用户相关模式 ==========

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="用户名")
    email: Optional[str] = None
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="密码")

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# ========== 酒店相关模式 ==========

class HotelBase(BaseModel):
    name: str = Field(..., max_length=200, description="酒店名称")
    address: str = Field(..., max_length=500, description="酒店地址")
    description: Optional[str] = None
    tags: Optional[str] = None  # JSON字符串
    base_price: Decimal = Field(..., ge=0, description="基础价格")
    nearby_attractions: Optional[str] = None  # JSON字符串
    images: Optional[str] = None  # JSON字符串
    rating: Optional[Decimal] = Field(default=0.00, ge=0, le=5)
    total_rooms: Optional[int] = Field(default=0, ge=0)
    available_rooms: Optional[int] = Field(default=0, ge=0)

class HotelCreate(HotelBase):
    pass

class HotelUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None
    base_price: Optional[Decimal] = None
    nearby_attractions: Optional[str] = None
    images: Optional[str] = None
    rating: Optional[Decimal] = None
    total_rooms: Optional[int] = None
    available_rooms: Optional[int] = None

class HotelResponse(HotelBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# ========== 预订相关模式 ==========

class BookingBase(BaseModel):
    hotel_id: int = Field(..., description="酒店ID")
    check_in_date: date = Field(..., description="入住日期")
    check_out_date: date = Field(..., description="离店日期")
    room_count: int = Field(default=1, ge=1, description="房间数量")
    notes: Optional[str] = None

class BookingCreate(BookingBase):
    pass

class BookingResponse(BookingBase):
    id: int
    user_id: int
    nights: int
    base_price: Decimal
    discount_rate: Decimal
    final_price: Decimal
    status: str
    booking_time: datetime
    cancel_time: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class BookingUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

# ========== 收藏相关模式 ==========

class FavoriteCreate(BaseModel):
    hotel_id: int = Field(..., description="酒店ID")

class FavoriteResponse(BaseModel):
    id: int
    user_id: int
    hotel_id: int
    created_at: datetime
    hotel: Optional[HotelResponse] = None
    
    class Config:
        from_attributes = True

# ========== 价格规则相关模式 ==========

class PriceRuleBase(BaseModel):
    rule_name: str = Field(..., max_length=100, description="规则名称")
    rule_type: str = Field(..., description="规则类型")
    hotel_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    day_of_week: Optional[int] = Field(None, ge=1, le=7)
    min_nights: Optional[int] = Field(None, ge=1)
    discount_rate: Decimal = Field(..., description="折扣率")
    is_active: bool = Field(default=True)
    description: Optional[str] = None

class PriceRuleCreate(PriceRuleBase):
    pass

class PriceRuleUpdate(BaseModel):
    rule_name: Optional[str] = None
    rule_type: Optional[str] = None
    hotel_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    day_of_week: Optional[int] = None
    min_nights: Optional[int] = None
    discount_rate: Optional[Decimal] = None
    is_active: Optional[bool] = None
    description: Optional[str] = None

class PriceRuleResponse(PriceRuleBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# ========== 统计相关模式 ==========

class StatisticsResponse(BaseModel):
    total_bookings: int
    total_revenue: Decimal
    bookings_by_date: List[dict]
    bookings_by_hotel: List[dict]
    bookings_by_status: List[dict]

class PriceCalculationRequest(BaseModel):
    hotel_id: int
    check_in_date: date
    check_out_date: date
    user_id: Optional[int] = None  # 用于判断是否为新用户

class PriceCalculationResponse(BaseModel):
    base_price: Decimal
    discount_rate: Decimal
    final_price: Decimal
    applied_rules: List[str]  # 应用的规则名称列表

# ========== 城市相关模式 ==========

class CityBase(BaseModel):
    name: str = Field(..., max_length=50, description="城市名称")
    province: Optional[str] = None
    code: Optional[str] = None
    is_hot: bool = Field(default=False)

class CityResponse(CityBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# ========== 房间类型相关模式 ==========

class RoomTypeBase(BaseModel):
    hotel_id: int
    type_name: str = Field(..., max_length=100, description="房间类型名称")
    description: Optional[str] = None
    area: Optional[Decimal] = None
    max_occupancy: int = Field(default=2, ge=1)
    bed_type: Optional[str] = None
    base_price: Decimal = Field(..., ge=0)
    total_count: int = Field(default=0, ge=0)
    available_count: int = Field(default=0, ge=0)
    images: Optional[str] = None
    facilities: Optional[str] = None

class RoomTypeCreate(RoomTypeBase):
    pass

class RoomTypeUpdate(BaseModel):
    type_name: Optional[str] = None
    description: Optional[str] = None
    area: Optional[Decimal] = None
    max_occupancy: Optional[int] = None
    bed_type: Optional[str] = None
    base_price: Optional[Decimal] = None
    total_count: Optional[int] = None
    available_count: Optional[int] = None
    images: Optional[str] = None
    facilities: Optional[str] = None

class RoomTypeResponse(RoomTypeBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# ========== 评论相关模式 ==========

class ReviewBase(BaseModel):
    hotel_id: int
    booking_id: Optional[int] = None
    rating: Decimal = Field(..., ge=1, le=5, description="评分（1-5分）")
    title: Optional[str] = Field(None, max_length=200)
    content: Optional[str] = None
    images: Optional[str] = None
    service_rating: Optional[Decimal] = Field(None, ge=1, le=5)
    cleanliness_rating: Optional[Decimal] = Field(None, ge=1, le=5)
    location_rating: Optional[Decimal] = Field(None, ge=1, le=5)
    value_rating: Optional[Decimal] = Field(None, ge=1, le=5)
    is_anonymous: bool = Field(default=False)

class ReviewCreate(ReviewBase):
    pass

class ReviewResponse(ReviewBase):
    id: int
    user_id: int
    helpful_count: int
    reply_content: Optional[str] = None
    reply_time: Optional[datetime] = None
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# ========== 优惠券相关模式 ==========

class CouponBase(BaseModel):
    coupon_code: str = Field(..., max_length=50, description="优惠券代码")
    coupon_name: str = Field(..., max_length=100, description="优惠券名称")
    coupon_type: str = Field(..., description="优惠类型")
    discount_rate: Optional[Decimal] = None
    discount_amount: Optional[Decimal] = None
    min_amount: Decimal = Field(default=0.00, ge=0)
    max_discount: Optional[Decimal] = None
    total_count: int = Field(default=0, ge=0)
    start_date: date
    end_date: date
    hotel_id: Optional[int] = None
    user_level: str = Field(default="all")
    is_active: bool = Field(default=True)
    description: Optional[str] = None

class CouponCreate(CouponBase):
    pass

class CouponUpdate(BaseModel):
    coupon_name: Optional[str] = None
    discount_rate: Optional[Decimal] = None
    discount_amount: Optional[Decimal] = None
    min_amount: Optional[Decimal] = None
    max_discount: Optional[Decimal] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None
    description: Optional[str] = None

class CouponResponse(CouponBase):
    id: int
    used_count: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class UserCouponResponse(BaseModel):
    id: int
    user_id: int
    coupon_id: int
    status: str
    used_time: Optional[datetime] = None
    booking_id: Optional[int] = None
    obtained_time: datetime
    expire_time: Optional[datetime] = None
    coupon: Optional[CouponResponse] = None
    
    class Config:
        from_attributes = True

# ========== 更新现有模式以支持新字段 ==========

class UserResponseUpdated(UserBase):
    id: int
    real_name: Optional[str] = None
    gender: Optional[str] = None
    vip_level: str = "normal"
    points: int = 0
    role: str
    status: str = "active"
    created_at: datetime
    
    class Config:
        from_attributes = True

class HotelResponseUpdated(HotelBase):
    id: int
    city_id: Optional[int] = None
    review_count: int = 0
    star_level: int = 3
    check_in_time: Optional[time] = None
    check_out_time: Optional[time] = None
    phone: Optional[str] = None
    longitude: Optional[Decimal] = None
    latitude: Optional[Decimal] = None
    facilities: Optional[str] = None
    parking_info: Optional[str] = None
    wifi_info: Optional[str] = None
    is_recommended: bool = False
    view_count: int = 0
    created_at: datetime
    updated_at: datetime
    city: Optional[CityResponse] = None
    
    @field_serializer('check_in_time', 'check_out_time')
    def serialize_time(self, value: Optional[time], _info) -> Optional[str]:
        """将 time 对象序列化为字符串"""
        if value is None:
            return None
        return value.strftime('%H:%M:%S')
    
    class Config:
        from_attributes = True

class BookingResponseUpdated(BookingBase):
    id: int
    booking_no: str
    user_id: int
    room_type_id: Optional[int] = None
    nights: int
    guest_name: Optional[str] = None
    guest_phone: Optional[str] = None
    base_price: Decimal
    discount_rate: Decimal
    coupon_discount: Decimal = Decimal("0.00")
    final_price: Decimal
    payment_method: Optional[str] = None
    payment_status: str = "unpaid"
    status: str
    booking_time: datetime
    confirm_time: Optional[datetime] = None
    cancel_time: Optional[datetime] = None
    cancel_reason: Optional[str] = None
    hotel: Optional["HotelResponseUpdated"] = None  # 酒店信息
    
    class Config:
        from_attributes = True
