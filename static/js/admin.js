// 管理后台逻辑
let trendChart = null;

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    // 设置默认日期范围（最近30天）
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    document.getElementById('stat-start-date').value = DatePicker.formatDate(startDate);
    document.getElementById('stat-end-date').value = DatePicker.formatDate(endDate);
    
    loadStatistics();
    loadPriceRules();
    initTrendChart();
    
    // 监听标签页切换
    const statisticsTab = document.getElementById('statistics-tab');
    const pricingTab = document.getElementById('pricing-tab');
    
    if (statisticsTab) {
        statisticsTab.addEventListener('shown.bs.tab', () => {
            loadStatistics();
            loadTrendChart();
        });
    }
    
    if (pricingTab) {
        pricingTab.addEventListener('shown.bs.tab', () => {
            loadPriceRules();
        });
    }
});

// 初始化趋势图
function initTrendChart() {
    const chartDom = document.getElementById('trend-chart');
    if (!chartDom) return;
    
    trendChart = echarts.init(chartDom);
    
    // 设置默认配置
    trendChart.setOption({
        title: {
            text: '',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross'
            }
        },
        legend: {
            data: ['预订量', '营收'],
            bottom: 10
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: []
        },
        yAxis: [
            {
                type: 'value',
                name: '预订量',
                position: 'left',
                axisLine: {
                    show: true,
                    lineStyle: {
                        color: '#165DFF'
                    }
                }
            },
            {
                type: 'value',
                name: '营收（元）',
                position: 'right',
                axisLine: {
                    show: true,
                    lineStyle: {
                        color: '#FF7D00'
                    }
                }
            }
        ],
        series: [
            {
                name: '预订量',
                type: 'bar',
                data: [],
                itemStyle: {
                    color: '#165DFF'
                }
            },
            {
                name: '营收',
                type: 'line',
                yAxisIndex: 1,
                data: [],
                itemStyle: {
                    color: '#FF7D00'
                },
                lineStyle: {
                    width: 3
                }
            }
        ]
    });
    
    // 响应式调整
    window.addEventListener('resize', () => {
        if (trendChart) {
            trendChart.resize();
        }
    });
}

// 加载统计数据
async function loadStatistics() {
    const startDate = document.getElementById('stat-start-date').value;
    const endDate = document.getElementById('stat-end-date').value;
    
    if (!startDate || !endDate) {
        Toast.warning('请选择日期范围');
        return;
    }
    
    try {
        const overview = await statisticsAPI.getOverview({
            start_date: startDate,
            end_date: endDate
        });
        
        document.getElementById('total-bookings').textContent = overview.total_bookings || 0;
        document.getElementById('total-revenue').textContent = utils.formatPrice(overview.total_revenue || 0);
        
        loadTrendChart();
        loadHotelRanking();
    } catch (error) {
        Toast.error('加载统计数据失败: ' + error.message);
    }
}

// 加载趋势图
async function loadTrendChart() {
    const startDate = document.getElementById('stat-start-date').value;
    const endDate = document.getElementById('stat-end-date').value;
    const groupBy = document.getElementById('trend-group-by').value;
    
    if (!startDate || !endDate) {
        return;
    }
    
    try {
        const data = await statisticsAPI.getByDate({
            start_date: startDate,
            end_date: endDate,
            group_by: groupBy
        });
        
        if (trendChart) {
            trendChart.setOption({
                xAxis: {
                    data: data.dates || []
                },
                series: [
                    {
                        data: data.counts || []
                    },
                    {
                        data: data.revenues || []
                    }
                ]
            });
        }
    } catch (error) {
        console.error('加载趋势图失败:', error);
        Toast.error('加载趋势图失败: ' + error.message);
    }
}

// 加载酒店排行
async function loadHotelRanking() {
    const startDate = document.getElementById('stat-start-date').value;
    const endDate = document.getElementById('stat-end-date').value;
    
    const rankingDiv = document.getElementById('hotel-ranking');
    rankingDiv.innerHTML = `
        <div class="text-center loading-spinner">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">加载中...</span>
            </div>
        </div>
    `;
    
    try {
        const rankings = await statisticsAPI.getByHotel({
            start_date: startDate,
            end_date: endDate,
            limit: 10
        });
        
        if (rankings.length === 0) {
            rankingDiv.innerHTML = '<div class="alert alert-info text-center">暂无数据</div>';
            return;
        }
        
        rankingDiv.innerHTML = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>排名</th>
                            <th>酒店名称</th>
                            <th>预订数</th>
                            <th>总营收</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rankings.map((hotel, index) => `
                            <tr>
                                <td>
                                    <span class="badge bg-${index < 3 ? 'warning' : 'secondary'}">
                                        ${index + 1}
                                    </span>
                                </td>
                                <td>${hotel.hotel_name}</td>
                                <td>${hotel.booking_count}</td>
                                <td class="text-success fw-bold">${utils.formatPrice(hotel.total_revenue)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        rankingDiv.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i> 加载失败: ${error.message}
            </div>
        `;
        Toast.error('加载酒店排行失败: ' + error.message);
    }
}

// 加载价格规则列表
async function loadPriceRules() {
    const rulesList = document.getElementById('price-rules-list');
    rulesList.innerHTML = `
        <div class="text-center loading-spinner">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">加载中...</span>
            </div>
        </div>
    `;
    
    try {
        const rules = await pricingAPI.getRules();
        displayPriceRules(rules);
    } catch (error) {
        rulesList.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i> 加载失败: ${error.message}
            </div>
        `;
        Toast.error('加载价格规则失败: ' + error.message);
    }
}

// 显示价格规则列表
function displayPriceRules(rules) {
    const rulesList = document.getElementById('price-rules-list');
    
    if (rules.length === 0) {
        rulesList.innerHTML = '<div class="alert alert-info text-center">暂无价格规则</div>';
        return;
    }
    
    rulesList.innerHTML = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>规则名称</th>
                        <th>规则类型</th>
                        <th>折扣率</th>
                        <th>状态</th>
                        <th>描述</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${rules.map(rule => `
                        <tr>
                            <td>${rule.rule_name}</td>
                            <td>${getRuleTypeText(rule.rule_type)}</td>
                            <td>
                                <span class="badge bg-${rule.discount_rate > 0 ? 'success' : 'danger'}">
                                    ${rule.discount_rate > 0 ? '+' : ''}${rule.discount_rate}%
                                </span>
                            </td>
                            <td>
                                <span class="badge bg-${rule.is_active ? 'success' : 'secondary'}">
                                    ${rule.is_active ? '启用' : '禁用'}
                                </span>
                            </td>
                            <td>${rule.description || '-'}</td>
                            <td>
                                <button class="btn btn-sm btn-primary me-2" onclick="editPriceRule(${rule.id})">
                                    <i class="bi bi-pencil"></i> 编辑
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="deletePriceRule(${rule.id})">
                                    <i class="bi bi-trash"></i> 删除
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// 获取规则类型文本
function getRuleTypeText(type) {
    const typeMap = {
        'season': '旺季',
        'weekend': '周末',
        'holiday': '节假日',
        'new_user': '新用户',
        'long_stay': '连住',
        'custom': '自定义'
    };
    return typeMap[type] || type;
}

// 打开价格规则模态框
function openPriceRuleModal(ruleId = null) {
    const modal = new bootstrap.Modal(document.getElementById('priceRuleModal'));
    const title = document.getElementById('priceRuleModalTitle');
    const form = document.getElementById('price-rule-form');
    
    if (ruleId) {
        title.innerHTML = '<i class="bi bi-pencil"></i> 编辑价格规则';
        loadPriceRule(ruleId);
    } else {
        title.innerHTML = '<i class="bi bi-plus-circle"></i> 添加价格规则';
        form.reset();
        document.getElementById('rule-id').value = '';
    }
    
    modal.show();
}

// 加载价格规则详情
async function loadPriceRule(ruleId) {
    try {
        const rules = await pricingAPI.getRules();
        const rule = rules.find(r => r.id === ruleId);
        
        if (rule) {
            document.getElementById('rule-id').value = rule.id;
            document.getElementById('rule-name').value = rule.rule_name;
            document.getElementById('rule-type').value = rule.rule_type;
            document.getElementById('rule-start-date').value = rule.start_date || '';
            document.getElementById('rule-end-date').value = rule.end_date || '';
            document.getElementById('rule-day-of-week').value = rule.day_of_week || '';
            document.getElementById('rule-min-nights').value = rule.min_nights || '';
            document.getElementById('rule-discount-rate').value = rule.discount_rate;
            document.getElementById('rule-is-active').value = rule.is_active ? 'true' : 'false';
            document.getElementById('rule-description').value = rule.description || '';
        }
    } catch (error) {
        Toast.error('加载规则失败: ' + error.message);
    }
}

// 保存价格规则
async function savePriceRule() {
    const ruleId = document.getElementById('rule-id').value;
    const ruleData = {
        rule_name: document.getElementById('rule-name').value,
        rule_type: document.getElementById('rule-type').value,
        start_date: document.getElementById('rule-start-date').value || null,
        end_date: document.getElementById('rule-end-date').value || null,
        day_of_week: document.getElementById('rule-day-of-week').value ? parseInt(document.getElementById('rule-day-of-week').value) : null,
        min_nights: document.getElementById('rule-min-nights').value ? parseInt(document.getElementById('rule-min-nights').value) : null,
        discount_rate: parseFloat(document.getElementById('rule-discount-rate').value),
        is_active: document.getElementById('rule-is-active').value === 'true',
        description: document.getElementById('rule-description').value
    };
    
    // 移除null值
    Object.keys(ruleData).forEach(key => {
        if (ruleData[key] === null || ruleData[key] === '') {
            delete ruleData[key];
        }
    });
    
    try {
        if (ruleId) {
            await pricingAPI.updateRule(ruleId, ruleData);
            Toast.success('规则更新成功');
        } else {
            await pricingAPI.createRule(ruleData);
            Toast.success('规则创建成功');
        }
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('priceRuleModal'));
        modal.hide();
        
        loadPriceRules();
    } catch (error) {
        Toast.error('保存失败: ' + error.message);
    }
}

// 编辑价格规则
function editPriceRule(ruleId) {
    openPriceRuleModal(ruleId);
}

// 删除价格规则
async function deletePriceRule(ruleId) {
    if (!confirm('确定要删除此价格规则吗？')) {
        return;
    }
    
    try {
        await pricingAPI.deleteRule(ruleId);
        Toast.success('规则删除成功');
        loadPriceRules();
    } catch (error) {
        Toast.error('删除失败: ' + error.message);
    }
}
