// 酒店详情页逻辑
let currentUserId = null;
let currentHotel = null;
let isFavorited = false;
let favoriteId = null;

// 获取当前用户ID
function getCurrentUserId() {
    const user = authAPI.getCurrentUser();
    if (user) {
        return user.id;
    }
    return null;
}

// 检查登录状态
function checkLogin() {
    const userId = getCurrentUserId();
    if (!userId) {
        Toast.warning('您尚未登录，请先登录');
        setTimeout(() => {
            window.location.href = 'login.html?return=' + encodeURIComponent(window.location.href);
        }, 1500);
        return false;
    }
    return true;
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    // 获取当前用户ID
    currentUserId = getCurrentUserId();
    
    const urlParams = new URLSearchParams(window.location.search);
    const hotelId = urlParams.get('id');
    
    if (hotelId) {
        loadHotelDetail(hotelId);
        if (currentUserId) {
            checkFavorite(hotelId);
        }
        
        // 初始化日期选择器
        DatePicker.init('check-in-date', {
            minDate: new Date(),
            onSelect: function(date) {
                // 设置离店日期的最小值为入住日期的下一天
                const checkInDate = new Date(date);
                checkInDate.setDate(checkInDate.getDate() + 1);
                const checkOutInput = document.getElementById('check-out-date');
                if (checkOutInput) {
                    checkOutInput.min = DatePicker.formatDate(checkInDate);
                    if (checkOutInput.value && new Date(checkOutInput.value) <= new Date(date)) {
                        checkOutInput.value = '';
                    }
                }
                calculatePrice();
            }
        });
        
        DatePicker.init('check-out-date', {
            minDate: new Date(new Date().setDate(new Date().getDate() + 1)),
            onSelect: function() {
                calculatePrice();
            }
        });
        
        // 监听房间数量变化
        document.getElementById('room-count').addEventListener('change', calculatePrice);
    } else {
        document.getElementById('hotel-detail').innerHTML = 
            '<div class="alert alert-danger"><i class="bi bi-exclamation-triangle"></i> 缺少酒店ID参数</div>';
    }
});

// 加载酒店详情
async function loadHotelDetail(hotelId) {
    try {
        currentHotel = await hotelAPI.getDetail(hotelId);
        displayHotelDetail(currentHotel);
    } catch (error) {
        document.getElementById('hotel-detail').innerHTML = 
            `<div class="alert alert-danger"><i class="bi bi-exclamation-triangle"></i> 加载失败: ${error.message}</div>`;
        Toast.error('加载酒店详情失败: ' + error.message);
    }
}

// 显示酒店详情
function displayHotelDetail(hotel) {
    const tags = utils.parseJson(hotel.tags);
    const attractions = utils.parseJson(hotel.nearby_attractions);
    const images = utils.parseJson(hotel.images);
    const facilities = utils.parseJson(hotel.facilities);
    const imageUrl = images && images.length > 0 ? images[0] : 'https://via.placeholder.com/800x500?text=Hotel';
    const cityName = hotel.city ? hotel.city.name : '';
    const starLevel = hotel.star_level || 0;
    const stars = '★'.repeat(starLevel) + '☆'.repeat(5 - starLevel);
    
    // 图片轮播容器
    const carouselId = 'hotel-carousel';
    
    const html = `
        <div class="hotel-detail-header mb-4">
            <div class="container">
                <h1>${hotel.name}</h1>
                <p class="lead">
                    <i class="bi bi-geo-alt"></i> ${cityName ? cityName + ' · ' : ''}${hotel.address}
                </p>
                <div class="mb-2">
                    <span class="text-warning fs-5">${stars}</span>
                    ${tags && tags.length > 0 ? tags.map(tag => 
                        `<span class="badge bg-light text-dark tag-badge">${tag}</span>`
                    ).join('') : ''}
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-lg-8">
                <div id="${carouselId}"></div>
                
                <div class="card mb-4">
                    <div class="card-body">
                        <h3 class="mb-3">
                            <i class="bi bi-info-circle"></i> 酒店介绍
                        </h3>
                        <p class="text-muted">${hotel.description || '暂无描述'}</p>
                    </div>
                </div>
                
                ${facilities && facilities.length > 0 ? `
                <div class="card mb-4">
                    <div class="card-body">
                        <h3 class="mb-3">
                            <i class="bi bi-list-check"></i> 酒店设施
                        </h3>
                        <div class="row">
                            ${facilities.map(facility => `
                                <div class="col-md-4 mb-2">
                                    <i class="bi bi-check-circle text-success"></i> ${facility}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                ` : ''}
                
                ${attractions && attractions.length > 0 ? `
                <div class="card mb-4">
                    <div class="card-body">
                        <h3 class="mb-3">
                            <i class="bi bi-geo-alt-fill"></i> 附近景点
                        </h3>
                        <ul class="list-unstyled">
                            ${attractions.map(attr => `
                                <li class="mb-2">
                                    <i class="bi bi-geo-alt text-primary"></i> ${attr}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
                ` : '<div class="card mb-4"><div class="card-body"><p class="text-muted">暂无景点信息</p></div></div>'}
                
                <div class="card mb-4">
                    <div class="card-body">
                        <h3 class="mb-3">
                            <i class="bi bi-chat-left-text"></i> 用户评论
                        </h3>
                        <div id="reviews-section">
                            <div class="text-center">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">加载中...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-lg-4">
                <div class="price-card">
                    <h4 class="mb-3">
                        <i class="bi bi-tag"></i> 价格信息
                    </h4>
                    <div class="mb-3">
                        <div class="base-price">${utils.formatPrice(hotel.base_price)}</div>
                        <span class="price-unit">/晚</span>
                    </div>
                    <div class="mb-3">
                        <span class="text-muted">评分：</span>
                        <span class="rating-display">
                            <span class="stars">★</span>
                            <span class="rating-number">${hotel.rating || '0.0'}</span>
                            <small class="text-muted">(${hotel.review_count || 0}条评论)</small>
                        </span>
                    </div>
                    <div class="mb-3">
                        <span class="text-muted">可用房间：</span>
                        <span class="fw-bold text-success">${hotel.available_rooms || 0}</span>
                        <span class="text-muted">/${hotel.total_rooms || 0}</span>
                    </div>
                    ${hotel.phone ? `
                    <div class="mb-3">
                        <span class="text-muted">
                            <i class="bi bi-telephone"></i> 联系电话：
                        </span>
                        <span>${hotel.phone}</span>
                    </div>
                    ` : ''}
                    ${hotel.check_in_time && hotel.check_out_time ? `
                    <div class="mb-3">
                        <small class="text-muted">
                            <i class="bi bi-clock"></i> 入住：${hotel.check_in_time} | 退房：${hotel.check_out_time}
                        </small>
                    </div>
                    ` : ''}
                    <hr>
                    <div class="d-grid gap-2">
                        <button class="btn btn-primary btn-lg" onclick="openBookingModal()">
                            <i class="bi bi-calendar-check"></i> 立即预订
                        </button>
                        <button class="btn favorite-btn ${isFavorited ? 'active' : ''}" id="favorite-btn" onclick="toggleFavorite()">
                            <i class="bi bi-heart${isFavorited ? '-fill' : ''}"></i> 
                            <span id="favorite-text">${isFavorited ? '已收藏' : '收藏'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('hotel-detail').innerHTML = html;
    document.getElementById('booking-hotel-id').value = hotel.id;
    
    // 初始化图片轮播
    if (images && images.length > 0) {
        ImageCarousel.init(carouselId, images, {
            showThumbnails: true,
            autoPlay: false,
            height: '500px'
        });
    } else {
        // 如果没有图片，显示占位图
        document.getElementById(carouselId).innerHTML = `
            <img src="${imageUrl}" class="carousel-main" alt="${hotel.name}" 
                 onerror="this.src='https://via.placeholder.com/800x500?text=Hotel'">
        `;
    }
    
    // 加载评论
    loadReviews(hotel.id);
}

// 加载评论
async function loadReviews(hotelId) {
    try {
        const reviews = await reviewAPI.getByHotel(hotelId, { limit: 5 });
        displayReviews(reviews);
    } catch (error) {
        console.error('加载评论失败:', error);
        document.getElementById('reviews-section').innerHTML = 
            '<div class="alert alert-info"><i class="bi bi-info-circle"></i> 暂无评论</div>';
    }
}

// 显示评论
function displayReviews(reviews) {
    const reviewsSection = document.getElementById('reviews-section');
    if (!reviewsSection) return;
    
    if (reviews.length === 0) {
        reviewsSection.innerHTML = '<div class="alert alert-info"><i class="bi bi-info-circle"></i> 暂无评论</div>';
        return;
    }
    
    reviewsSection.innerHTML = reviews.map(review => {
        const stars = '★'.repeat(Math.floor(review.rating)) + '☆'.repeat(5 - Math.floor(review.rating));
        return `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between mb-2">
                        <div>
                            <strong>${review.is_anonymous ? '匿名用户' : '用户' + review.user_id}</strong>
                            <span class="text-warning ms-2">${stars}</span>
                        </div>
                        <small class="text-muted">${new Date(review.created_at).toLocaleDateString()}</small>
                    </div>
                    ${review.title ? `<h6>${review.title}</h6>` : ''}
                    <p class="mb-0">${review.content || ''}</p>
                </div>
            </div>
        `;
    }).join('');
}

// 检查是否已收藏
async function checkFavorite(hotelId) {
    if (!currentUserId) return;
    try {
        const result = await favoriteAPI.check(hotelId);
        isFavorited = result.is_favorited;
        favoriteId = result.favorite_id;
        updateFavoriteButton();
    } catch (error) {
        console.error('检查收藏状态失败:', error);
    }
}

// 更新收藏按钮状态
function updateFavoriteButton() {
    const btn = document.getElementById('favorite-btn');
    const text = document.getElementById('favorite-text');
    if (btn && text) {
        if (isFavorited) {
            btn.classList.add('active');
            btn.innerHTML = `<i class="bi bi-heart-fill"></i> <span>已收藏</span>`;
        } else {
            btn.classList.remove('active');
            btn.innerHTML = `<i class="bi bi-heart"></i> <span>收藏</span>`;
        }
    }
}

// 切换收藏状态
async function toggleFavorite() {
    if (!currentHotel) return;
    
    if (!currentUserId) {
        Toast.warning('请先登录后再收藏');
        setTimeout(() => {
            window.location.href = 'login.html?return=' + encodeURIComponent(window.location.href);
        }, 1500);
        return;
    }
    
    try {
        if (isFavorited) {
            await favoriteAPI.removeByHotel(currentHotel.id);
            isFavorited = false;
            favoriteId = null;
            Toast.success('已取消收藏');
        } else {
            const result = await favoriteAPI.add(currentHotel.id);
            isFavorited = true;
            favoriteId = result.id;
            Toast.success('收藏成功');
        }
        
        updateFavoriteButton();
    } catch (error) {
        Toast.error('操作失败: ' + error.message);
    }
}

// 打开预订模态框
function openBookingModal() {
    if (!currentUserId) {
        Toast.warning('请先登录后再预订');
        setTimeout(() => {
            window.location.href = 'login.html?return=' + encodeURIComponent(window.location.href);
        }, 1500);
        return;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('bookingModal'));
    modal.show();
    
    // 重置表单
    document.getElementById('booking-form').reset();
    document.getElementById('preview-price').textContent = '--';
    
    // 设置默认日期
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    document.getElementById('check-in-date').value = DatePicker.formatDate(today);
    document.getElementById('check-out-date').value = DatePicker.formatDate(tomorrow);
    
    calculatePrice();
}

// 计算价格
async function calculatePrice() {
    const hotelId = document.getElementById('booking-hotel-id').value;
    const checkInDate = document.getElementById('check-in-date').value;
    const checkOutDate = document.getElementById('check-out-date').value;
    const roomCount = parseInt(document.getElementById('room-count').value) || 1;
    
    if (!checkInDate || !checkOutDate) {
        document.getElementById('preview-price').textContent = '--';
        return;
    }
    
    // 验证日期范围
    const validation = DatePicker.validateDateRange(checkInDate, checkOutDate);
    if (!validation.valid) {
        document.getElementById('preview-price').textContent = validation.message;
        return;
    }
    
    try {
        const result = await pricingAPI.calculate({
            hotel_id: parseInt(hotelId),
            check_in_date: checkInDate,
            check_out_date: checkOutDate
        });
        
        const nights = DatePicker.getDaysBetween(checkInDate, checkOutDate);
        const totalPrice = parseFloat(result.final_price) * roomCount * nights;
        
        let priceText = `${utils.formatPrice(totalPrice)}`;
        if (result.applied_rules && result.applied_rules.length > 0) {
            priceText += ` <small class="text-success">(已应用优惠: ${result.applied_rules.join(', ')})</small>`;
        }
        
        document.getElementById('preview-price').innerHTML = priceText;
    } catch (error) {
        document.getElementById('preview-price').textContent = '计算失败: ' + error.message;
    }
}

// 提交预订
async function submitBooking() {
    // 检查登录状态
    if (!currentUserId) {
        Toast.error('请先登录');
        const modal = bootstrap.Modal.getInstance(document.getElementById('bookingModal'));
        modal.hide();
        setTimeout(() => {
            window.location.href = 'login.html?return=' + encodeURIComponent(window.location.href);
        }, 1500);
        return;
    }
    
    const hotelId = parseInt(document.getElementById('booking-hotel-id').value);
    const checkInDate = document.getElementById('check-in-date').value;
    const checkOutDate = document.getElementById('check-out-date').value;
    const roomCount = parseInt(document.getElementById('room-count').value) || 1;
    const notes = document.getElementById('booking-notes').value;
    
    // 验证日期
    const validation = DatePicker.validateDateRange(checkInDate, checkOutDate);
    if (!validation.valid) {
        Toast.error(validation.message);
        return;
    }
    
    try {
        await bookingAPI.create({
            hotel_id: hotelId,
            check_in_date: checkInDate,
            check_out_date: checkOutDate,
            room_count: roomCount,
            notes: notes
        });
        
        Toast.success('预订成功！');
        
        // 关闭模态框
        const modal = bootstrap.Modal.getInstance(document.getElementById('bookingModal'));
        modal.hide();
        
        // 重置表单
        document.getElementById('booking-form').reset();
        
        // 刷新酒店详情（更新可用房间数）
        if (currentHotel) {
            loadHotelDetail(currentHotel.id);
        }
    } catch (error) {
        Toast.error('预订失败: ' + error.message);
    }
}
