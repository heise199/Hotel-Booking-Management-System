-- 在线酒店预订系统数据库表结构
-- 字符集: utf8mb4
-- 排序规则: utf8mb4_unicode_ci

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS hotel_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hotel_booking;

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码（加密）',
    email VARCHAR(100) COMMENT '邮箱',
    phone VARCHAR(20) COMMENT '手机号',
    real_name VARCHAR(50) COMMENT '真实姓名',
    gender ENUM('male', 'female', 'other') COMMENT '性别',
    birthday DATE COMMENT '生日',
    avatar VARCHAR(500) COMMENT '头像URL',
    points INT DEFAULT 0 COMMENT '积分',
    vip_level ENUM('normal', 'silver', 'gold', 'platinum') DEFAULT 'normal' COMMENT '会员等级',
    role ENUM('user', 'admin') DEFAULT 'user' COMMENT '角色：user-普通用户，admin-管理员',
    status ENUM('active', 'inactive', 'banned') DEFAULT 'active' COMMENT '账户状态',
    last_login_time TIMESTAMP NULL COMMENT '最后登录时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_vip_level (vip_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 2. 城市表
CREATE TABLE IF NOT EXISTS cities (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '城市ID',
    name VARCHAR(50) NOT NULL COMMENT '城市名称',
    province VARCHAR(50) COMMENT '省份',
    code VARCHAR(10) COMMENT '城市代码',
    is_hot TINYINT(1) DEFAULT 0 COMMENT '是否热门城市：1-是，0-否',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_name (name),
    INDEX idx_is_hot (is_hot)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='城市表';

-- 3. 酒店表
CREATE TABLE IF NOT EXISTS hotels (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '酒店ID',
    name VARCHAR(200) NOT NULL COMMENT '酒店名称',
    city_id INT COMMENT '城市ID',
    address VARCHAR(500) NOT NULL COMMENT '酒店地址',
    description TEXT COMMENT '酒店描述',
    tags VARCHAR(500) COMMENT '特色标签（JSON格式，如：["亲子","商务","海景"]）',
    base_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '基础价格（元/晚）',
    nearby_attractions TEXT COMMENT '附近景点信息（JSON格式）',
    images TEXT COMMENT '酒店图片（JSON格式，存储图片URL数组）',
    rating DECIMAL(3, 2) DEFAULT 0.00 COMMENT '评分（0-5分）',
    review_count INT DEFAULT 0 COMMENT '评论数量',
    star_level TINYINT DEFAULT 3 COMMENT '星级（1-5星）',
    total_rooms INT DEFAULT 0 COMMENT '总房间数',
    available_rooms INT DEFAULT 0 COMMENT '可用房间数',
    check_in_time TIME DEFAULT '14:00:00' COMMENT '入住时间',
    check_out_time TIME DEFAULT '12:00:00' COMMENT '退房时间',
    phone VARCHAR(20) COMMENT '联系电话',
    longitude DECIMAL(10, 7) COMMENT '经度',
    latitude DECIMAL(10, 7) COMMENT '纬度',
    facilities TEXT COMMENT '酒店设施（JSON格式）',
    parking_info VARCHAR(200) COMMENT '停车信息',
    wifi_info VARCHAR(200) COMMENT 'WiFi信息',
    is_recommended TINYINT(1) DEFAULT 0 COMMENT '是否推荐：1-是，0-否',
    view_count INT DEFAULT 0 COMMENT '浏览次数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE SET NULL,
    INDEX idx_name (name),
    INDEX idx_city_id (city_id),
    INDEX idx_address (address(255)),
    INDEX idx_base_price (base_price),
    INDEX idx_rating (rating),
    INDEX idx_star_level (star_level),
    INDEX idx_is_recommended (is_recommended)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='酒店表';

-- 4. 房间类型表
CREATE TABLE IF NOT EXISTS room_types (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '房间类型ID',
    hotel_id INT NOT NULL COMMENT '酒店ID',
    type_name VARCHAR(100) NOT NULL COMMENT '房间类型名称（如：标准间、豪华间、套房）',
    description TEXT COMMENT '房间描述',
    area DECIMAL(5, 2) COMMENT '房间面积（平方米）',
    max_occupancy INT DEFAULT 2 COMMENT '最大入住人数',
    bed_type VARCHAR(50) COMMENT '床型（如：大床、双床）',
    base_price DECIMAL(10, 2) NOT NULL COMMENT '基础价格（元/晚）',
    total_count INT DEFAULT 0 COMMENT '该类型房间总数',
    available_count INT DEFAULT 0 COMMENT '可用房间数',
    images TEXT COMMENT '房间图片（JSON格式）',
    facilities TEXT COMMENT '房间设施（JSON格式）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    INDEX idx_hotel_id (hotel_id),
    INDEX idx_type_name (type_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='房间类型表';

-- 5. 预订表
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '预订ID',
    booking_no VARCHAR(50) NOT NULL UNIQUE COMMENT '预订编号',
    user_id INT NOT NULL COMMENT '用户ID',
    hotel_id INT NOT NULL COMMENT '酒店ID',
    room_type_id INT COMMENT '房间类型ID',
    check_in_date DATE NOT NULL COMMENT '入住日期',
    check_out_date DATE NOT NULL COMMENT '离店日期',
    nights INT NOT NULL COMMENT '入住天数',
    room_count INT NOT NULL DEFAULT 1 COMMENT '房间数量',
    guest_name VARCHAR(50) COMMENT '入住人姓名',
    guest_phone VARCHAR(20) COMMENT '入住人电话',
    base_price DECIMAL(10, 2) NOT NULL COMMENT '基础价格（元/晚）',
    discount_rate DECIMAL(5, 2) DEFAULT 0.00 COMMENT '折扣率（0-100，如10表示10%折扣）',
    coupon_discount DECIMAL(10, 2) DEFAULT 0.00 COMMENT '优惠券折扣金额',
    final_price DECIMAL(10, 2) NOT NULL COMMENT '最终支付价格',
    payment_method ENUM('alipay', 'wechat', 'bank_card', 'cash', 'points') COMMENT '支付方式',
    payment_status ENUM('unpaid', 'paid', 'refunded', 'partial_refund') DEFAULT 'unpaid' COMMENT '支付状态',
    status ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show') DEFAULT 'pending' COMMENT '预订状态：pending-待确认，confirmed-已确认，cancelled-已取消，completed-已完成，no_show-未入住',
    booking_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '预订时间',
    confirm_time TIMESTAMP NULL COMMENT '确认时间',
    cancel_time TIMESTAMP NULL COMMENT '取消时间',
    cancel_reason VARCHAR(500) COMMENT '取消原因',
    notes TEXT COMMENT '备注信息',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE SET NULL,
    INDEX idx_booking_no (booking_no),
    INDEX idx_user_id (user_id),
    INDEX idx_hotel_id (hotel_id),
    INDEX idx_check_in_date (check_in_date),
    INDEX idx_status (status),
    INDEX idx_payment_status (payment_status),
    INDEX idx_booking_time (booking_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预订表';

-- 6. 收藏表
CREATE TABLE IF NOT EXISTS favorites (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '收藏ID',
    user_id INT NOT NULL COMMENT '用户ID',
    hotel_id INT NOT NULL COMMENT '酒店ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
    UNIQUE KEY uk_user_hotel (user_id, hotel_id) COMMENT '用户和酒店的唯一组合',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_hotel_id (hotel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收藏表';

-- 7. 评论表
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '评论ID',
    user_id INT NOT NULL COMMENT '用户ID',
    hotel_id INT NOT NULL COMMENT '酒店ID',
    booking_id INT COMMENT '预订ID',
    rating DECIMAL(2, 1) NOT NULL COMMENT '评分（1-5分）',
    title VARCHAR(200) COMMENT '评论标题',
    content TEXT COMMENT '评论内容',
    images TEXT COMMENT '评论图片（JSON格式）',
    service_rating DECIMAL(2, 1) COMMENT '服务评分',
    cleanliness_rating DECIMAL(2, 1) COMMENT '清洁度评分',
    location_rating DECIMAL(2, 1) COMMENT '位置评分',
    value_rating DECIMAL(2, 1) COMMENT '性价比评分',
    is_anonymous TINYINT(1) DEFAULT 0 COMMENT '是否匿名：1-是，0-否',
    helpful_count INT DEFAULT 0 COMMENT '有用数',
    reply_content TEXT COMMENT '商家回复内容',
    reply_time TIMESTAMP NULL COMMENT '回复时间',
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT '审核状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_hotel_id (hotel_id),
    INDEX idx_rating (rating),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论表';

-- 8. 优惠券表
CREATE TABLE IF NOT EXISTS coupons (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '优惠券ID',
    coupon_code VARCHAR(50) NOT NULL UNIQUE COMMENT '优惠券代码',
    coupon_name VARCHAR(100) NOT NULL COMMENT '优惠券名称',
    coupon_type ENUM('discount', 'cash', 'full_reduction') NOT NULL COMMENT '优惠类型：discount-折扣，cash-现金，full_reduction-满减',
    discount_rate DECIMAL(5, 2) COMMENT '折扣率（用于折扣券）',
    discount_amount DECIMAL(10, 2) COMMENT '优惠金额（用于现金券）',
    min_amount DECIMAL(10, 2) DEFAULT 0.00 COMMENT '最低使用金额（用于满减券）',
    max_discount DECIMAL(10, 2) COMMENT '最大优惠金额',
    total_count INT DEFAULT 0 COMMENT '发放总数（0表示不限制）',
    used_count INT DEFAULT 0 COMMENT '已使用数量',
    start_date DATE NOT NULL COMMENT '开始日期',
    end_date DATE NOT NULL COMMENT '结束日期',
    hotel_id INT NULL COMMENT '适用酒店ID（NULL表示所有酒店）',
    user_level ENUM('all', 'normal', 'silver', 'gold', 'platinum') DEFAULT 'all' COMMENT '适用用户等级',
    is_active TINYINT(1) DEFAULT 1 COMMENT '是否启用：1-是，0-否',
    description TEXT COMMENT '优惠券描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    INDEX idx_coupon_code (coupon_code),
    INDEX idx_hotel_id (hotel_id),
    INDEX idx_is_active (is_active),
    INDEX idx_date_range (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='优惠券表';

-- 9. 用户优惠券表
CREATE TABLE IF NOT EXISTS user_coupons (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID',
    user_id INT NOT NULL COMMENT '用户ID',
    coupon_id INT NOT NULL COMMENT '优惠券ID',
    status ENUM('unused', 'used', 'expired') DEFAULT 'unused' COMMENT '状态：unused-未使用，used-已使用，expired-已过期',
    used_time TIMESTAMP NULL COMMENT '使用时间',
    booking_id INT COMMENT '使用的预订ID',
    obtained_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '获得时间',
    expire_time TIMESTAMP NULL COMMENT '过期时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_coupon_id (coupon_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户优惠券表';

-- 10. 价格规则表（用于动态定价和促销策略）
CREATE TABLE IF NOT EXISTS price_rules (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '规则ID',
    rule_name VARCHAR(100) NOT NULL COMMENT '规则名称',
    rule_type ENUM('season', 'weekend', 'holiday', 'new_user', 'long_stay', 'custom') NOT NULL COMMENT '规则类型：season-旺季，weekend-周末，holiday-节假日，new_user-新用户，long_stay-连住，custom-自定义',
    hotel_id INT NULL COMMENT '酒店ID（NULL表示适用于所有酒店）',
    start_date DATE NULL COMMENT '开始日期（用于季节性规则）',
    end_date DATE NULL COMMENT '结束日期（用于季节性规则）',
    day_of_week TINYINT NULL COMMENT '星期几（1-7，1=周一，用于周末规则）',
    min_nights INT NULL COMMENT '最少入住天数（用于连住优惠）',
    discount_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00 COMMENT '折扣率（负数表示涨价，正数表示折扣，如-20表示涨价20%，10表示折扣10%）',
    is_active TINYINT(1) DEFAULT 1 COMMENT '是否启用：1-启用，0-禁用',
    description TEXT COMMENT '规则描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    INDEX idx_rule_type (rule_type),
    INDEX idx_hotel_id (hotel_id),
    INDEX idx_is_active (is_active),
    INDEX idx_date_range (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='价格规则表';

-- 11. 节假日表（用于节假日价格调整）
CREATE TABLE IF NOT EXISTS holidays (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '节假日ID',
    holiday_name VARCHAR(100) NOT NULL COMMENT '节假日名称',
    holiday_date DATE NOT NULL COMMENT '节假日日期',
    is_national TINYINT(1) DEFAULT 1 COMMENT '是否为国家法定节假日：1-是，0-否',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_holiday_date (holiday_date),
    INDEX idx_holiday_date (holiday_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='节假日表';

-- ========== 插入示例数据 ==========

-- 插入城市数据
INSERT INTO cities (name, province, code, is_hot) VALUES
('北京', '北京市', 'BJ', 1),
('上海', '上海市', 'SH', 1),
('广州', '广东省', 'GZ', 1),
('深圳', '广东省', 'SZ', 1),
('杭州', '浙江省', 'HZ', 1),
('成都', '四川省', 'CD', 1),
('三亚', '海南省', 'SY', 1),
('厦门', '福建省', 'XM', 1),
('西安', '陕西省', 'XA', 1),
('南京', '江苏省', 'NJ', 1),
('苏州', '江苏省', 'SZ', 0),
('青岛', '山东省', 'QD', 0),
('大连', '辽宁省', 'DL', 0),
('昆明', '云南省', 'KM', 0),
('重庆', '重庆市', 'CQ', 1)
ON DUPLICATE KEY UPDATE name=name;

-- 插入默认管理员用户和测试用户（密码：admin123，实际使用时应该使用加密后的密码）
-- 注意：这里使用明文密码仅用于演示，实际生产环境应使用加密密码
INSERT INTO users (username, password, email, phone, real_name, gender, vip_level, role, status) VALUES 
('admin', 'admin123', 'admin@example.com', '13800138000', '系统管理员', 'male', 'platinum', 'admin', 'active'),
('testuser1', '123456', 'user1@example.com', '13800138001', '张三', 'male', 'gold', 'user', 'active'),
('testuser2', '123456', 'user2@example.com', '13800138002', '李四', 'female', 'silver', 'user', 'active'),
('testuser3', '123456', 'user3@example.com', '13800138003', '王五', 'male', 'normal', 'user', 'active'),
('testuser4', '123456', 'user4@example.com', '13800138004', '赵六', 'female', 'gold', 'user', 'active')
ON DUPLICATE KEY UPDATE username=username;

-- 插入示例酒店数据
INSERT INTO hotels (name, city_id, address, description, tags, base_price, nearby_attractions, images, rating, review_count, star_level, total_rooms, available_rooms, phone, longitude, latitude, facilities, parking_info, wifi_info, is_recommended) VALUES
('豪华海景度假酒店', 7, '海南省三亚市亚龙湾路1号', '位于亚龙湾核心区域，拥有私人海滩，提供一流的度假体验。酒店设施完善，服务周到，是您度假的理想选择。', '["海景","度假","亲子","豪华"]', 888.00, '["亚龙湾海滩","热带天堂森林公园","玫瑰谷","天涯海角"]', '["/static/images/hotel1.jpg","/static/images/hotel1_2.jpg"]', 4.8, 1250, 5, 200, 150, '0898-88888888', 109.6234, 18.2345, '["游泳池","健身房","SPA","餐厅","会议室","停车场","WiFi","24小时前台"]', '免费停车', '免费WiFi', 1),
('商务精品酒店', 1, '北京市朝阳区建国路88号', '位于CBD核心区域，交通便利，适合商务出行。酒店设计现代，设施齐全，提供专业的商务服务。', '["商务","交通便利","高端","CBD"]', 588.00, '["国贸CBD","三里屯","天安门广场","王府井"]', '["/static/images/hotel2.jpg","/static/images/hotel2_2.jpg"]', 4.5, 890, 4, 150, 120, '010-66666666', 116.4567, 39.9123, '["会议室","商务中心","健身房","餐厅","停车场","WiFi","机场接送"]', '收费停车', '免费WiFi', 1),
('亲子主题酒店', 2, '上海市浦东新区迪士尼大道100号', '专为家庭设计，提供丰富的儿童娱乐设施。酒店内有儿童乐园、亲子餐厅，让您的家庭旅行更加愉快。', '["亲子","主题","娱乐","迪士尼"]', 688.00, '["上海迪士尼乐园","野生动物园","海洋公园","科技馆"]', '["/static/images/hotel3.jpg","/static/images/hotel3_2.jpg"]', 4.6, 1120, 4, 180, 140, '021-77777777', 121.6789, 31.1456, '["儿童乐园","亲子餐厅","游泳池","健身房","停车场","WiFi","婴儿看护"]', '免费停车', '免费WiFi', 1),
('温泉度假村', 1, '广东省清远市温泉镇', '天然温泉，环境优美，适合休闲养生。酒店拥有多个温泉池，提供SPA服务，是您放松身心的好去处。', '["温泉","养生","休闲","度假"]', 488.00, '["温泉公园","森林公园","古村落","漂流"]', '["/static/images/hotel4.jpg","/static/images/hotel4_2.jpg"]', 4.4, 680, 4, 120, 100, '0763-55555555', 113.0123, 23.6789, '["温泉","SPA","餐厅","会议室","停车场","WiFi","按摩服务"]', '免费停车', '免费WiFi', 0),
('城市商务酒店', 4, '深圳市南山区科技园', '现代化设计，设施齐全，适合商务和旅游。酒店位于科技园核心区域，周边商业设施完善。', '["商务","现代","科技","便捷"]', 388.00, '["科技园","深圳湾公园","世界之窗","欢乐谷"]', '["/static/images/hotel5.jpg","/static/images/hotel5_2.jpg"]', 4.3, 560, 3, 100, 80, '0755-44444444', 113.9456, 22.5432, '["会议室","健身房","餐厅","停车场","WiFi","洗衣服务"]', '收费停车', '免费WiFi', 0),
('国际连锁酒店', 2, '上海市黄浦区南京东路100号', '国际知名连锁品牌，位于外滩附近，地理位置优越。酒店提供高品质的服务和设施。', '["商务","豪华","外滩","国际"]', 1288.00, '["外滩","南京路","豫园","城隍庙"]', '["/static/images/hotel6.jpg"]', 4.9, 2100, 5, 300, 200, '021-88888888', 121.4890, 31.2345, '["游泳池","健身房","SPA","多个餐厅","会议室","停车场","WiFi","行政酒廊"]', '收费停车', '免费WiFi', 1),
('精品民宿', 5, '浙江省杭州市西湖区龙井路88号', '位于西湖景区内，环境清幽，设计独特。提供个性化的服务，让您体验不一样的杭州。', '["民宿","西湖","文艺","特色"]', 588.00, '["西湖","雷峰塔","灵隐寺","龙井茶园"]', '["/static/images/hotel7.jpg"]', 4.7, 450, 3, 20, 15, '0571-33333333', 120.1234, 30.2345, '["茶室","餐厅","停车场","WiFi","自行车租赁"]', '免费停车', '免费WiFi', 0),
('海滨度假酒店', 8, '福建省厦门市思明区环岛路200号', '面朝大海，春暖花开。酒店拥有私人海滩，提供各种水上活动，是您海滨度假的理想选择。', '["海景","度假","海滨","浪漫"]', 788.00, '["鼓浪屿","厦门大学","南普陀寺","曾厝垵"]', '["/static/images/hotel8.jpg"]', 4.6, 980, 4, 150, 120, '0592-22222222', 118.1234, 24.4567, '["私人海滩","游泳池","水上活动","餐厅","停车场","WiFi"]', '免费停车', '免费WiFi', 1),
('古城精品酒店', 9, '陕西省西安市碑林区南门里1号', '位于古城墙内，融合传统与现代设计。酒店提供文化体验活动，让您深入了解西安历史文化。', '["古城","文化","历史","特色"]', 488.00, '["古城墙","钟楼","鼓楼","回民街","大雁塔"]', '["/static/images/hotel9.jpg"]', 4.5, 720, 4, 120, 95, '029-11111111', 108.9456, 34.2567, '["文化体验","餐厅","会议室","停车场","WiFi","旅游咨询"]', '收费停车', '免费WiFi', 0),
('商务会议酒店', 10, '江苏省南京市建邺区奥体中心88号', '专业的会议设施，适合举办各类商务会议和活动。酒店提供一站式会议服务。', '["商务","会议","专业","便捷"]', 688.00, '["奥体中心","南京眼","青奥公园","河西CBD"]', '["/static/images/hotel10.jpg"]', 4.4, 650, 4, 200, 160, '025-99999999', 118.7123, 32.0123, '["大型会议室","宴会厅","健身房","餐厅","停车场","WiFi","商务中心"]', '免费停车', '免费WiFi', 0),
('山景度假酒店', 6, '四川省成都市都江堰市青城山路88号', '依山而建，环境清幽，空气清新。酒店提供养生服务，是您远离城市喧嚣的好去处。', '["山景","度假","养生","清幽"]', 588.00, '["青城山","都江堰","熊猫基地","宽窄巷子"]', '["/static/images/hotel11.jpg"]', 4.6, 580, 4, 80, 65, '028-88888888', 103.6234, 30.9876, '["养生SPA","餐厅","茶室","停车场","WiFi","登山服务"]', '免费停车', '免费WiFi', 0),
('经济型连锁酒店', 1, '北京市海淀区中关村大街1号', '经济实惠，干净舒适。酒店位于中关村核心区域，交通便利，适合商务和旅游。', '["经济","便捷","商务","实惠"]', 288.00, '["中关村","清华大学","北京大学","颐和园"]', '["/static/images/hotel12.jpg"]', 4.2, 1200, 2, 150, 130, '010-33333333', 116.3123, 39.9876, '["餐厅","停车场","WiFi","24小时前台"]', '收费停车', '免费WiFi', 0),
('湖景度假酒店', 5, '浙江省杭州市淳安县千岛湖镇', '坐拥千岛湖美景，酒店设计融入自然，提供独特的湖景体验。', '["湖景","度假","自然","休闲"]', 888.00, '["千岛湖","梅峰岛","龙山岛","森林氧吧"]', '["/static/images/hotel13.jpg"]', 4.7, 890, 4, 120, 95, '0571-66666666', 119.0123, 29.6234, '["湖景餐厅","游泳池","SPA","会议室","停车场","WiFi","游船服务"]', '免费停车', '免费WiFi', 1),
('主题乐园酒店', 2, '上海市浦东新区川沙新镇', '与主题乐园相邻，提供主题房间和特色服务。酒店内有主题餐厅和商店。', '["主题","乐园","亲子","娱乐"]', 988.00, '["主题乐园","野生动物园","海洋公园","科技馆"]', '["/static/images/hotel14.jpg"]', 4.8, 1500, 4, 250, 180, '021-99999999', 121.6789, 31.1456, '["主题房间","主题餐厅","儿童乐园","游泳池","停车场","WiFi","乐园门票服务"]', '免费停车', '免费WiFi', 1),
('艺术设计酒店', 4, '广东省深圳市南山区华侨城创意园', '融合艺术与设计，每个房间都是独特的艺术品。酒店定期举办艺术展览。', '["艺术","设计","创意","文艺"]', 688.00, '["华侨城","世界之窗","欢乐谷","深圳湾"]', '["/static/images/hotel15.jpg"]', 4.6, 420, 4, 60, 45, '0755-77777777', 113.9456, 22.5432, '["艺术展览","设计商店","餐厅","停车场","WiFi","艺术体验"]', '免费停车', '免费WiFi', 0)
ON DUPLICATE KEY UPDATE name=name;

-- 插入房间类型数据（为部分酒店添加房间类型）
INSERT INTO room_types (hotel_id, type_name, description, area, max_occupancy, bed_type, base_price, total_count, available_count, facilities) VALUES
(1, '豪华海景房', '面朝大海，拥有超大落地窗，可欣赏无敌海景', 45.00, 2, '大床', 1088.00, 50, 38, '["海景阳台","迷你吧","保险箱","免费WiFi"]'),
(1, '家庭套房', '适合家庭入住，拥有独立客厅和儿童房', 80.00, 4, '大床+双床', 1588.00, 20, 15, '["海景阳台","客厅","儿童设施","免费WiFi"]'),
(2, '商务标准间', '适合商务人士，设施齐全，环境安静', 30.00, 2, '大床/双床', 588.00, 80, 65, '["办公桌","保险箱","免费WiFi","迷你吧"]'),
(2, '行政套房', '豪华装修，提供行政酒廊服务', 60.00, 2, '大床', 1288.00, 15, 10, '["行政酒廊","办公区","免费WiFi","迷你吧"]'),
(3, '亲子主题房', '专为家庭设计，提供儿童床和玩具', 40.00, 3, '大床+儿童床', 888.00, 60, 45, '["儿童床","玩具","儿童设施","免费WiFi"]'),
(5, '标准间', '经济实惠，干净舒适', 25.00, 2, '大床/双床', 388.00, 70, 60, '["免费WiFi","电视","空调"]')
ON DUPLICATE KEY UPDATE type_name=type_name;

-- 插入示例价格规则
INSERT INTO price_rules (rule_name, rule_type, discount_rate, is_active, description) VALUES
('周末加价规则', 'weekend', -15.00, 1, '周末（周五、周六）价格上涨15%'),
('新用户优惠', 'new_user', 10.00, 1, '新用户首次预订享受10%折扣'),
('连住优惠', 'long_stay', 5.00, 1, '连续入住3晚及以上享受5%折扣'),
('连住7天优惠', 'long_stay', 10.00, 1, '连续入住7晚及以上享受10%折扣'),
('春节旺季', 'season', -30.00, 1, '春节期间（2月10日-2月17日）价格上涨30%'),
('国庆旺季', 'season', -25.00, 1, '国庆期间（10月1日-10月7日）价格上涨25%'),
('夏季旺季', 'season', -20.00, 1, '夏季（6月1日-8月31日）价格上涨20%'),
('会员折扣-银卡', 'custom', 5.00, 1, '银卡会员享受5%折扣'),
('会员折扣-金卡', 'custom', 8.00, 1, '金卡会员享受8%折扣'),
('会员折扣-白金卡', 'custom', 12.00, 1, '白金卡会员享受12%折扣')
ON DUPLICATE KEY UPDATE rule_name=rule_name;

-- 插入季节性价格规则（带日期范围）
INSERT INTO price_rules (rule_name, rule_type, start_date, end_date, discount_rate, is_active, description) VALUES
('春节旺季价格', 'season', '2025-02-10', '2025-02-17', -30.00, 1, '2025年春节期间价格上涨30%'),
('国庆黄金周', 'season', '2025-10-01', '2025-10-07', -25.00, 1, '2025年国庆黄金周价格上涨25%'),
('夏季旅游旺季', 'season', '2025-06-01', '2025-08-31', -20.00, 1, '2025年夏季旅游旺季价格上涨20%'),
('冬季淡季优惠', 'season', '2025-11-01', '2025-12-20', 15.00, 1, '2025年冬季淡季享受15%折扣')
ON DUPLICATE KEY UPDATE rule_name=rule_name;

-- 插入示例节假日数据（2025-2025年）
INSERT INTO holidays (holiday_name, holiday_date, is_national) VALUES
-- 2025年节假日
('元旦', '2025-01-01', 1),
('春节', '2025-02-10', 1),
('春节', '2025-02-11', 1),
('春节', '2025-02-12', 1),
('春节', '2025-02-13', 1),
('春节', '2025-02-14', 1),
('春节', '2025-02-15', 1),
('春节', '2025-02-16', 1),
('春节', '2025-02-17', 1),
('清明节', '2025-04-04', 1),
('清明节', '2025-04-05', 1),
('清明节', '2025-04-06', 1),
('劳动节', '2025-05-01', 1),
('劳动节', '2025-05-02', 1),
('劳动节', '2025-05-03', 1),
('劳动节', '2025-05-04', 1),
('劳动节', '2025-05-05', 1),
('端午节', '2025-06-10', 1),
('中秋节', '2025-09-17', 1),
('国庆节', '2025-10-01', 1),
('国庆节', '2025-10-02', 1),
('国庆节', '2025-10-03', 1),
('国庆节', '2025-10-04', 1),
('国庆节', '2025-10-05', 1),
('国庆节', '2025-10-06', 1),
('国庆节', '2025-10-07', 1),
-- 2025年节假日
('元旦', '2025-01-01', 1),
('春节', '2025-01-29', 1),
('春节', '2025-01-30', 1),
('春节', '2025-01-31', 1),
('春节', '2025-02-01', 1),
('春节', '2025-02-02', 1),
('春节', '2025-02-03', 1),
('春节', '2025-02-04', 1),
('春节', '2025-02-05', 1),
('清明节', '2025-04-04', 1),
('清明节', '2025-04-05', 1),
('清明节', '2025-04-06', 1),
('劳动节', '2025-05-01', 1),
('劳动节', '2025-05-02', 1),
('劳动节', '2025-05-03', 1),
('劳动节', '2025-05-04', 1),
('劳动节', '2025-05-05', 1),
('端午节', '2025-05-31', 1),
('中秋节', '2025-10-06', 1),
('国庆节', '2025-10-01', 1),
('国庆节', '2025-10-02', 1),
('国庆节', '2025-10-03', 1),
('国庆节', '2025-10-04', 1),
('国庆节', '2025-10-05', 1),
('国庆节', '2025-10-06', 1),
('国庆节', '2025-10-07', 1),
('国庆节', '2025-10-08', 1)
ON DUPLICATE KEY UPDATE holiday_name=holiday_name;

-- 插入优惠券数据
INSERT INTO coupons (coupon_code, coupon_name, coupon_type, discount_rate, discount_amount, min_amount, max_discount, total_count, start_date, end_date, user_level, is_active, description) VALUES
('WELCOME10', '新用户专享', 'discount', 10.00, NULL, 200.00, NULL, 0, '2025-01-01', '2025-12-31', 'all', 1, '新用户首次预订满200元享受10%折扣'),
('CASH50', '满减优惠券', 'full_reduction', NULL, 50.00, 500.00, 50.00, 1000, '2025-01-01', '2025-12-31', 'all', 1, '满500元减50元'),
('CASH100', '满减优惠券', 'full_reduction', NULL, 100.00, 1000.00, 100.00, 500, '2025-01-01', '2025-12-31', 'all', 1, '满1000元减100元'),
('SILVER5', '银卡会员专享', 'discount', 5.00, NULL, 300.00, NULL, 0, '2025-01-01', '2025-12-31', 'silver', 1, '银卡会员满300元享受5%折扣'),
('GOLD10', '金卡会员专享', 'discount', 10.00, NULL, 500.00, NULL, 0, '2025-01-01', '2025-12-31', 'gold', 1, '金卡会员满500元享受10%折扣'),
('PLATINUM15', '白金卡会员专享', 'discount', 15.00, NULL, 800.00, NULL, 0, '2025-01-01', '2025-12-31', 'platinum', 1, '白金卡会员满800元享受15%折扣'),
('WEEKEND20', '周末特惠', 'cash', NULL, 20.00, 200.00, 20.00, 2000, '2025-01-01', '2025-12-31', 'all', 1, '周末预订满200元立减20元')
ON DUPLICATE KEY UPDATE coupon_code=coupon_code;

-- 插入示例预订数据
INSERT INTO bookings (booking_no, user_id, hotel_id, room_type_id, check_in_date, check_out_date, nights, room_count, guest_name, guest_phone, base_price, discount_rate, final_price, payment_method, payment_status, status, booking_time, confirm_time) VALUES
('BK20250101001', 2, 1, 1, '2025-02-15', '2025-02-18', 3, 1, '张三', '13800138001', 1088.00, 0.00, 3264.00, 'alipay', 'paid', 'confirmed', '2025-01-15 10:30:00', '2025-01-15 10:35:00'),
('BK20250102001', 3, 2, 3, '2025-03-01', '2025-03-03', 2, 1, '李四', '13800138002', 588.00, 10.00, 1058.40, 'wechat', 'paid', 'confirmed', '2025-01-20 14:20:00', '2025-01-20 14:25:00'),
('BK20250103001', 4, 3, 5, '2025-04-10', '2025-04-13', 3, 2, '王五', '13800138003', 888.00, 5.00, 5061.60, 'bank_card', 'paid', 'completed', '2025-01-25 09:15:00', '2025-01-25 09:20:00'),
('BK20250104001', 5, 5, NULL, '2025-05-01', '2025-05-05', 4, 1, '赵六', '13800138004', 388.00, 0.00, 1552.00, 'alipay', 'paid', 'confirmed', '2025-02-01 16:45:00', '2025-02-01 16:50:00')
ON DUPLICATE KEY UPDATE booking_no=booking_no;

-- 插入示例评论数据
INSERT INTO reviews (user_id, hotel_id, booking_id, rating, title, content, service_rating, cleanliness_rating, location_rating, value_rating, status, created_at) VALUES
(2, 1, 1, 5.0, '非常满意的度假体验', '酒店位置绝佳，海景房视野开阔，服务周到，设施完善。早餐丰富，私人海滩很赞！强烈推荐！', 5.0, 5.0, 5.0, 4.5, 'approved', '2025-02-20 10:00:00'),
(3, 2, 2, 4.5, '商务出行首选', '酒店位于CBD，交通便利，房间干净整洁，服务专业。会议室设施齐全，适合商务会议。', 4.5, 4.5, 5.0, 4.0, 'approved', '2025-03-05 14:30:00'),
(4, 3, 3, 4.8, '亲子游的好选择', '酒店非常适合带小孩，儿童设施齐全，工作人员很友好。房间宽敞，主题设计很有趣，孩子很喜欢！', 4.8, 4.5, 4.5, 4.5, 'approved', '2025-04-15 11:20:00'),
(5, 5, 4, 4.2, '性价比不错', '价格实惠，房间干净，位置方便。虽然设施简单，但基本需求都能满足。适合预算有限的旅行。', 4.0, 4.5, 4.5, 4.5, 'approved', '2025-05-10 09:00:00')
ON DUPLICATE KEY UPDATE id=id;
