// 预订详情页逻辑
let currentBooking = null;
let currentBookingId = null;

// 格式化日期时间
function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 检查登录状态
function checkLogin() {
    const user = authAPI.getCurrentUser();
    if (!user) {
        Toast.warning('请先登录');
        setTimeout(() => {
            window.location.href = 'login.html?return=' + encodeURIComponent(window.location.href);
        }, 1500);
        return false;
    }
    return true;
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    // 检查登录状态
    if (!checkLogin()) {
        return;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('id');
    
    if (bookingId) {
        currentBookingId = parseInt(bookingId);
        loadBookingDetail(currentBookingId);
    } else {
        document.getElementById('booking-detail').innerHTML = 
            '<div class="alert alert-danger"><i class="bi bi-exclamation-triangle"></i> 缺少预订ID参数</div>';
    }
});

// 加载预订详情
async function loadBookingDetail(bookingId) {
    try {
        currentBooking = await bookingAPI.getDetail(bookingId);
        displayBookingDetail(currentBooking);
    } catch (error) {
        document.getElementById('booking-detail').innerHTML = 
            `<div class="alert alert-danger"><i class="bi bi-exclamation-triangle"></i> 加载失败: ${error.message}</div>`;
        Toast.error('加载预订详情失败: ' + error.message);
    }
}

// 显示预订详情
function displayBookingDetail(booking) {
    const hotel = booking.hotel || {};
    const cityName = hotel.city ? hotel.city.name : '';
    const starLevel = hotel.star_level || 0;
    const stars = '★'.repeat(starLevel) + '☆'.repeat(5 - starLevel);
    const images = utils.parseJson(hotel.images);
    const imageUrl = images && images.length > 0 ? images[0] : 'https://via.placeholder.com/800x500?text=Hotel';
    
    // 状态信息
    const statusClass = {
        'pending': 'warning',
        'confirmed': 'success',
        'cancelled': 'secondary',
        'completed': 'info',
        'no_show': 'danger'
    }[booking.status] || 'secondary';
    
    const statusText = {
        'pending': '待确认',
        'confirmed': '已确认',
        'cancelled': '已取消',
        'completed': '已完成',
        'no_show': '未入住'
    }[booking.status] || booking.status;
    
    // 支付状态
    const paymentStatusClass = {
        'unpaid': 'warning',
        'paid': 'success',
        'refunded': 'secondary',
        'partial_refund': 'info'
    }[booking.payment_status] || 'secondary';
    
    const paymentStatusText = {
        'unpaid': '未支付',
        'paid': '已支付',
        'refunded': '已退款',
        'partial_refund': '部分退款'
    }[booking.payment_status] || booking.payment_status;
    
    // 支付方式
    const paymentMethodText = {
        'alipay': '支付宝',
        'wechat': '微信支付',
        'bank_card': '银行卡',
        'cash': '现金',
        'points': '积分'
    }[booking.payment_method] || booking.payment_method || '未选择';
    
    // 是否可以取消
    const canCancel = booking.status === 'confirmed' || booking.status === 'pending';
    
    // 计算折扣金额
    const discountAmount = booking.final_price - (booking.base_price * booking.nights * booking.room_count);
    
    const html = `
        <!-- 预订状态卡片 -->
        <div class="card mb-4">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <h3 class="mb-2">
                            <i class="bi bi-calendar-check"></i> 预订编号：${booking.booking_no}
                        </h3>
                        <div class="d-flex align-items-center gap-3 mb-2">
                            <span class="badge bg-${statusClass} fs-6">${statusText}</span>
                            <span class="badge bg-${paymentStatusClass} fs-6">${paymentStatusText}</span>
                        </div>
                        <p class="text-muted mb-0">
                            <i class="bi bi-clock"></i> 预订时间：${formatDateTime(booking.booking_time)}
                            ${booking.confirm_time ? `<br><i class="bi bi-check-circle"></i> 确认时间：${formatDateTime(booking.confirm_time)}` : ''}
                            ${booking.cancel_time ? `<br><i class="bi bi-x-circle"></i> 取消时间：${formatDateTime(booking.cancel_time)}` : ''}
                        </p>
                    </div>
                    <div class="col-md-4 text-end">
                        ${canCancel ? `
                            <button class="btn btn-outline-danger btn-lg" data-bs-toggle="modal" data-bs-target="#cancelModal">
                                <i class="bi bi-x-circle"></i> 取消预订
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row">
            <!-- 左侧：酒店信息 -->
            <div class="col-lg-8">
                <div class="card mb-4">
                    <div class="card-header bg-primary text-white">
                        <h4 class="mb-0">
                            <i class="bi bi-building"></i> 酒店信息
                        </h4>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-4 mb-3">
                                <img src="${imageUrl}" class="img-fluid rounded" alt="${hotel.name}" 
                                     onerror="this.src='https://via.placeholder.com/300x200?text=Hotel'">
                            </div>
                            <div class="col-md-8">
                                <h4 class="mb-2">${hotel.name || '未知酒店'}</h4>
                                <p class="text-muted mb-2">
                                    <i class="bi bi-geo-alt"></i> ${cityName ? cityName + ' · ' : ''}${hotel.address || '地址未知'}
                                </p>
                                <div class="mb-2">
                                    <span class="text-warning fs-5">${stars}</span>
                                    ${hotel.rating ? `<span class="ms-2">评分：${hotel.rating}</span>` : ''}
                                </div>
                                ${hotel.phone ? `
                                    <p class="mb-2">
                                        <i class="bi bi-telephone"></i> 联系电话：${hotel.phone}
                                    </p>
                                ` : ''}
                                <a href="detail.html?id=${hotel.id}" class="btn btn-primary btn-sm">
                                    <i class="bi bi-eye"></i> 查看酒店详情
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 入住信息 -->
                <div class="card mb-4">
                    <div class="card-header bg-info text-white">
                        <h4 class="mb-0">
                            <i class="bi bi-calendar-event"></i> 入住信息
                        </h4>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <h6 class="text-muted">入住日期</h6>
                                <p class="fs-5 mb-0">
                                    <i class="bi bi-calendar-check"></i> ${utils.formatDate(booking.check_in_date)}
                                </p>
                                ${hotel.check_in_time ? `
                                    <small class="text-muted">入住时间：${hotel.check_in_time}</small>
                                ` : ''}
                            </div>
                            <div class="col-md-6 mb-3">
                                <h6 class="text-muted">离店日期</h6>
                                <p class="fs-5 mb-0">
                                    <i class="bi bi-calendar-x"></i> ${utils.formatDate(booking.check_out_date)}
                                </p>
                                ${hotel.check_out_time ? `
                                    <small class="text-muted">退房时间：${hotel.check_out_time}</small>
                                ` : ''}
                            </div>
                            <div class="col-md-6 mb-3">
                                <h6 class="text-muted">入住天数</h6>
                                <p class="fs-5 mb-0">
                                    <i class="bi bi-moon-stars"></i> ${booking.nights} 晚
                                </p>
                            </div>
                            <div class="col-md-6 mb-3">
                                <h6 class="text-muted">房间数量</h6>
                                <p class="fs-5 mb-0">
                                    <i class="bi bi-door-open"></i> ${booking.room_count} 间
                                </p>
                            </div>
                            ${booking.guest_name ? `
                                <div class="col-md-6 mb-3">
                                    <h6 class="text-muted">入住人姓名</h6>
                                    <p class="fs-5 mb-0">
                                        <i class="bi bi-person"></i> ${booking.guest_name}
                                    </p>
                                </div>
                            ` : ''}
                            ${booking.guest_phone ? `
                                <div class="col-md-6 mb-3">
                                    <h6 class="text-muted">入住人电话</h6>
                                    <p class="fs-5 mb-0">
                                        <i class="bi bi-telephone"></i> ${booking.guest_phone}
                                    </p>
                                </div>
                            ` : ''}
                        </div>
                        ${booking.notes ? `
                            <div class="mt-3 pt-3 border-top">
                                <h6 class="text-muted">备注信息</h6>
                                <p class="mb-0">${booking.notes}</p>
                            </div>
                        ` : ''}
                        ${booking.cancel_reason ? `
                            <div class="mt-3 pt-3 border-top">
                                <h6 class="text-muted text-danger">取消原因</h6>
                                <p class="mb-0">${booking.cancel_reason}</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <!-- 右侧：价格明细 -->
            <div class="col-lg-4">
                <div class="card mb-4 sticky-top" style="top: 90px;">
                    <div class="card-header bg-success text-white">
                        <h4 class="mb-0">
                            <i class="bi bi-cash-coin"></i> 价格明细
                        </h4>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-2">
                                <span class="text-muted">基础价格</span>
                                <span>${utils.formatPrice(booking.base_price)}/晚</span>
                            </div>
                            <div class="d-flex justify-content-between mb-2">
                                <span class="text-muted">房间数 × 天数</span>
                                <span>${booking.room_count} × ${booking.nights}</span>
                            </div>
                            <div class="d-flex justify-content-between mb-2">
                                <span class="text-muted">小计</span>
                                <span>${utils.formatPrice(booking.base_price * booking.nights * booking.room_count)}</span>
                            </div>
                            ${booking.discount_rate > 0 ? `
                                <div class="d-flex justify-content-between mb-2 text-success">
                                    <span>折扣（${booking.discount_rate}%）</span>
                                    <span>-${utils.formatPrice(discountAmount)}</span>
                                </div>
                            ` : ''}
                            ${booking.coupon_discount > 0 ? `
                                <div class="d-flex justify-content-between mb-2 text-success">
                                    <span>优惠券折扣</span>
                                    <span>-${utils.formatPrice(booking.coupon_discount)}</span>
                                </div>
                            ` : ''}
                            <hr>
                            <div class="d-flex justify-content-between">
                                <strong class="fs-5">总计</strong>
                                <strong class="fs-4 text-danger">${utils.formatPrice(booking.final_price)}</strong>
                            </div>
                        </div>
                        
                        <hr>
                        
                        <div class="mb-3">
                            <h6 class="text-muted mb-2">支付信息</h6>
                            <div class="mb-2">
                                <span class="text-muted">支付状态：</span>
                                <span class="badge bg-${paymentStatusClass}">${paymentStatusText}</span>
                            </div>
                            <div class="mb-2">
                                <span class="text-muted">支付方式：</span>
                                <span>${paymentMethodText}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('booking-detail').innerHTML = html;
}

// 确认取消预订
async function confirmCancel() {
    if (!currentBooking) return;
    
    const cancelReason = document.getElementById('cancel-reason').value;
    
    try {
        await bookingAPI.cancel(currentBooking.id);
        Toast.success('预订已取消');
        
        // 关闭模态框
        const modal = bootstrap.Modal.getInstance(document.getElementById('cancelModal'));
        if (modal) {
            modal.hide();
        }
        
        // 重新加载详情
        await loadBookingDetail(currentBooking.id);
    } catch (error) {
        Toast.error('取消失败: ' + error.message);
    }
}
