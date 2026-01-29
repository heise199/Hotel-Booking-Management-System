/**
 * 通用工具函数库
 * 包含：Toast提示、日期选择器、图片轮播、表单验证等
 */

// ========== Toast提示系统 ==========
const Toast = {
    /**
     * 显示Toast提示
     * @param {string} message - 提示消息
     * @param {string} type - 类型：success, error, info, warning
     * @param {number} duration - 显示时长（毫秒），默认3000
     */
    show: function(message, type = 'info', duration = 3000) {
        // 创建Toast容器（如果不存在）
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        
        // 创建Toast元素
        const toast = document.createElement('div');
        toast.className = `toast toast-${type} fade-in`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        // 图标映射
        const icons = {
            success: '<i class="bi bi-check-circle-fill"></i>',
            error: '<i class="bi bi-x-circle-fill"></i>',
            info: '<i class="bi bi-info-circle-fill"></i>',
            warning: '<i class="bi bi-exclamation-triangle-fill"></i>'
        };
        
        // Toast内容
        toast.innerHTML = `
            <div class="toast-header">
                ${icons[type] || icons.info}
                <strong class="me-auto ms-2">${this.getTypeText(type)}</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;
        
        container.appendChild(toast);
        
        // 使用Bootstrap Toast（如果可用）
        if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
            const bsToast = new bootstrap.Toast(toast, {
                autohide: true,
                delay: duration
            });
            bsToast.show();
            
            // Toast隐藏后移除元素
            toast.addEventListener('hidden.bs.toast', () => {
                toast.remove();
            });
        } else {
            // 降级方案：使用setTimeout
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
    },
    
    /**
     * 获取类型文本
     */
    getTypeText: function(type) {
        const texts = {
            success: '成功',
            error: '错误',
            info: '提示',
            warning: '警告'
        };
        return texts[type] || '提示';
    },
    
    // 便捷方法
    success: function(message, duration) {
        this.show(message, 'success', duration);
    },
    
    error: function(message, duration) {
        this.show(message, 'error', duration);
    },
    
    info: function(message, duration) {
        this.show(message, 'info', duration);
    },
    
    warning: function(message, duration) {
        this.show(message, 'warning', duration);
    }
};

// ========== 日期选择器增强 ==========
const DatePicker = {
    /**
     * 初始化日期输入框
     * @param {string|HTMLElement} inputId - 输入框ID或元素
     * @param {object} options - 配置选项
     */
    init: function(inputId, options = {}) {
        const input = typeof inputId === 'string' 
            ? document.getElementById(inputId) 
            : inputId;
        
        if (!input) return;
        
        const defaults = {
            minDate: new Date(), // 默认最小日期为今天
            maxDate: null,
            disabledDates: [],
            onSelect: null
        };
        
        const config = { ...defaults, ...options };
        
        // 设置最小日期
        if (config.minDate) {
            const minDateStr = this.formatDate(config.minDate);
            input.setAttribute('min', minDateStr);
        }
        
        // 设置最大日期
        if (config.maxDate) {
            const maxDateStr = this.formatDate(config.maxDate);
            input.setAttribute('max', maxDateStr);
        }
        
        // 添加样式
        input.classList.add('date-picker-enhanced');
        
        // 监听日期变化
        input.addEventListener('change', function() {
            if (config.onSelect) {
                config.onSelect(this.value);
            }
        });
    },
    
    /**
     * 格式化日期为 YYYY-MM-DD
     */
    formatDate: function(date) {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    
    /**
     * 获取两个日期之间的天数
     */
    getDaysBetween: function(date1, date2) {
        const oneDay = 24 * 60 * 60 * 1000;
        const firstDate = new Date(date1);
        const secondDate = new Date(date2);
        return Math.ceil((secondDate - firstDate) / oneDay);
    },
    
    /**
     * 验证日期范围
     * @param {string} checkInDate - 入住日期
     * @param {string} checkOutDate - 离店日期
     * @returns {object} {valid: boolean, message: string}
     */
    validateDateRange: function(checkInDate, checkOutDate) {
        if (!checkInDate || !checkOutDate) {
            return { valid: false, message: '请选择入住和离店日期' };
        }
        
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // 检查入住日期不能早于今天
        if (checkIn < today) {
            return { valid: false, message: '入住日期不能早于今天' };
        }
        
        // 检查离店日期必须晚于入住日期
        if (checkOut <= checkIn) {
            return { valid: false, message: '离店日期必须晚于入住日期' };
        }
        
        return { valid: true, message: '' };
    }
};

// ========== 图片轮播组件 ==========
const ImageCarousel = {
    /**
     * 初始化图片轮播
     * @param {string} containerId - 容器ID
     * @param {Array} images - 图片URL数组
     * @param {object} options - 配置选项
     */
    init: function(containerId, images, options = {}) {
        const container = document.getElementById(containerId);
        if (!container || !images || images.length === 0) return;
        
        const defaults = {
            showThumbnails: true,
            autoPlay: false,
            interval: 3000,
            height: '500px'
        };
        
        const config = { ...defaults, ...options };
        
        let currentIndex = 0;
        
        // 创建轮播HTML
        const carouselHtml = `
            <div class="image-carousel">
                <div class="carousel-main-wrapper" style="position: relative;">
                    <img src="${images[0]}" class="carousel-main" alt="酒店图片" style="height: ${config.height};">
                    ${images.length > 1 ? `
                        <button class="carousel-btn carousel-btn-prev" onclick="ImageCarousel.prev('${containerId}')">
                            <i class="bi bi-chevron-left"></i>
                        </button>
                        <button class="carousel-btn carousel-btn-next" onclick="ImageCarousel.next('${containerId}')">
                            <i class="bi bi-chevron-right"></i>
                        </button>
                        <div class="carousel-indicators">
                            ${images.map((_, index) => `
                                <span class="carousel-indicator ${index === 0 ? 'active' : ''}" 
                                      onclick="ImageCarousel.goTo('${containerId}', ${index})"></span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                ${config.showThumbnails && images.length > 1 ? `
                    <div class="carousel-thumbnails mt-3">
                        ${images.map((img, index) => `
                            <img src="${img}" class="carousel-thumbnail ${index === 0 ? 'active' : ''}" 
                                 alt="缩略图 ${index + 1}" 
                                 onclick="ImageCarousel.goTo('${containerId}', ${index})">
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
        
        container.innerHTML = carouselHtml;
        
        // 保存状态
        container._carouselImages = images;
        container._carouselIndex = 0;
        container._carouselConfig = config;
        
        // 自动播放
        if (config.autoPlay && images.length > 1) {
            container._carouselInterval = setInterval(() => {
                this.next(containerId);
            }, config.interval);
        }
    },
    
    /**
     * 切换到下一张
     */
    next: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container || !container._carouselImages) return;
        
        const images = container._carouselImages;
        let index = container._carouselIndex;
        index = (index + 1) % images.length;
        this.goTo(containerId, index);
    },
    
    /**
     * 切换到上一张
     */
    prev: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container || !container._carouselImages) return;
        
        const images = container._carouselImages;
        let index = container._carouselIndex;
        index = (index - 1 + images.length) % images.length;
        this.goTo(containerId, index);
    },
    
    /**
     * 跳转到指定索引
     */
    goTo: function(containerId, index) {
        const container = document.getElementById(containerId);
        if (!container || !container._carouselImages) return;
        
        const images = container._carouselImages;
        if (index < 0 || index >= images.length) return;
        
        container._carouselIndex = index;
        
        // 更新主图
        const mainImg = container.querySelector('.carousel-main');
        if (mainImg) {
            mainImg.src = images[index];
            mainImg.classList.add('fade-in');
        }
        
        // 更新缩略图
        const thumbnails = container.querySelectorAll('.carousel-thumbnail');
        thumbnails.forEach((thumb, i) => {
            if (i === index) {
                thumb.classList.add('active');
            } else {
                thumb.classList.remove('active');
            }
        });
        
        // 更新指示器
        const indicators = container.querySelectorAll('.carousel-indicator');
        indicators.forEach((indicator, i) => {
            if (i === index) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    }
};

// ========== 表单验证增强 ==========
const FormValidator = {
    /**
     * 验证表单
     * @param {string|HTMLElement} formId - 表单ID或元素
     * @param {object} rules - 验证规则
     * @returns {object} {valid: boolean, errors: Array}
     */
    validate: function(formId, rules = {}) {
        const form = typeof formId === 'string' 
            ? document.getElementById(formId) 
            : formId;
        
        if (!form) return { valid: false, errors: ['表单不存在'] };
        
        const errors = [];
        
        // 遍历所有输入框
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.hasAttribute('required') && !input.value.trim()) {
                const label = form.querySelector(`label[for="${input.id}"]`);
                const fieldName = label ? label.textContent : input.name || input.id;
                errors.push(`${fieldName}不能为空`);
                input.classList.add('is-invalid');
            } else {
                input.classList.remove('is-invalid');
            }
            
            // 自定义规则验证
            if (rules[input.id] || rules[input.name]) {
                const rule = rules[input.id] || rules[input.name];
                const result = this.validateField(input, rule);
                if (!result.valid) {
                    errors.push(result.message);
                    input.classList.add('is-invalid');
                }
            }
        });
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    },
    
    /**
     * 验证单个字段
     */
    validateField: function(input, rule) {
        const value = input.value.trim();
        
        if (rule.required && !value) {
            return { valid: false, message: `${rule.label || input.name}不能为空` };
        }
        
        if (rule.minLength && value.length < rule.minLength) {
            return { valid: false, message: `${rule.label || input.name}至少需要${rule.minLength}个字符` };
        }
        
        if (rule.maxLength && value.length > rule.maxLength) {
            return { valid: false, message: `${rule.label || input.name}不能超过${rule.maxLength}个字符` };
        }
        
        if (rule.pattern && !rule.pattern.test(value)) {
            return { valid: false, message: rule.message || `${rule.label || input.name}格式不正确` };
        }
        
        if (rule.custom && typeof rule.custom === 'function') {
            const result = rule.custom(value);
            if (!result.valid) {
                return result;
            }
        }
        
        return { valid: true };
    }
};

// ========== 工具函数扩展 ==========
// 扩展utils对象（如果存在）
if (typeof utils !== 'undefined') {
    // 使用Toast替代原有的showMessage
    utils.showMessage = function(message, type = 'info') {
        Toast.show(message, type === 'error' ? 'error' : type);
    };
}

// 导出到全局（如果需要）
if (typeof window !== 'undefined') {
    window.Toast = Toast;
    window.DatePicker = DatePicker;
    window.ImageCarousel = ImageCarousel;
    window.FormValidator = FormValidator;
}
