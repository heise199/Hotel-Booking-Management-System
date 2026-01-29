# FastAPI应用主入口
import sys
import os
from pathlib import Path

# 如果直接运行此文件，将项目根目录添加到Python路径
if __name__ == "__main__":
    # 获取项目根目录（app的父目录）
    current_file = Path(__file__).resolve()
    project_root = current_file.parent.parent
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))
    # 切换到项目根目录（用于静态文件路径）
    os.chdir(project_root)

from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.config import APP_NAME, APP_VERSION, ALLOWED_ORIGINS
from app.routers import hotels, bookings, favorites, statistics, pricing, cities, room_types, reviews, coupons, auth

# 创建FastAPI应用实例
app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="在线酒店预订系统API文档"
)

# 配置CORS（跨域资源共享）
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router)  # 认证路由（登录、注册）
app.include_router(cities.router)
app.include_router(hotels.router)
app.include_router(room_types.router)
app.include_router(bookings.router)
app.include_router(favorites.router)
app.include_router(reviews.router)
app.include_router(coupons.router)
app.include_router(statistics.router)
app.include_router(pricing.router)

# 挂载静态文件目录（用于前端页面）
try:
    app.mount("/static", StaticFiles(directory="static"), name="static")
except:
    # 如果static目录不存在，创建它
    import os
    os.makedirs("static", exist_ok=True)
    app.mount("/static", StaticFiles(directory="static"), name="static")

# 根路径
@app.get("/")
async def root():
    return RedirectResponse(url="/static/index.html")

# 健康检查
@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    # 确保静态文件路径正确
    static_path = Path(__file__).parent.parent / "static"
    if not static_path.exists():
        static_path.mkdir(exist_ok=True)
    # 使用导入字符串以支持 reload 功能
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
