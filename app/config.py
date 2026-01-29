# 配置文件
import os

# 数据库配置
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:123456@localhost:3306/hotel_booking?charset=utf8mb4"
)

# 应用配置
APP_NAME = "在线酒店预订系统"
APP_VERSION = "1.0.0"
DEBUG = True

# CORS配置
ALLOWED_ORIGINS = [
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "*"  # 开发环境允许所有来源，生产环境应限制
]
