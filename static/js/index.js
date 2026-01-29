// 首页逻辑
let currentUserId = null;
let currentFilters = {
    price: null,
    rating: null
};

// 检查登录状态
function checkLoginStatus() {
    const user = authAPI.getCurrentUser();
    if (user) {
        currentUserId = user.id;
        // 显示用户菜单
        const userMenu = document.getElementById('user-menu');
        const logoutMenu = document.getElementById('logout-menu');
        const loginMenu = document.getElementById('login-menu');
        const adminMenu = document.getElementById('admin-menu');
        
        if (userMenu) userMenu.style.display = 'block';
        if (logoutMenu) logoutMenu.style.display = 'block';
        if (loginMenu) loginMenu.style.display = 'none';
        
        // 如果是管理员，显示管理后台菜单
        if (user.role === 'admin' && adminMenu) {
            adminMenu.style.display = 'block';
        }
    } else {
        // 未登录
        currentUserId = null;
        const userMenu = document.getElementById('user-menu');
        const logoutMenu = document.getElementById('logout-menu');
        const loginMenu = document.getElementById('login-menu');
        const adminMenu = document.getElementById('admin-menu');
        
        if (userMenu) userMenu.style.display = 'none';
        if (adminMenu) adminMenu.style.display = 'none';
        if (logoutMenu) logoutMenu.style.display = 'none';
        if (loginMenu) loginMenu.style.display = 'block';
    }
}

// 处理登出
function handleLogout() {
    authAPI.logout();
    Toast.success('已成功登出');
    setTimeout(() => {
        window.location.reload();
    }, 500);
}

// 加载酒店列表
async function loadHotels(params = {}) {
    console.log('=== loadHotels 开始 ===');
    console.log('接收到的原始参数:', JSON.stringify(params));
    
    // 最终清理参数，确保所有数字参数都是数字类型
    const cleanParams = {};
    for (const [key, value] of Object.entries(params)) {
        if (value === null || value === undefined || value === '') {
            continue;
        }
        
        // 对于数字参数，确保是数字类型
        if (['min_price', 'max_price', 'min_rating', 'skip', 'limit', 'city_id', 'star_level'].includes(key)) {
            const strValue = String(value);
            const cleanedStr = strValue.replace(/[^0-9.]/g, '');
            const numValue = parseFloat(cleanedStr);
            
            console.log(`loadHotels 清理 ${key}: "${value}" (类型: ${typeof value}) -> "${cleanedStr}" -> ${numValue}`);
            
            if (!isNaN(numValue) && numValue >= 0 && isFinite(numValue)) {
                cleanParams[key] = Number(numValue); // 确保是数字类型
                console.log(`✓ loadHotels 清理成功 ${key}: ${cleanParams[key]} (类型: ${typeof cleanParams[key]})`);
            } else {
                console.warn(`✗ loadHotels 跳过无效参数 ${key}:`, value);
            }
        } else if (key === 'is_recommended') {
            cleanParams[key] = value === 'true' || value === true;
        } else {
            cleanParams[key] = value;
        }
    }
    
    console.log('loadHotels 清理后的参数:', JSON.stringify(cleanParams));
    console.log('=== loadHotels 结束，调用 hotelAPI.getList ===');
    
    const hotelList = document.getElementById('hotel-list');
    hotelList.innerHTML = `
        <div class="col-12 text-center loading-spinner">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">加载中...</span>
            </div>
            <p class="mt-3 text-muted">正在加载酒店信息...</p>
        </div>
    `;
    
    try {
        const hotels = await hotelAPI.getList(cleanParams);
        displayHotels(hotels);
    } catch (error) {
        hotelList.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle"></i> 加载失败: ${error.message}
                </div>
            </div>
        `;
        Toast.error('加载酒店列表失败: ' + error.message);
    }
}

// 显示酒店列表
function displayHotels(hotels) {
    const hotelList = document.getElementById('hotel-list');
    
    if (hotels.length === 0) {
        hotelList.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info text-center">
                    <i class="bi bi-info-circle"></i> 暂无酒店数据，请尝试调整搜索条件
                </div>
            </div>
        `;
        return;
    }
    
    hotelList.innerHTML = hotels.map((hotel, index) => {
        const tags = utils.parseJson(hotel.tags);
        const images = utils.parseJson(hotel.images);
        const imageUrl = images && images.length > 0 ? images[0] : 'https://via.placeholder.com/400x220?text=Hotel';
        const cityName = hotel.city ? hotel.city.name : '';
        const starLevel = hotel.star_level || 0;
        const stars = '★'.repeat(starLevel) + '☆'.repeat(5 - starLevel);
        const isRecommended = hotel.is_recommended;
        
        return `
            <div class="col-md-6 col-lg-4 mb-4 fade-in" style="animation-delay: ${index * 0.1}s">
                <div class="card hotel-card h-100">
                    ${isRecommended ? `
                        <div class="recommend-badge">
                            <i class="bi bi-star-fill"></i> 推荐
                        </div>
                    ` : ''}
                    <img src="${imageUrl}" class="card-img-top hotel-image" alt="${hotel.name}" 
                         onerror="this.src='https://via.placeholder.com/400x220?text=Hotel'">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${hotel.name}</h5>
                        <p class="card-text text-muted small mb-2">
                            <i class="bi bi-geo-alt"></i> ${cityName ? cityName + ' · ' : ''}${hotel.address}
                        </p>
                        <div class="mb-2">
                            <small class="text-warning">${stars}</small>
                            ${tags && tags.length > 0 ? tags.map(tag => 
                                `<span class="tag-badge">${tag}</span>`
                            ).join('') : ''}
                        </div>
                        <div class="d-flex justify-content-between align-items-center mb-3 mt-auto">
                            <div>
                                <span class="price">${utils.formatPrice(hotel.base_price)}</span>
                                <span class="price-unit">/晚</span>
                            </div>
                            <div class="rating-display">
                                <span class="stars">★</span>
                                <span class="rating-number">${hotel.rating || '0.0'}</span>
                                <small class="text-muted">(${hotel.review_count || 0})</small>
                            </div>
                        </div>
                        <a href="detail.html?id=${hotel.id}" class="btn btn-primary w-100">
                            <i class="bi bi-eye"></i> 查看详情
                        </a>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 加载城市列表（用于筛选）
async function loadCities() {
    try {
        const cities = await cityAPI.getList(true); // 只获取热门城市
        // 可以在这里添加城市筛选下拉框
    } catch (error) {
        console.error('加载城市列表失败:', error);
    }
}

// 初始化筛选标签
function initFilterTags() {
    const filterTags = document.querySelectorAll('.filter-tag');
    filterTags.forEach(tag => {
        tag.addEventListener('click', function() {
            const filter = this.dataset.filter;
            const value = this.dataset.value;
            
            // 切换选中状态
            if (this.classList.contains('active')) {
                this.classList.remove('active');
                currentFilters[filter] = null;
            } else {
                // 取消同类型其他标签的选中
                document.querySelectorAll(`.filter-tag[data-filter="${filter}"]`).forEach(t => {
                    t.classList.remove('active');
                });
                this.classList.add('active');
                currentFilters[filter] = value;
            }
            
            // 应用筛选
            applyFilters();
        });
    });
}

// 应用筛选条件
function applyFilters() {
    const params = {};
    
    // 价格筛选
    if (currentFilters.price) {
        const priceValue = String(currentFilters.price).trim();
        console.log('处理价格筛选:', priceValue); // 调试日志
        
        // 处理 "1000+" 这种格式（只有最小值）
        if (priceValue.endsWith('+')) {
            const minPrice = parseFloat(priceValue.replace(/[^0-9.]/g, ''));
            if (!isNaN(minPrice) && minPrice > 0) {
                params.min_price = minPrice;
                console.log('设置 min_price:', minPrice); // 调试日志
            }
        } else if (priceValue.includes('-')) {
            // 处理 "200-500" 这种格式（有最小值和最大值）
            const [min, max] = priceValue.split('-');
            if (min && min !== '0') {
                const minPrice = parseFloat(String(min).replace(/[^0-9.]/g, ''));
                if (!isNaN(minPrice) && minPrice > 0) {
                    params.min_price = minPrice;
                }
            }
            if (max) {
                const maxPrice = parseFloat(String(max).replace(/[^0-9.]/g, ''));
                if (!isNaN(maxPrice) && maxPrice > 0) {
                    params.max_price = maxPrice;
                }
            }
        } else {
            // 如果格式不符合预期，尝试直接解析
            const numValue = parseFloat(priceValue.replace(/[^0-9.]/g, ''));
            if (!isNaN(numValue) && numValue > 0) {
                params.min_price = numValue;
            }
        }
    }
    
    // 评分筛选
    if (currentFilters.rating) {
        const minRating = parseFloat(currentFilters.rating.replace('+', ''));
        if (!isNaN(minRating)) params.min_rating = minRating;
    }
    
    // 搜索框条件
    const name = document.getElementById('search-name').value;
    if (name) params.name = name;
    
    const minPriceInput = document.getElementById('search-min-price')?.value;
    if (minPriceInput) {
        // 移除非数字字符并转换为数字
        const minPrice = parseFloat(minPriceInput.replace(/[^0-9.]/g, ''));
        if (!isNaN(minPrice)) {
            params.min_price = params.min_price ? Math.min(params.min_price, minPrice) : minPrice;
        }
    }
    
    const maxPriceInput = document.getElementById('search-max-price')?.value;
    if (maxPriceInput) {
        // 移除非数字字符并转换为数字
        const maxPrice = parseFloat(maxPriceInput.replace(/[^0-9.]/g, ''));
        if (!isNaN(maxPrice)) {
            params.max_price = params.max_price ? Math.max(params.max_price, maxPrice) : maxPrice;
        }
    }
    
    const tag = document.getElementById('search-tag')?.value;
    if (tag) params.tag = tag;
    
    // 确保所有数字参数都是数字类型（双重保险）
    if (params.min_price !== undefined) {
        const originalValue = params.min_price;
        const cleanedStr = String(params.min_price).replace(/[^0-9.]/g, '');
        params.min_price = parseFloat(cleanedStr);
        if (isNaN(params.min_price)) {
            console.warn('min_price 清理失败，原始值:', originalValue);
            delete params.min_price;
        } else {
            console.log('min_price 清理成功:', originalValue, '->', params.min_price, '(类型:', typeof params.min_price, ')');
        }
    }
    if (params.max_price !== undefined) {
        const originalValue = params.max_price;
        const cleanedStr = String(params.max_price).replace(/[^0-9.]/g, '');
        params.max_price = parseFloat(cleanedStr);
        if (isNaN(params.max_price)) {
            console.warn('max_price 清理失败，原始值:', originalValue);
            delete params.max_price;
        } else {
            console.log('max_price 清理成功:', originalValue, '->', params.max_price, '(类型:', typeof params.max_price, ')');
        }
    }
    if (params.min_rating !== undefined) {
        const originalValue = params.min_rating;
        const cleanedStr = String(params.min_rating).replace(/[^0-9.]/g, '');
        params.min_rating = parseFloat(cleanedStr);
        if (isNaN(params.min_rating)) {
            console.warn('min_rating 清理失败，原始值:', originalValue);
            delete params.min_rating;
        } else {
            console.log('min_rating 清理成功:', originalValue, '->', params.min_rating, '(类型:', typeof params.min_rating, ')');
        }
    }
    
    console.log('applyFilters 最终参数:', params);
    loadHotels(params);
}

// 搜索酒店
function searchHotels() {
    // 清除筛选标签的选中状态
    document.querySelectorAll('.filter-tag').forEach(tag => {
        tag.classList.remove('active');
    });
    currentFilters = { price: null, rating: null };
    
    applyFilters();
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    loadHotels();
    loadCities();
    initFilterTags();
    
    // 搜索框回车搜索
    const searchInputs = ['search-name', 'search-min-price', 'search-max-price'];
    searchInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    searchHotels();
                }
            });
        }
    });
});
