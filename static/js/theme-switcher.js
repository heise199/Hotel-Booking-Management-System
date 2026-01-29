/**
 * Ins 风格主题切换工具
 * 支持三种酒店定位主题：轻奢民宿、商务酒店、度假酒店
 */

// 主题配置
const themes = {
    boutique: {
        name: '轻奢民宿',
        description: '温暖治愈系'
    },
    business: {
        name: '商务酒店',
        description: '冷调高级感'
    },
    resort: {
        name: '度假酒店',
        description: '清新活力系'
    }
};

/**
 * 切换主题
 * @param {string} themeName - 主题名称: 'boutique' | 'business' | 'resort'
 */
function switchTheme(themeName) {
    if (!themes[themeName]) {
        console.warn(`主题 "${themeName}" 不存在，使用默认主题 "boutique"`);
        themeName = 'boutique';
    }
    
    // 设置 HTML 属性
    document.documentElement.setAttribute('data-hotel-theme', themeName);
    
    // 保存到 localStorage
    localStorage.setItem('hotel-theme', themeName);
    
    // 触发主题切换事件
    const event = new CustomEvent('themeChanged', {
        detail: { theme: themeName, themeInfo: themes[themeName] }
    });
    document.dispatchEvent(event);
    
    console.log(`主题已切换为: ${themes[themeName].name} (${themes[themeName].description})`);
}

/**
 * 获取当前主题
 * @returns {string} 当前主题名称
 */
function getCurrentTheme() {
    const savedTheme = localStorage.getItem('hotel-theme');
    const htmlTheme = document.documentElement.getAttribute('data-hotel-theme');
    
    // 优先使用 localStorage 中的主题
    if (savedTheme && themes[savedTheme]) {
        return savedTheme;
    }
    
    // 其次使用 HTML 属性中的主题
    if (htmlTheme && themes[htmlTheme]) {
        return htmlTheme;
    }
    
    // 默认返回轻奢民宿主题
    return 'boutique';
}

/**
 * 初始化主题（从 localStorage 恢复）
 */
function initTheme() {
    const savedTheme = getCurrentTheme();
    switchTheme(savedTheme);
}

/**
 * 创建主题切换器 UI
 * @param {string} position - 位置: 'fixed' | 'inline'
 * @param {object} options - 选项
 * @returns {HTMLElement} 主题切换器元素
 */
function createThemeSwitcher(position = 'fixed', options = {}) {
    const {
        top = '100px',
        right = '2rem',
        showDescription = true
    } = options;
    
    const switcher = document.createElement('div');
    switcher.className = 'theme-switcher';
    switcher.style.cssText = `
        position: ${position};
        ${position === 'fixed' ? `top: ${top}; right: ${right};` : ''}
        z-index: 1000;
        background: var(--neutral-white);
        border-radius: 20px;
        padding: 1rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border: 1px solid var(--neutral-gray);
        min-width: 160px;
    `;
    
    const title = document.createElement('small');
    title.className = 'd-block mb-2 fw-bold';
    title.textContent = '切换主题';
    title.style.cssText = 'color: var(--neutral-black); opacity: 0.8;';
    switcher.appendChild(title);
    
    Object.keys(themes).forEach(themeKey => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'theme-btn';
        button.textContent = themes[themeKey].name;
        button.style.cssText = `
            display: block;
            width: 100%;
            margin-bottom: 0.5rem;
            padding: 0.5rem 1rem;
            border-radius: 12px;
            border: 1px solid var(--neutral-gray);
            background: var(--neutral-white);
            color: var(--neutral-black);
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 0.875rem;
            font-weight: 500;
        `;
        
        if (showDescription) {
            const desc = document.createElement('div');
            desc.textContent = themes[themeKey].description;
            desc.style.cssText = 'font-size: 0.75rem; opacity: 0.6; margin-top: 0.25rem;';
            button.appendChild(desc);
        }
        
        button.addEventListener('click', () => {
            switchTheme(themeKey);
            updateThemeButtons(switcher);
        });
        
        button.addEventListener('mouseenter', () => {
            button.style.background = 'var(--primary-cream)';
        });
        
        button.addEventListener('mouseleave', () => {
            if (getCurrentTheme() !== themeKey) {
                button.style.background = 'var(--neutral-white)';
            }
        });
        
        switcher.appendChild(button);
    });
    
    // 初始化按钮状态
    updateThemeButtons(switcher);
    
    return switcher;
}

/**
 * 更新主题按钮状态
 * @param {HTMLElement} switcher - 主题切换器元素
 */
function updateThemeButtons(switcher) {
    const currentTheme = getCurrentTheme();
    const buttons = switcher.querySelectorAll('.theme-btn');
    
    buttons.forEach(button => {
        const themeKey = Object.keys(themes).find(key => 
            button.textContent.includes(themes[key].name)
        );
        
        if (themeKey === currentTheme) {
            button.style.background = 'var(--primary-warm)';
            button.style.color = 'var(--neutral-white)';
            button.style.borderColor = 'var(--primary-warm)';
        } else {
            button.style.background = 'var(--neutral-white)';
            button.style.color = 'var(--neutral-black)';
            button.style.borderColor = 'var(--neutral-gray)';
        }
    });
}

// 页面加载时自动初始化主题
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
} else {
    initTheme();
}

// 导出函数供全局使用
window.ThemeSwitcher = {
    switchTheme,
    getCurrentTheme,
    initTheme,
    createThemeSwitcher,
    themes
};
