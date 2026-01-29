import os
import requests
import re
import time
import sys
import json
from urllib.parse import quote
from bs4 import BeautifulSoup

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import Hotel

# Constants
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
IMAGES_DIR = os.path.join(STATIC_DIR, "images")
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

def download_image(url: str, save_path: str, timeout: int = 20):
    """下载图片并保存到指定路径"""
    try:
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        response = requests.get(url, stream=True, timeout=timeout, headers=HEADERS)
        response.raise_for_status()
        
        with open(save_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        return True
    except Exception as e:
        print(f"  ❌ 下载失败 {url}: {e}")
        return False

def get_bing_hotel_image_url(hotel_name: str, city_name: str):
    """从必应搜索获取酒店图片链接"""
    query = f"{hotel_name} {city_name} 酒店"
    encoded_query = quote(query)
    url = f"https://cn.bing.com/images/search?q={encoded_query}&form=HDRSC2&first=1"
    
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 查找图片容器
        # 必应图片的原始 URL 通常隐藏在 a.iusc 标签的 m 属性中
        for a_tag in soup.find_all('a', class_='iusc'):
            m_attr = a_tag.get('m')
            if m_attr:
                # 提取 murl (Media URL)
                pattern = r'"murl":"([^"]+)"'
                match = re.search(pattern, m_attr)
                if match:
                    img_url = match.group(1)
                    # 过滤掉一些明显的非图片链接
                    if img_url.startswith('http') and any(img_url.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.webp']):
                        return img_url
        return None
    except Exception as e:
        print(f"  ⚠️ 搜索失败 {query}: {e}")
        return None

def update_hotel_images(hotel_id: int, new_image_path: str, db):
    """更新酒店图片列表"""
    try:
        hotel = db.query(Hotel).filter(Hotel.id == hotel_id).first()
        if not hotel:
            return False
        
        # 解析现有图片列表或创建新列表
        if hotel.images:
            try:
                images = json.loads(hotel.images)
                if isinstance(images, list):
                    # 如果新图片不在列表中，则添加
                    if new_image_path not in images:
                        images.insert(0, new_image_path)  # 新图片放在最前面
                else:
                    images = [new_image_path]
            except json.JSONDecodeError:
                images = [new_image_path]
        else:
            images = [new_image_path]
        
        # 限制最多保留 5 张图片
        images = images[:5]
        hotel.images = json.dumps(images, ensure_ascii=False)
        db.commit()
        return True
    except Exception as e:
        print(f"  ❌ 更新数据库失败: {e}")
        db.rollback()
        return False

def main():
    db = SessionLocal()
    try:
        # 获取所有酒店
        hotels = db.query(Hotel).all()
        
        print(f"🔍 找到 {len(hotels)} 家酒店，开始下载图片...\n")
        
        for i, hotel in enumerate(hotels):
            print(f"[{i+1}/{len(hotels)}] 正在处理: {hotel.name}")
            
            # 获取城市名称
            city_name = hotel.city.name if hotel.city else "未知城市"
            
            # 1. 获取图片链接
            img_url = get_bing_hotel_image_url(hotel.name, city_name)
            
            if img_url:
                # 2. 生成本地保存路径
                # 使用酒店名和ID组合，避免特殊字符导致路径问题
                safe_name = re.sub(r'[\\/*?:"<>|]', "", hotel.name).replace(" ", "_")
                filename = f"hotel_{hotel.id}.jpg"
                save_path = os.path.join(IMAGES_DIR, filename)
                
                # 3. 下载图片
                if download_image(img_url, save_path):
                    # 4. 更新数据库路径 (相对路径)
                    db_path = f"/static/images/{filename}"
                    if update_hotel_images(hotel.id, db_path, db):
                        print(f"  ✅ 成功! 已保存至: {db_path}")
                    else:
                        print(f"  ❌ 更新数据库失败")
                else:
                    print(f"  ❌ 下载图片失败")
            else:
                print(f"  ❌ 未找到匹配的酒店图片")
            
            # 适当延时，避免被封
            time.sleep(2)
        
        print("\n✅ 所有酒店图片下载完成!")
            
    finally:
        db.close()

if __name__ == "__main__":
    main()
