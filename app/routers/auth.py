# 用户认证路由
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from app.database import get_db
from app.models import User
from app.auth import (
    verify_password, 
    get_password_hash, 
    create_access_token,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from app.schemas import UserCreate, UserResponseUpdated

router = APIRouter(prefix="/api/auth", tags=["用户认证"])

@router.post("/register", response_model=UserResponseUpdated, summary="用户注册")
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    用户注册
    """
    # 检查用户名是否已存在
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已存在"
        )
    
    # 检查邮箱是否已存在
    if user_data.email:
        existing_email = db.query(User).filter(User.email == user_data.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邮箱已被注册"
            )
    
    # 创建新用户
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        username=user_data.username,
        password=hashed_password,
        email=user_data.email,
        phone=user_data.phone,
        role="user",
        status="active"
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/login", summary="用户登录")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    用户登录，返回访问令牌
    """
    # 查找用户
    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 验证密码（注意：这里简化处理，实际应该使用加密密码验证）
    # 如果数据库中是明文密码（仅用于演示），直接比较
    if user.password == form_data.password:
        # 明文密码匹配（仅用于演示环境）
        pass
    elif not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 检查账户状态
    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="账户已被禁用"
        )
    
    # 更新最后登录时间
    from datetime import datetime
    user.last_login_time = datetime.now()
    db.commit()
    
    # 创建访问令牌（sub必须是字符串）
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},  # JWT标准要求sub必须是字符串
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "vip_level": user.vip_level
        }
    }

@router.get("/me", response_model=UserResponseUpdated, summary="获取当前用户信息")
def get_me(current_user: User = Depends(get_current_user)):
    """
    获取当前登录用户的信息
    """
    return current_user

@router.post("/logout", summary="用户登出")
def logout(current_user: User = Depends(get_current_user)):
    """
    用户登出（客户端删除 token 即可）
    """
    return {"message": "登出成功"}
