# 在线酒店预订系统

一个基于 FastAPI 和 MySQL 的现代化在线酒店预订管理系统，提供完整的酒店预订、用户管理、价格策略和数据分析功能。

## 📋 目录

- [系统简介](#系统简介)
- [技术栈](#技术栈)
- [功能特性](#功能特性)
- [系统架构](#系统架构)
- [快速开始](#快速开始)
- [API 文档](#api-文档)
- [数据库设计](#数据库设计)
- [项目结构](#项目结构)
- [开发说明](#开发说明)

## 🎯 系统简介

在线酒店预订系统是一个功能完善的酒店预订管理平台，支持用户注册登录、酒店搜索浏览、在线预订、订单管理、评论评价、优惠券使用等核心功能。系统采用前后端分离架构，后端提供 RESTful API，前端提供友好的用户界面。

## 🛠 技术栈

### 后端技术
- **FastAPI** 0.104.1 - 现代、快速的 Web 框架
- **SQLAlchemy** 2.0.23 - ORM 数据库操作
- **PyMySQL** 1.1.0 - MySQL 数据库驱动
- **Pydantic** 2.5.0 - 数据验证和序列化
- **Python-JOSE** - JWT 令牌处理
- **Passlib** - 密码加密（bcrypt）
- **Uvicorn** - ASGI 服务器

### 前端技术
- **HTML5** - 页面结构
- **Bootstrap 5** - 响应式 UI 框架
- **JavaScript (ES6+)** - 前端交互逻辑
- **Bootstrap Icons** - 图标库

### 数据库
- **MySQL** - 关系型数据库

## ✨ 功能特性

### 1. 用户管理
- ✅ 用户注册与登录（JWT 认证）
- ✅ 用户个人信息管理
- ✅ 会员等级系统（普通、银卡、金卡、白金）
- ✅ 积分系统
- ✅ 用户状态管理（活跃、非活跃、封禁）
- ✅ 角色权限（普通用户、管理员）

### 2. 酒店管理
- ✅ 酒店信息展示（名称、地址、描述、图片）
- ✅ 酒店搜索与筛选（按城市、价格、星级、评分）
- ✅ 酒店详情查看（设施、位置、附近景点）
- ✅ 酒店推荐功能
- ✅ 酒店浏览统计
- ✅ 多图片展示支持

### 3. 房间管理
- ✅ 房间类型管理（标准间、豪华间、套房等）
- ✅ 房间信息展示（面积、床型、最大入住人数）
- ✅ 房间价格管理
- ✅ 房间库存管理（总数、可用数）
- ✅ 房间设施信息

### 4. 预订管理
- ✅ 在线预订功能
- ✅ 预订状态管理（待确认、已确认、已取消、已完成、未入住）
- ✅ 预订详情查看
- ✅ 预订取消功能
- ✅ 预订编号生成
- ✅ 入住人信息管理
- ✅ 预订备注功能

### 5. 价格策略
- ✅ 动态价格计算
- ✅ 多种价格规则支持：
  - 季节性价格
  - 周末价格
  - 节假日价格
  - 新用户优惠
  - 长住优惠
  - 自定义规则
- ✅ 折扣率配置
- ✅ 价格规则启用/禁用

### 6. 优惠券系统
- ✅ 优惠券创建与管理
- ✅ 优惠券类型（折扣券、现金券、满减券）
- ✅ 用户优惠券领取
- ✅ 优惠券使用
- ✅ 优惠券有效期管理
- ✅ 会员等级限制
- ✅ 使用统计

### 7. 收藏功能
- ✅ 酒店收藏/取消收藏
- ✅ 收藏列表查看
- ✅ 收藏时间记录

### 8. 评论系统
- ✅ 酒店评论发布
- ✅ 多维度评分（总体、服务、清洁度、位置、性价比）
- ✅ 评论图片上传
- ✅ 评论审核机制
- ✅ 商家回复功能
- ✅ 评论有用数统计
- ✅ 匿名评论支持

### 9. 城市管理
- ✅ 城市信息管理
- ✅ 热门城市标记
- ✅ 城市代码管理

### 10. 统计分析
- ✅ 预订统计（总数、收入）
- ✅ 按日期统计预订
- ✅ 按酒店统计预订
- ✅ 按状态统计预订
- ✅ 数据可视化支持

### 11. 支付管理
- ✅ 多种支付方式（支付宝、微信、银行卡、现金、积分）
- ✅ 支付状态管理（未支付、已支付、已退款、部分退款）
- ✅ 支付记录

### 12. 管理后台
- ✅ 管理员权限控制
- ✅ 酒店信息管理
- ✅ 订单管理
- ✅ 用户管理
- ✅ 数据统计与分析
- ✅ 前台管理（房间管理）

## 🏗 系统架构

```
┌─────────────┐
│   前端页面   │  (HTML + Bootstrap + JavaScript)
│  (Static)   │
└──────┬──────┘
       │ HTTP Request
       ▼
┌─────────────┐
│  FastAPI    │  (RESTful API)
│  后端服务   │
└──────┬──────┘
       │ ORM
       ▼
┌─────────────┐
│   MySQL     │  (数据库)
│   Database  │
└─────────────┘
```

### 主要 API 端点

#### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

#### 酒店相关
- `GET /api/hotels` - 获取酒店列表（支持搜索、筛选、分页）
- `GET /api/hotels/{hotel_id}` - 获取酒店详情
- `POST /api/hotels` - 创建酒店（管理员）
- `PUT /api/hotels/{hotel_id}` - 更新酒店信息（管理员）

#### 预订相关
- `GET /api/bookings` - 获取预订列表
- `GET /api/bookings/{booking_id}` - 获取预订详情
- `POST /api/bookings` - 创建预订
- `PUT /api/bookings/{booking_id}` - 更新预订状态
- `DELETE /api/bookings/{booking_id}` - 取消预订

#### 其他功能
- `GET /api/cities` - 获取城市列表
- `GET /api/room-types` - 获取房间类型列表
- `GET /api/favorites` - 获取收藏列表
- `POST /api/favorites` - 添加收藏
- `GET /api/reviews` - 获取评论列表
- `POST /api/reviews` - 创建评论
- `GET /api/coupons` - 获取优惠券列表
- `POST /api/pricing/calculate` - 计算价格

## 🗄 数据库设计

系统包含以下主要数据表：

1. **users** - 用户表
2. **cities** - 城市表
3. **hotels** - 酒店表
4. **room_types** - 房间类型表
5. **bookings** - 预订表
6. **favorites** - 收藏表
7. **reviews** - 评论表
8. **coupons** - 优惠券表
9. **user_coupons** - 用户优惠券表
10. **price_rules** - 价格规则表
11. **holidays** - 节假日表

详细的数据库结构请参考 `database/schema.sql` 文件。

## 📁 项目结构

```
在线酒店预订系统/
├── app/                    # 应用主目录
│   ├── __init__.py
│   ├── main.py            # FastAPI 应用入口
│   ├── config.py          # 配置文件
│   ├── database.py        # 数据库连接配置
│   ├── models.py          # SQLAlchemy 数据模型
│   ├── schemas.py         # Pydantic 数据模式
│   ├── auth.py            # 认证工具函数
│   └── routers/           # 路由模块
│       ├── auth.py        # 认证路由
│       ├── hotels.py      # 酒店路由
│       ├── bookings.py    # 预订路由
│       ├── favorites.py   # 收藏路由
│       ├── reviews.py     # 评论路由
│       ├── coupons.py     # 优惠券路由
│       ├── cities.py      # 城市路由
│       ├── room_types.py  # 房间类型路由
│       ├── pricing.py     # 价格计算路由
│       └── statistics.py  # 统计路由
├── static/                # 静态文件目录
│   ├── index.html         # 首页
│   ├── login.html         # 登录页
│   ├── register.html      # 注册页
│   ├── detail.html        # 酒店详情页
│   ├── profile.html       # 个人中心
│   ├── admin.html         # 管理后台
│   ├── booking-detail.html # 预订详情
│   ├── room-management.html # 房间管理
│   ├── front-desk.html    # 前台管理
│   ├── analytics.html     # 数据分析
│   ├── css/              # 样式文件
│   ├── js/               # JavaScript 文件
│   └── images/           # 图片资源
├── database/             # 数据库相关
│   └── schema.sql        # 数据库表结构
├── requirements.txt      # Python 依赖包
├── crawl_hotel_images.py # 图片爬取脚本
└── README.md            # 项目说明文档
```

## 💻 开发说明

### 代码规范
- 遵循 PEP 8 Python 代码规范
- 使用类型提示（Type Hints）
- 函数和类添加文档字符串

### 安全建议
- 生产环境请修改默认数据库密码
- 配置合适的 CORS 允许来源
- 使用 HTTPS 协议
- 定期更新依赖包版本
- 对敏感信息进行加密存储

### 扩展功能建议
- [ ] 邮件通知功能
- [ ] 短信验证码
- [ ] 支付接口集成
- [ ] 图片上传功能
- [ ] 数据导出功能
- [ ] 日志记录系统
- [ ] 缓存机制（Redis）
- [ ] 消息队列（Celery）

