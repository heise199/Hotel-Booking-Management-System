// 个人中心逻辑
let currentUserId = null;

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
        Toast.warning('请先登录');
        setTimeout(() => {
            window.location.href = 'login.html?return=' + encodeURIComponent(window.location.href);
        }, 1500);
        return false;
    }
    currentUserId = userId;
    return true;
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    // 检查登录状态
    if (!checkLogin()) {
        return;
    }
    
    loadBookings();
    loadFavorites();
    
    // 监听标签页切换
    const bookingsTab = document.getElementById('bookings-tab');
    const favoritesTab = document.getElementById('favorites-tab');
    
    if (bookingsTab) {
        bookingsTab.addEventListener('shown.bs.tab', () => {
            loadBookings();
        });
    }
    
    if (favoritesTab) {
        favoritesTab.addEventListener('shown.bs.tab', () => {
            loadFavorites();
        });
    }
});

// 加载预订列表
async function loadBookings() {
    const bookingsList = document.getElementById('bookings-list');
    bookingsList.innerHTML = `
        <div class="text-center loading-spinner">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">加载中...</span>
            </div>
            <p class="mt-3 text-muted">正在加载预订信息...</p>
        </div>
    `;
    
    try {
        const bookings = await bookingAPI.getList({});
        displayBookings(bookings);
    } catch (error) {
        bookingsList.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i> 加载失败: ${error.message}
            </div>
        `;
        Toast.error('加载预订列表失败: ' + error.message);
    }
}

// 显示预订列表
function displayBookings(bookings) {
    const bookingsList = document.getElementById('bookings-list');
    
    if (bookings.length === 0) {
        bookingsList.innerHTML = `
            <div class="alert alert-info text-center">
                <i class="bi bi-info-circle"></i> 暂无预订记录
            </div>
        `;
        return;
    }
    
    bookingsList.innerHTML = bookings.map((booking, index) => {
        const statusClass = {
            'pending': 'warning',
            'confirmed': 'success',
            'cancelled': 'secondary',
            'completed': 'info'
        }[booking.status] || 'secondary';
        
        const statusText = {
            'pending': '待确认',
            'confirmed': '已确认',
            'cancelled': '已取消',
            'completed': '已完成'
        }[booking.status] || booking.status;
        
        const canCancel = booking.status === 'confirmed' || booking.status === 'pending';
        
        return `
            <div class="booking-card fade-in" style="animation-delay: ${index * 0.1}s">
                <div class="row">
                    <div class="col-md-8">
                        <h5 class="mb-3">
                            <i class="bi bi-calendar-check"></i> 预订 #${booking.id}
                        </h5>
                        <div class="mb-2">
                            <strong><i class="bi bi-calendar-event"></i> 入住日期：</strong>
                            ${utils.formatDate(booking.check_in_date)}
                        </div>
                        <div class="mb-2">
                            <strong><i class="bi bi-calendar-x"></i> 离店日期：</strong>
                            ${utils.formatDate(booking.check_out_date)}
                        </div>
                        <div class="mb-2">
                            <strong><i class="bi bi-moon-stars"></i> 入住天数：</strong>
                            ${booking.nights} 晚
                        </div>
                        <div class="mb-2">
                            <strong><i class="bi bi-door-open"></i> 房间数量：</strong>
                            ${booking.room_count} 间
                        </div>
                        ${booking.notes ? `
                            <div class="mt-2">
                                <small class="text-muted">
                                    <i class="bi bi-chat-left-text"></i> 备注：${booking.notes}
                                </small>
                            </div>
                        ` : ''}
                    </div>
                    <div class="col-md-4 text-end">
                        <div class="mb-3">
                            <span class="status-badge ${statusClass}">${statusText}</span>
                        </div>
                        <div class="mb-3">
                            <div class="text-muted small mb-1">总价</div>
                            <div class="text-danger fw-bold fs-4">${utils.formatPrice(booking.final_price)}</div>
                        </div>
                        <div class="text-muted small mb-3">
                            基础价格: ${utils.formatPrice(booking.base_price)}/晚<br>
                            ${booking.discount_rate > 0 ? `折扣: ${booking.discount_rate}%` : ''}
                        </div>
                        <div class="d-grid gap-2">
                            <a href="booking-detail.html?id=${booking.id}" class="btn btn-primary btn-sm">
                                <i class="bi bi-eye"></i> 查看详情
                            </a>
                            ${canCancel ? `
                                <button class="btn btn-outline-danger btn-sm" onclick="cancelBooking(${booking.id})">
                                    <i class="bi bi-x-circle"></i> 取消预订
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 取消预订
async function cancelBooking(bookingId) {
    if (!confirm('确定要取消此预订吗？')) {
        return;
    }
    
    try {
        await bookingAPI.cancel(bookingId);
        Toast.success('预订已取消');
        loadBookings();
    } catch (error) {
        Toast.error('取消失败: ' + error.message);
    }
}

// 加载收藏列表
async function loadFavorites() {
    const favoritesList = document.getElementById('favorites-list');
    favoritesList.innerHTML = `
        <div class="text-center loading-spinner">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">加载中...</span>
            </div>
            <p class="mt-3 text-muted">正在加载收藏信息...</p>
        </div>
    `;
    
    try {
        const favorites = await favoriteAPI.getList();
        displayFavorites(favorites);
    } catch (error) {
        favoritesList.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i> 加载失败: ${error.message}
            </div>
        `;
        Toast.error('加载收藏列表失败: ' + error.message);
    }
}

// 显示收藏列表
function displayFavorites(favorites) {
    const favoritesList = document.getElementById('favorites-list');
    
    if (favorites.length === 0) {
        favoritesList.innerHTML = `
            <div class="alert alert-info text-center">
                <i class="bi bi-info-circle"></i> 暂无收藏记录
            </div>
        `;
        return;
    }
    
    favoritesList.innerHTML = '<div class="row">' + favorites.map((favorite, index) => {
        const hotel = favorite.hotel;
        if (!hotel) return '';
        
        const tags = utils.parseJson(hotel.tags);
        const images = utils.parseJson(hotel.images);
        const imageUrl = images && images.length > 0 ? images[0] : 'https://via.placeholder.com/300x200?text=Hotel';
        
        return `
            <div class="col-md-6 col-lg-4 mb-4 fade-in" style="animation-delay: ${index * 0.1}s">
                <div class="favorite-card h-100">
                    <img src="${imageUrl}" class="card-img-top" style="height: 200px; object-fit: cover; border-radius: var(--radius-md);" 
                         alt="${hotel.name}" onerror="this.src='https://via.placeholder.com/300x200?text=Hotel'">
                    <div class="card-body">
                        <h5 class="card-title">${hotel.name}</h5>
                        <p class="card-text text-muted small mb-2">
                            <i class="bi bi-geo-alt"></i> ${hotel.address}
                        </p>
                        <div class="mb-2">
                            ${tags && tags.length > 0 ? tags.map(tag => 
                                `<span class="tag-badge">${tag}</span>`
                            ).join('') : ''}
                        </div>
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <span class="text-danger fw-bold">${utils.formatPrice(hotel.base_price)}</span>
                                <small class="text-muted">/晚</small>
                            </div>
                            <div class="rating-display">
                                <span class="stars">★</span>
                                <span class="rating-number">${hotel.rating || '0.0'}</span>
                            </div>
                        </div>
                        <div class="d-grid gap-2">
                            <a href="detail.html?id=${hotel.id}" class="btn btn-primary btn-sm">
                                <i class="bi bi-eye"></i> 查看详情
                            </a>
                            <button class="btn btn-outline-danger btn-sm" onclick="removeFavorite(${favorite.id})">
                                <i class="bi bi-heart-break"></i> 取消收藏
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('') + '</div>';
}

// 取消收藏
async function removeFavorite(favoriteId) {
    if (!confirm('确定要取消收藏吗？')) {
        return;
    }
    
    try {
        await favoriteAPI.remove(favoriteId);
        Toast.success('已取消收藏');
        loadFavorites();
    } catch (error) {
        Toast.error('操作失败: ' + error.message);
    }
}
