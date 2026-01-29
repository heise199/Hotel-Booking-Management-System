// API调用封装
const API_BASE_URL = 'http://localhost:8000/api';

// 通用请求函数
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    // 添加认证 token（如果存在）
    const token = localStorage.getItem('access_token');
    if (token) {
        defaultOptions.headers['Authorization'] = `Bearer ${token}`;
        // 调试：记录token的前20个字符
        console.log('API请求 - 发送token:', endpoint, token.substring(0, 20) + '...');
    } else {
        // 调试：如果没有token，记录日志
        console.warn('API请求缺少token:', endpoint);
    }
    
    const config = { ...defaultOptions, ...options };
    
    // 如果 options 中已有 headers，合并它们
    if (options.headers) {
        config.headers = { ...defaultOptions.headers, ...options.headers };
    }
    
    try {
        const response = await fetch(url, config);
        
        // 处理非 JSON 响应（如 500 错误返回的 HTML）
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            // 如果是401错误，可能是token过期或无效，清除本地存储
            if (response.status === 401) {
                console.warn('认证失败，清除本地token');
                localStorage.removeItem('access_token');
                localStorage.removeItem('user');
            }
            
            // 处理422错误（验证错误）的详细信息
            let errorMessage = '请求失败';
            if (data.detail) {
                if (Array.isArray(data.detail)) {
                    // FastAPI验证错误通常是数组格式
                    errorMessage = data.detail.map(err => {
                        if (typeof err === 'string') return err;
                        return `${err.loc?.join('.') || '字段'}: ${err.msg || '验证失败'}`;
                    }).join('; ');
                } else {
                    errorMessage = data.detail;
                }
            }
            
            console.error('API错误详情:', {
                status: response.status,
                statusText: response.statusText,
                data: data
            });
            
            throw new Error(errorMessage);
        }
        
        return data;
    } catch (error) {
        console.error('API请求错误:', error);
        throw error;
    }
}

// 认证相关API
const authAPI = {
    // 登录
    login: async (username, password) => {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || '登录失败');
        }
        
        // 保存 token
        if (data.access_token) {
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        return data;
    },
    
    // 注册
    register: (userData) => apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
    }),
    
    // 获取当前用户信息
    getMe: () => apiRequest('/auth/me'),
    
    // 登出
    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        return Promise.resolve({ message: '登出成功' });
    },
    
    // 检查是否已登录
    isLoggedIn: () => {
        return !!localStorage.getItem('access_token');
    },
    
    // 获取当前用户
    getCurrentUser: () => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }
};

// 酒店相关API
const hotelAPI = {
    // 获取酒店列表
    getList: (params = {}) => {
        console.log('=== hotelAPI.getList 开始 ===');
        console.log('接收到的原始参数:', JSON.stringify(params));
        
        // 第一步：预先清理所有参数，确保数字参数是数字类型
        const cleanedParams = {};
        for (const [key, value] of Object.entries(params)) {
            if (value === null || value === undefined || value === '') {
                continue;
            }
            
            // 对于数字类型的参数，强制清理
            if (['min_price', 'max_price', 'min_rating', 'skip', 'limit', 'city_id', 'star_level'].includes(key)) {
                // 无论传入什么类型，都先转换为字符串，然后清理
                const strValue = String(value);
                console.log(`清理数字参数 ${key}: 原始值="${strValue}" (类型: ${typeof value})`);
                
                // 移除非数字字符（保留小数点），包括 + 号
                const cleanedValue = strValue.replace(/[^0-9.]/g, '');
                const numValue = parseFloat(cleanedValue);
                
                console.log(`清理数字参数 ${key}: 清理后="${cleanedValue}", 解析为=${numValue}`);
                
                // 确保是有效的数字
                if (!isNaN(numValue) && numValue >= 0 && isFinite(numValue)) {
                    cleanedParams[key] = Number(numValue); // 确保是数字类型
                    console.log(`✓ 参数清理成功 ${key}: "${value}" -> ${cleanedParams[key]} (类型: ${typeof cleanedParams[key]})`);
                } else {
                    console.warn(`✗ 跳过无效的数字参数 ${key}:`, value, '->', numValue);
                }
            } else if (key === 'is_recommended') {
                cleanedParams[key] = value === 'true' || value === true;
            } else {
                cleanedParams[key] = value;
            }
        }
        
        console.log('清理后的参数:', JSON.stringify(cleanedParams));
        
        // 第二步：使用清理后的参数构建查询字符串
        const queryParts = [];
        for (const [key, value] of Object.entries(cleanedParams)) {
            if (value === null || value === undefined || value === '') {
                continue;
            }
            
            if (['min_price', 'max_price', 'min_rating', 'skip', 'limit', 'city_id', 'star_level'].includes(key)) {
                // 这些参数现在应该是数字类型，直接转换为字符串（不编码，因为数字不需要编码）
                const numStr = String(value);
                queryParts.push(`${key}=${numStr}`);
                console.log(`添加数字参数到查询: ${key}=${numStr}`);
            } else if (key === 'is_recommended') {
                queryParts.push(`${key}=${value}`);
            } else {
                queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
            }
        }
        
        const queryString = queryParts.join('&');
        console.log('最终查询字符串:', queryString);
        console.log('完整URL:', `/hotels${queryString ? '?' + queryString : ''}`);
        console.log('=== hotelAPI.getList 结束 ===');
        return apiRequest(`/hotels${queryString ? '?' + queryString : ''}`);
    },
    
    // 获取酒店详情
    getDetail: (id) => apiRequest(`/hotels/${id}`),
    
    // 创建酒店（管理员）
    create: (data) => apiRequest('/hotels', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    
    // 更新酒店（管理员）
    update: (id, data) => apiRequest(`/hotels/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    
    // 删除酒店（管理员）
    delete: (id) => apiRequest(`/hotels/${id}`, {
        method: 'DELETE',
    }),
};

// 预订相关API
const bookingAPI = {
    // 创建预订（不再传递user_id，后端从token获取）
    create: (data) => {
        // 不传递user_id参数，后端会从JWT token中获取
        return apiRequest(`/bookings`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    
    // 获取预订列表（不再传递user_id，后端从token获取）
    getList: (params = {}) => {
        // 不传递user_id参数，后端会从JWT token中获取
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/bookings?${queryString}`);
    },
    
    // 获取预订详情
    getDetail: (id) => apiRequest(`/bookings/${id}`),
    
    // 取消预订
    cancel: (id) => apiRequest(`/bookings/${id}/cancel`, {
        method: 'PUT',
    }),
};

// 收藏相关API（不再传递user_id，后端从token获取）
const favoriteAPI = {
    // 添加收藏
    add: (hotelId) => {
        return apiRequest(`/favorites`, {
            method: 'POST',
            body: JSON.stringify({ hotel_id: hotelId }),
        });
    },
    
    // 取消收藏
    remove: (favoriteId) => {
        return apiRequest(`/favorites/${favoriteId}`, {
            method: 'DELETE',
        });
    },
    
    // 根据酒店ID取消收藏
    removeByHotel: (hotelId) => {
        return apiRequest(`/favorites/hotel/${hotelId}`, {
            method: 'DELETE',
        });
    },
    
    // 获取收藏列表
    getList: () => {
        return apiRequest(`/favorites`);
    },
    
    // 检查是否已收藏
    check: (hotelId) => {
        // 如果未登录，返回未收藏
        if (!authAPI.isLoggedIn()) {
            return Promise.resolve({ is_favorited: false, favorite_id: null });
        }
        return apiRequest(`/favorites/check/${hotelId}`);
    },
};

// 价格相关API
const pricingAPI = {
    // 计算价格
    calculate: (data) => apiRequest('/pricing/calculate', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    
    // 获取价格规则列表
    getRules: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/pricing/rules?${queryString}`);
    },
    
    // 创建价格规则（管理员）
    createRule: (data) => apiRequest('/pricing/rules', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    
    // 更新价格规则（管理员）
    updateRule: (id, data) => apiRequest(`/pricing/rules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    
    // 删除价格规则（管理员）
    deleteRule: (id) => apiRequest(`/pricing/rules/${id}`, {
        method: 'DELETE',
    }),
};

// 统计相关API
const statisticsAPI = {
    // 获取统计概览
    getOverview: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/statistics/overview?${queryString}`);
    },
    
    // 按日期统计
    getByDate: (params) => {
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/statistics/by-date?${queryString}`);
    },
    
    // 按酒店统计
    getByHotel: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/statistics/by-hotel?${queryString}`);
    },
    
    // 按用户类型统计
    getByUserType: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/statistics/by-user-type?${queryString}`);
    },
};

// 城市相关API
const cityAPI = {
    // 获取城市列表
    getList: (isHot = null) => {
        const params = {};
        if (isHot !== null) params.is_hot = isHot;
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/cities?${queryString}`);
    },
    
    // 获取城市详情
    getDetail: (id) => apiRequest(`/cities/${id}`),
};

// 房间类型相关API
const roomTypeAPI = {
    // 获取酒店的房间类型列表
    getByHotel: (hotelId) => apiRequest(`/room-types/hotel/${hotelId}`),
    
    // 获取房间类型详情
    getDetail: (id) => apiRequest(`/room-types/${id}`),
};

// 评论相关API
const reviewAPI = {
    // 获取评论列表
    getList: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/reviews?${queryString}`);
    },
    
    // 获取酒店的评论列表
    getByHotel: (hotelId, params = {}) => {
        const queryString = new URLSearchParams({...params, hotel_id: hotelId}).toString();
        return apiRequest(`/reviews?${queryString}`);
    },
    
    // 创建评论（不再传递user_id，后端从token获取）
    create: (data) => {
        return apiRequest(`/reviews`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
};

// 优惠券相关API（不再传递user_id，后端从token获取）
const couponAPI = {
    // 获取可用优惠券列表
    getAvailable: (hotelId = null) => {
        const params = {};
        if (hotelId) params.hotel_id = hotelId;
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/coupons/available?${queryString}`);
    },
    
    // 获取我的优惠券
    getMy: (status = null) => {
        const params = {};
        if (status) params.status = status;
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/coupons/my?${queryString}`);
    },
    
    // 领取优惠券
    obtain: (couponId) => {
        return apiRequest(`/coupons/obtain/${couponId}`, {
            method: 'POST',
        });
    },
};

// 工具函数
const utils = {
    // 格式化日期
    formatDate: (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    },
    
    // 格式化价格
    formatPrice: (price) => {
        return `¥${parseFloat(price).toFixed(2)}`;
    },
    
    // 显示提示消息
    showMessage: (message, type = 'info') => {
        const alertClass = type === 'error' ? 'alert-danger' : 
                          type === 'success' ? 'alert-success' : 'alert-info';
        const alertHtml = `
            <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        const container = document.getElementById('message-container') || document.body;
        container.insertAdjacentHTML('afterbegin', alertHtml);
        
        // 3秒后自动关闭
        setTimeout(() => {
            const alert = container.querySelector('.alert');
            if (alert) {
                alert.remove();
            }
        }, 3000);
    },
    
    // 解析JSON字符串
    parseJson: (str) => {
        if (!str) return [];
        try {
            return JSON.parse(str);
        } catch {
            return [];
        }
    },
};
