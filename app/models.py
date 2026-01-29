# 数据库模型定义
from sqlalchemy import Column, Integer, String, Text, DECIMAL, Enum, Date, Time, TIMESTAMP, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

# 用户角色枚举
class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"

# 用户性别枚举
class UserGender(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

# 会员等级枚举
class VipLevel(str, enum.Enum):
    NORMAL = "normal"
    SILVER = "silver"
    GOLD = "gold"
    PLATINUM = "platinum"

# 用户状态枚举
class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    BANNED = "banned"

# 预订状态枚举
class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    NO_SHOW = "no_show"

# 支付方式枚举
class PaymentMethod(str, enum.Enum):
    ALIPAY = "alipay"
    WECHAT = "wechat"
    BANK_CARD = "bank_card"
    CASH = "cash"
    POINTS = "points"

# 支付状态枚举
class PaymentStatus(str, enum.Enum):
    UNPAID = "unpaid"
    PAID = "paid"
    REFUNDED = "refunded"
    PARTIAL_REFUND = "partial_refund"

# 评论状态枚举
class ReviewStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

# 优惠券类型枚举
class CouponType(str, enum.Enum):
    DISCOUNT = "discount"
    CASH = "cash"
    FULL_REDUCTION = "full_reduction"

# 用户优惠券状态枚举
class UserCouponStatus(str, enum.Enum):
    UNUSED = "unused"
    USED = "used"
    EXPIRED = "expired"

# 价格规则类型枚举
class PriceRuleType(str, enum.Enum):
    SEASON = "season"
    WEEKEND = "weekend"
    HOLIDAY = "holiday"
    NEW_USER = "new_user"
    LONG_STAY = "long_stay"
    CUSTOM = "custom"

# 城市模型
class City(Base):
    __tablename__ = "cities"
    
    id = Column(Integer, primary_key=True, index=True, comment="城市ID")
    name = Column(String(50), nullable=False, index=True, comment="城市名称")
    province = Column(String(50), comment="省份")
    code = Column(String(10), comment="城市代码")
    is_hot = Column(Boolean, default=False, index=True, comment="是否热门城市")
    created_at = Column(TIMESTAMP, server_default=func.now(), comment="创建时间")
    
    # 关系
    hotels = relationship("Hotel", back_populates="city", cascade="all, delete-orphan")

# 用户模型
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True, comment="用户ID")
    username = Column(String(50), unique=True, nullable=False, index=True, comment="用户名")
    password = Column(String(255), nullable=False, comment="密码（加密）")
    email = Column(String(100), index=True, comment="邮箱")
    phone = Column(String(20), index=True, comment="手机号")
    real_name = Column(String(50), comment="真实姓名")
    gender = Column(String(10), comment="性别")
    birthday = Column(Date, comment="生日")
    avatar = Column(String(500), comment="头像URL")
    points = Column(Integer, default=0, comment="积分")
    vip_level = Column(String(20), default="normal", index=True, comment="会员等级")
    role = Column(String(20), default="user", comment="角色")
    status = Column(String(20), default="active", comment="账户状态")
    last_login_time = Column(TIMESTAMP, nullable=True, comment="最后登录时间")
    created_at = Column(TIMESTAMP, server_default=func.now(), comment="创建时间")
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), comment="更新时间")
    
    # 关系
    bookings = relationship("Booking", back_populates="user", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")
    user_coupons = relationship("UserCoupon", back_populates="user", cascade="all, delete-orphan")

# 酒店模型
class Hotel(Base):
    __tablename__ = "hotels"
    
    id = Column(Integer, primary_key=True, index=True, comment="酒店ID")
    name = Column(String(200), nullable=False, index=True, comment="酒店名称")
    city_id = Column(Integer, ForeignKey("cities.id", ondelete="SET NULL"), index=True, comment="城市ID")
    address = Column(String(500), nullable=False, comment="酒店地址")
    description = Column(Text, comment="酒店描述")
    tags = Column(String(500), comment="特色标签（JSON格式）")
    base_price = Column(DECIMAL(10, 2), nullable=False, default=0.00, index=True, comment="基础价格")
    nearby_attractions = Column(Text, comment="附近景点信息（JSON格式）")
    images = Column(Text, comment="酒店图片（JSON格式）")
    rating = Column(DECIMAL(3, 2), default=0.00, index=True, comment="评分")
    review_count = Column(Integer, default=0, comment="评论数量")
    star_level = Column(Integer, default=3, index=True, comment="星级（1-5星）")
    total_rooms = Column(Integer, default=0, comment="总房间数")
    available_rooms = Column(Integer, default=0, comment="可用房间数")
    check_in_time = Column(Time, default="14:00:00", comment="入住时间")
    check_out_time = Column(Time, default="12:00:00", comment="退房时间")
    phone = Column(String(20), comment="联系电话")
    longitude = Column(DECIMAL(10, 7), comment="经度")
    latitude = Column(DECIMAL(10, 7), comment="纬度")
    facilities = Column(Text, comment="酒店设施（JSON格式）")
    parking_info = Column(String(200), comment="停车信息")
    wifi_info = Column(String(200), comment="WiFi信息")
    is_recommended = Column(Boolean, default=False, index=True, comment="是否推荐")
    view_count = Column(Integer, default=0, comment="浏览次数")
    created_at = Column(TIMESTAMP, server_default=func.now(), comment="创建时间")
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), comment="更新时间")
    
    # 关系
    city = relationship("City", back_populates="hotels")
    bookings = relationship("Booking", back_populates="hotel", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="hotel", cascade="all, delete-orphan")
    price_rules = relationship("PriceRule", back_populates="hotel", cascade="all, delete-orphan")
    room_types = relationship("RoomType", back_populates="hotel", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="hotel", cascade="all, delete-orphan")
    coupons = relationship("Coupon", back_populates="hotel", cascade="all, delete-orphan")

# 房间类型模型
class RoomType(Base):
    __tablename__ = "room_types"
    
    id = Column(Integer, primary_key=True, index=True, comment="房间类型ID")
    hotel_id = Column(Integer, ForeignKey("hotels.id", ondelete="CASCADE"), nullable=False, index=True, comment="酒店ID")
    type_name = Column(String(100), nullable=False, index=True, comment="房间类型名称")
    description = Column(Text, comment="房间描述")
    area = Column(DECIMAL(5, 2), comment="房间面积（平方米）")
    max_occupancy = Column(Integer, default=2, comment="最大入住人数")
    bed_type = Column(String(50), comment="床型")
    base_price = Column(DECIMAL(10, 2), nullable=False, comment="基础价格")
    total_count = Column(Integer, default=0, comment="该类型房间总数")
    available_count = Column(Integer, default=0, comment="可用房间数")
    images = Column(Text, comment="房间图片（JSON格式）")
    facilities = Column(Text, comment="房间设施（JSON格式）")
    created_at = Column(TIMESTAMP, server_default=func.now(), comment="创建时间")
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), comment="更新时间")
    
    # 关系
    hotel = relationship("Hotel", back_populates="room_types")
    bookings = relationship("Booking", back_populates="room_type")

# 预订模型
class Booking(Base):
    __tablename__ = "bookings"
    
    id = Column(Integer, primary_key=True, index=True, comment="预订ID")
    booking_no = Column(String(50), unique=True, nullable=False, index=True, comment="预订编号")
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True, comment="用户ID")
    hotel_id = Column(Integer, ForeignKey("hotels.id", ondelete="CASCADE"), nullable=False, index=True, comment="酒店ID")
    room_type_id = Column(Integer, ForeignKey("room_types.id", ondelete="SET NULL"), comment="房间类型ID")
    check_in_date = Column(Date, nullable=False, index=True, comment="入住日期")
    check_out_date = Column(Date, nullable=False, comment="离店日期")
    nights = Column(Integer, nullable=False, comment="入住天数")
    room_count = Column(Integer, nullable=False, default=1, comment="房间数量")
    guest_name = Column(String(50), comment="入住人姓名")
    guest_phone = Column(String(20), comment="入住人电话")
    base_price = Column(DECIMAL(10, 2), nullable=False, comment="基础价格")
    discount_rate = Column(DECIMAL(5, 2), default=0.00, comment="折扣率")
    coupon_discount = Column(DECIMAL(10, 2), default=0.00, comment="优惠券折扣金额")
    final_price = Column(DECIMAL(10, 2), nullable=False, comment="最终支付价格")
    payment_method = Column(String(20), comment="支付方式")
    payment_status = Column(String(20), default="unpaid", index=True, comment="支付状态")
    status = Column(String(20), default="pending", index=True, comment="预订状态")
    booking_time = Column(TIMESTAMP, server_default=func.now(), index=True, comment="预订时间")
    confirm_time = Column(TIMESTAMP, nullable=True, comment="确认时间")
    cancel_time = Column(TIMESTAMP, nullable=True, comment="取消时间")
    cancel_reason = Column(String(500), comment="取消原因")
    notes = Column(Text, comment="备注信息")
    
    # 关系
    user = relationship("User", back_populates="bookings")
    hotel = relationship("Hotel", back_populates="bookings")
    room_type = relationship("RoomType", back_populates="bookings")
    reviews = relationship("Review", back_populates="booking", cascade="all, delete-orphan")
    user_coupons = relationship("UserCoupon", back_populates="booking")

# 收藏模型
class Favorite(Base):
    __tablename__ = "favorites"
    
    id = Column(Integer, primary_key=True, index=True, comment="收藏ID")
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True, comment="用户ID")
    hotel_id = Column(Integer, ForeignKey("hotels.id", ondelete="CASCADE"), nullable=False, index=True, comment="酒店ID")
    created_at = Column(TIMESTAMP, server_default=func.now(), comment="收藏时间")
    
    # 关系
    user = relationship("User", back_populates="favorites")
    hotel = relationship("Hotel", back_populates="favorites")

# 价格规则模型
class PriceRule(Base):
    __tablename__ = "price_rules"
    
    id = Column(Integer, primary_key=True, index=True, comment="规则ID")
    rule_name = Column(String(100), nullable=False, comment="规则名称")
    rule_type = Column(String(20), nullable=False, index=True, comment="规则类型")
    hotel_id = Column(Integer, ForeignKey("hotels.id", ondelete="CASCADE"), nullable=True, index=True, comment="酒店ID")
    start_date = Column(Date, nullable=True, comment="开始日期")
    end_date = Column(Date, nullable=True, comment="结束日期")
    day_of_week = Column(Integer, nullable=True, comment="星期几（1-7）")
    min_nights = Column(Integer, nullable=True, comment="最少入住天数")
    discount_rate = Column(DECIMAL(5, 2), nullable=False, default=0.00, comment="折扣率")
    is_active = Column(Boolean, default=True, index=True, comment="是否启用")
    description = Column(Text, comment="规则描述")
    created_at = Column(TIMESTAMP, server_default=func.now(), comment="创建时间")
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), comment="更新时间")
    
    # 关系
    hotel = relationship("Hotel", back_populates="price_rules")

# 评论模型
class Review(Base):
    __tablename__ = "reviews"
    
    id = Column(Integer, primary_key=True, index=True, comment="评论ID")
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True, comment="用户ID")
    hotel_id = Column(Integer, ForeignKey("hotels.id", ondelete="CASCADE"), nullable=False, index=True, comment="酒店ID")
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="SET NULL"), comment="预订ID")
    rating = Column(DECIMAL(2, 1), nullable=False, index=True, comment="评分（1-5分）")
    title = Column(String(200), comment="评论标题")
    content = Column(Text, comment="评论内容")
    images = Column(Text, comment="评论图片（JSON格式）")
    service_rating = Column(DECIMAL(2, 1), comment="服务评分")
    cleanliness_rating = Column(DECIMAL(2, 1), comment="清洁度评分")
    location_rating = Column(DECIMAL(2, 1), comment="位置评分")
    value_rating = Column(DECIMAL(2, 1), comment="性价比评分")
    is_anonymous = Column(Boolean, default=False, comment="是否匿名")
    helpful_count = Column(Integer, default=0, comment="有用数")
    reply_content = Column(Text, comment="商家回复内容")
    reply_time = Column(TIMESTAMP, nullable=True, comment="回复时间")
    status = Column(String(20), default="pending", index=True, comment="审核状态")
    created_at = Column(TIMESTAMP, server_default=func.now(), index=True, comment="创建时间")
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), comment="更新时间")
    
    # 关系
    user = relationship("User", back_populates="reviews")
    hotel = relationship("Hotel", back_populates="reviews")
    booking = relationship("Booking", back_populates="reviews")

# 优惠券模型
class Coupon(Base):
    __tablename__ = "coupons"
    
    id = Column(Integer, primary_key=True, index=True, comment="优惠券ID")
    coupon_code = Column(String(50), unique=True, nullable=False, index=True, comment="优惠券代码")
    coupon_name = Column(String(100), nullable=False, comment="优惠券名称")
    coupon_type = Column(String(20), nullable=False, comment="优惠类型")
    discount_rate = Column(DECIMAL(5, 2), comment="折扣率")
    discount_amount = Column(DECIMAL(10, 2), comment="优惠金额")
    min_amount = Column(DECIMAL(10, 2), default=0.00, comment="最低使用金额")
    max_discount = Column(DECIMAL(10, 2), comment="最大优惠金额")
    total_count = Column(Integer, default=0, comment="发放总数")
    used_count = Column(Integer, default=0, comment="已使用数量")
    start_date = Column(Date, nullable=False, index=True, comment="开始日期")
    end_date = Column(Date, nullable=False, index=True, comment="结束日期")
    hotel_id = Column(Integer, ForeignKey("hotels.id", ondelete="CASCADE"), index=True, comment="适用酒店ID")
    user_level = Column(String(20), default="normal", comment="适用用户等级")
    is_active = Column(Boolean, default=True, index=True, comment="是否启用")
    description = Column(Text, comment="优惠券描述")
    created_at = Column(TIMESTAMP, server_default=func.now(), comment="创建时间")
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), comment="更新时间")
    
    # 关系
    hotel = relationship("Hotel", back_populates="coupons")
    user_coupons = relationship("UserCoupon", back_populates="coupon", cascade="all, delete-orphan")

# 用户优惠券模型
class UserCoupon(Base):
    __tablename__ = "user_coupons"
    
    id = Column(Integer, primary_key=True, index=True, comment="ID")
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True, comment="用户ID")
    coupon_id = Column(Integer, ForeignKey("coupons.id", ondelete="CASCADE"), nullable=False, index=True, comment="优惠券ID")
    status = Column(String(20), default="unused", index=True, comment="状态")
    used_time = Column(TIMESTAMP, nullable=True, comment="使用时间")
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="SET NULL"), comment="使用的预订ID")
    obtained_time = Column(TIMESTAMP, server_default=func.now(), comment="获得时间")
    expire_time = Column(TIMESTAMP, nullable=True, comment="过期时间")
    
    # 关系
    user = relationship("User", back_populates="user_coupons")
    coupon = relationship("Coupon", back_populates="user_coupons")
    booking = relationship("Booking", back_populates="user_coupons")

# 节假日模型
class Holiday(Base):
    __tablename__ = "holidays"
    
    id = Column(Integer, primary_key=True, index=True, comment="节假日ID")
    holiday_name = Column(String(100), nullable=False, comment="节假日名称")
    holiday_date = Column(Date, nullable=False, unique=True, index=True, comment="节假日日期")
    is_national = Column(Boolean, default=True, comment="是否为国家法定节假日")
    created_at = Column(TIMESTAMP, server_default=func.now(), comment="创建时间")
