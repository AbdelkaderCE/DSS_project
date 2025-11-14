// API Configuration
const API_BASE_URL = 'http://127.0.0.1:5000';

// Game state
let gameState = null;
let budgetHistory = [];
let stockHistory = {};
let dayHistory = [];
let charts = {};

// Game over tracking
let consecutiveOutOfStockDays = 0;
let productsOutOfStock = new Set();
let gameOver = false;

// Chart colors for multiple products
const CHART_COLORS = [
    'rgba(59, 130, 246, 1)',   // Blue
    'rgba(16, 185, 129, 1)',   // Green
    'rgba(245, 158, 11, 1)',   // Orange
    'rgba(139, 92, 246, 1)',   // Purple
    'rgba(236, 72, 153, 1)',   // Pink
    'rgba(20, 184, 166, 1)'    // Teal
];

const CHART_BG_COLORS = [
    'rgba(59, 130, 246, 0.2)',
    'rgba(16, 185, 129, 0.2)',
    'rgba(245, 158, 11, 0.2)',
    'rgba(139, 92, 246, 0.2)',
    'rgba(236, 72, 153, 0.2)',
    'rgba(20, 184, 166, 0.2)'
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();
});

// ========== API CALLS ==========

async function startGame() {
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/start_game`, {
            method: 'GET'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            gameState = data.state;
            
            // Reset game over tracking
            consecutiveOutOfStockDays = 0;
            productsOutOfStock = new Set();
            gameOver = false;
            
            // Initialize history tracking
            budgetHistory = [gameState.budget];
            dayHistory = [gameState.day];
            initializeStockHistory();
            
            updateUI();
            document.getElementById('nextDayBtn').disabled = false;
            showToast(data.message, 'success');
        } else {
            throw new Error(data.error || 'Failed to start game');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

async function nextDay() {
    if (gameOver) {
        showToast('Game is over! Start a new game.', 'error');
        return;
    }
    
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/next_day`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            gameState = data.state;
            
            // Update history tracking
            budgetHistory.push(gameState.budget);
            dayHistory.push(gameState.day);
            updateStockHistory();
            
            // Check game over conditions
            checkGameOver();
            
            // Show day summary
            showDaySummary(data.day_summary);
            
            // Update UI
            updateUI();
            
            showToast(`Day ${data.day_summary.day} completed!`, 'success');
        } else {
            throw new Error(data.error || 'Failed to advance day');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

async function restock(productName, quantity) {
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/restock`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                product: productName,
                quantity: quantity
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            gameState = data.state;
            updateUI();
            
            const result = data.restock_result;
            let message = `✅ Restocked ${result.quantity} units of ${result.product}. Cost: $${result.cost}`;
            
            if (result.warning) {
                message += ` | ${result.warning}`;
                showToast(message, 'warning');
            } else {
                showToast(message, 'success');
            }
        } else {
            throw new Error(data.error || 'Failed to restock');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

async function getState() {
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/get_state`, {
            method: 'GET'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            gameState = data.state;
            updateUI();
            showToast('State refreshed!', 'info');
        } else {
            throw new Error(data.error || 'Failed to get state');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

// ========== UI UPDATES ==========

function updateUI() {
    if (!gameState) return;
    
    // Update header stats - using correct IDs from HTML
    const headerDay = document.getElementById('headerDay');
    if (headerDay) headerDay.textContent = gameState.day;
    
    const headerBudget = document.getElementById('headerBudget');
    if (headerBudget) {
        headerBudget.textContent = `$${gameState.budget.toFixed(2)}`;
        
        // Handle negative budget alert (flashing red)
        if (gameState.budget < 0) {
            headerBudget.className = 'stat-value negative flash';
        } else {
            headerBudget.className = 'stat-value positive';
        }
    }
    
    // Update event display
    updateEventDisplay();
    
    // Update notification count
    updateNotificationCount();
    
    // Update alerts
    updateAlerts();
    
    // Update products table
    updateProductsTable();
    
    // Update quick stats
    updateQuickStats();
    
    // Update store grid
    updateStoreGrid();
    
    // Update DSS panels
    updateDSSPanels();
    
    // Update charts
    updateBudgetChart();
    updateStockChart();
    updateChartStats();
    
    // Update daily report if on that tab
    const reportTab = document.getElementById('reportTab');
    if (reportTab && reportTab.classList.contains('active')) {
        displayCurrentStats();
    }
}

function updateProductsTable() {
    const tbody = document.getElementById('inventoryTableBody');
    
    if (!tbody) return;
    
    if (!gameState || !gameState.products) {
        tbody.innerHTML = '<tr><td colspan="11" class="empty-state">No products available</td></tr>';
        return;
    }
    
    // Create a map of product alerts for highlighting
    const productAlerts = {};
    if (gameState.alerts) {
        gameState.alerts.forEach(alert => {
            if (alert.product) {
                if (!productAlerts[alert.product]) {
                    productAlerts[alert.product] = [];
                }
                productAlerts[alert.product].push(alert.type);
            }
        });
    }
    
    tbody.innerHTML = gameState.products.map((product, index) => {
        const rec = gameState.recommendations[index];
        
        // Determine row class based on alerts
        let statusClass = rec.status;
        const alerts = productAlerts[product.name] || [];
        
        // Out of stock (stock = 0) - RED
        if (product.stock === 0 || alerts.includes('stockout')) {
            statusClass = 'out-of-stock';
        }
        // Low stock - YELLOW
        else if (alerts.includes('low_stock') || rec.status === 'critical') {
            statusClass = 'low-stock';
        }
        // Warning - Light yellow
        else if (rec.status === 'warning') {
            statusClass = 'warning';
        }
        // OK - Green tint
        else {
            statusClass = 'ok';
        }
        
        return `
            <tr class="${statusClass}">
                <td class="product-name">${product.name}</td>
                <td>${product.stock}</td>
                <td>${product.demand_rate}</td>
                <td>$${product.cost_storage.toFixed(2)}</td>
                <td>$${product.cost_restock.toFixed(2)}</td>
                <td>$${product.sale_price.toFixed(2)}</td>
                <td>${rec.reorder_point.toFixed(1)}</td>
                <td>${rec.eoq.toFixed(1)}</td>
                <td>${rec.days_of_stock === Infinity ? '∞' : rec.days_of_stock.toFixed(1)}</td>
                <td>
                    <input type="number" 
                           id="qty_${index}" 
                           class="qty-input" 
                           min="1" 
                           value="${Math.ceil(rec.eoq)}"
                           placeholder="Qty">
                </td>
                <td>
                    <button class="btn-buy" onclick="buyStock('${product.name}', ${index})">
                        Buy
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function updateAlerts() {
    const container = document.getElementById('alertsContainer');
    
    if (!gameState || !gameState.alerts || gameState.alerts.length === 0) {
        if (container) container.style.display = 'none';
        return;
    }
    
    if (container) {
        container.style.display = 'block';
        container.innerHTML = gameState.alerts.map(alert => {
            let icon = '⚠️';
            let alertClass = 'alert';
            
            if (alert.type === 'critical') {
                icon = '🔴';
                alertClass = 'alert alert-critical';
            } else if (alert.type === 'warning') {
                icon = '🟡';
                alertClass = 'alert alert-warning';
            } else if (alert.type === 'budget') {
                icon = '💰';
                alertClass = 'alert alert-budget';
            }
            
            return `<div class="${alertClass}">${icon} ${alert.message}</div>`;
        }).join('');
    }
}

function updateEventDisplay() {
    const eventDescription = document.getElementById('eventDescription');
    if (!eventDescription) return;
    
    if (gameState && gameState.current_event && gameState.current_event !== 'None') {
        // Display event name and description
        const eventText = gameState.current_event.name || gameState.current_event.description || 'Event active';
        eventDescription.textContent = eventText;
        eventDescription.parentElement.parentElement.style.display = 'flex';
    } else {
        eventDescription.textContent = 'No active event';
    }
}

function updateNotificationCount() {
    const notificationCount = document.getElementById('notificationCount');
    const notificationsList = document.getElementById('notificationsList');
    
    if (!gameState || !gameState.alerts) {
        if (notificationCount) notificationCount.textContent = '0';
        if (notificationsList) notificationsList.innerHTML = '<p class="no-notifications">No alerts</p>';
        return;
    }
    
    const count = gameState.alerts.length;
    if (notificationCount) notificationCount.textContent = count;
    
    if (notificationsList) {
        if (count === 0) {
            notificationsList.innerHTML = '<p class="no-notifications">No alerts</p>';
        } else {
            notificationsList.innerHTML = gameState.alerts.map(alert => {
                let icon = '⚠️';
                if (alert.type === 'critical') icon = '🔴';
                else if (alert.type === 'warning') icon = '🟡';
                else if (alert.type === 'budget') icon = '💰';
                
                return `<div class="notification-item ${alert.type}">${icon} ${alert.message}</div>`;
            }).join('');
        }
    }
}

function toggleNotifications() {
    const dropdown = document.getElementById('notificationsDropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
}

// ========== TAB SWITCHING ==========

function switchTab(tabName) {
    // Hide all tabs
    const allTabs = document.querySelectorAll('.tab-content');
    allTabs.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from all buttons
    const allButtons = document.querySelectorAll('.tab-btn');
    allButtons.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    const selectedTab = document.getElementById(`${tabName}Tab`);
    if (selectedTab) selectedTab.classList.add('active');
    
    // Activate corresponding button
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
        if (btn.textContent.toLowerCase().includes(tabName)) {
            btn.classList.add('active');
        }
    });
    
    // Refresh data for specific tabs
    if (tabName === 'charts') {
        updateBudgetChart();
        updateStockChart();
    }
}

function buyStock(productName, index) {
    const qtyInput = document.getElementById(`qty_${index}`);
    const quantity = parseInt(qtyInput.value);
    
    if (!quantity || quantity <= 0) {
        showToast('Please enter a valid quantity', 'error');
        return;
    }
    
    restock(productName, quantity);
}

function updateQuickStats() {
    if (!gameState || !gameState.products) return;
    
    // Total products
    const totalProducts = document.getElementById('totalProducts');
    if (totalProducts) totalProducts.textContent = gameState.products.length;
    
    // Total stock value (estimated)
    let totalValue = 0;
    let lowStockCount = 0;
    
    gameState.products.forEach((product, index) => {
        totalValue += product.stock * product.cost_restock;
        
        // Count low stock items (below reorder point)
        if (gameState.recommendations && gameState.recommendations[index]) {
            if (product.stock < gameState.recommendations[index].reorder_point) {
                lowStockCount++;
            }
        }
    });
    
    const totalStockValue = document.getElementById('totalStockValue');
    if (totalStockValue) totalStockValue.textContent = `$${totalValue.toFixed(2)}`;
    
    const lowStockCountEl = document.getElementById('lowStockCount');
    if (lowStockCountEl) lowStockCountEl.textContent = lowStockCount;
}

function filterStore() {
    // This will be implemented when we add store functionality
    const filter = document.getElementById('storeFilter');
    const filterValue = filter ? filter.value : 'all';
    
    // Update store grid based on filter
    updateStoreGrid(filterValue);
}

function updateStoreGrid(filter = 'all') {
    const storeGrid = document.getElementById('storeGrid');
    if (!storeGrid) return;
    
    if (!gameState || !gameState.store_items) {
        storeGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🏪</div>
                <p>Start a game to see available products</p>
            </div>
        `;
        return;
    }
    
    // Filter items
    let items = gameState.store_items;
    if (filter !== 'all') {
        items = items.filter(item => item.category === filter);
    }
    
    if (items.length === 0) {
        storeGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🏪</div>
                <p>No items in this category</p>
            </div>
        `;
        return;
    }
    
    storeGrid.innerHTML = items.map(item => `
        <div class="store-card ${item.unlocked ? 'unlocked' : 'locked'}">
            <div class="store-card-header">
                <h3>${item.name}</h3>
                <span class="category-badge">${item.category}</span>
            </div>
            <div class="store-card-body">
                <div class="store-stat">
                    <span class="store-label">Unlock Cost:</span>
                    <span class="store-value">$${item.unlock_price || 0}</span>
                </div>
                <div class="store-stat">
                    <span class="store-label">Sale Price:</span>
                    <span class="store-value">$${item.sale_price || 0}</span>
                </div>
                <div class="store-stat">
                    <span class="store-label">Storage Cost:</span>
                    <span class="store-value">$${item.cost_storage || 0}/unit</span>
                </div>
                <div class="store-stat">
                    <span class="store-label">Daily Demand:</span>
                    <span class="store-value">${item.daily_demand || 0} units</span>
                </div>
            </div>
            <div class="store-card-footer">
                ${!item.unlocked ? 
                    `<button class="btn-unlock" onclick="unlockItem('${item.name}')">🔓 Unlock ($${item.unlock_price})</button>` :
                    `<span class="unlocked-badge">✅ Unlocked</span>`
                }
            </div>
        </div>
    `).join('');
}

async function unlockItem(itemName) {
    if (!gameState) return;
    
    // Find the item
    const item = gameState.store_items.find(i => i.name === itemName);
    if (!item) {
        showToast('Item not found', 'error');
        return;
    }
    
    // Check if already unlocked
    if (item.unlocked) {
        showToast('Item already unlocked', 'warning');
        return;
    }
    
    // Check budget
    const unlockCost = item.unlock_price || 0;
    if (gameState.budget < unlockCost) {
        showToast(`Not enough budget! Need $${unlockCost}, have $${gameState.budget.toFixed(2)}`, 'error');
        return;
    }
    
    // Confirm unlock
    if (!confirm(`Unlock ${itemName} for $${unlockCost}?`)) {
        return;
    }
    
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/unlock_item`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                item_name: itemName
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            gameState = data.state;
            updateUI();
            showToast(`✅ ${itemName} unlocked successfully!`, 'success');
        } else {
            throw new Error(data.error || 'Failed to unlock item');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

function refreshDSS() {
    if (!gameState) {
        showToast('Start a game first', 'warning');
        return;
    }
    
    updateDSSPanels();
    showToast('DSS Analysis refreshed', 'info');
}

function updateDSSPanels() {
    if (!gameState || !gameState.products) return;
    
    // Best to Restock
    const bestRestockPanel = document.getElementById('bestRestockPanel');
    if (bestRestockPanel) {
        const criticalItems = gameState.products
            .map((p, i) => ({product: p, rec: gameState.recommendations[i], index: i}))
            .filter(item => item.product.stock < item.rec.reorder_point)
            .sort((a, b) => (a.product.stock / a.rec.reorder_point) - (b.product.stock / b.rec.reorder_point));
        
        if (criticalItems.length > 0) {
            bestRestockPanel.innerHTML = criticalItems.slice(0, 3).map(item => `
                <div class="dss-item">
                    <strong>${item.product.name}</strong>
                    <div class="dss-detail">Stock: ${item.product.stock} | ROP: ${item.rec.reorder_point.toFixed(1)}</div>
                    <div class="dss-detail">Recommended: ${Math.ceil(item.rec.eoq)} units</div>
                </div>
            `).join('');
        } else {
            bestRestockPanel.innerHTML = '<p class="no-data">All items well stocked!</p>';
        }
    }
    
    // Highest Profit
    const highProfitPanel = document.getElementById('highProfitPanel');
    if (highProfitPanel && gameState.statistics) {
        const profitMargins = gameState.products.map(p => ({
            name: p.name,
            margin: p.sale_price - p.cost_restock,
            marginPercent: ((p.sale_price - p.cost_restock) / p.cost_restock * 100)
        })).sort((a, b) => b.margin - a.margin);
        
        highProfitPanel.innerHTML = profitMargins.slice(0, 3).map(item => `
            <div class="dss-item">
                <strong>${item.name}</strong>
                <div class="dss-detail">Margin: $${item.margin.toFixed(2)} (${item.marginPercent.toFixed(1)}%)</div>
            </div>
        `).join('');
    }
    
    // Cost Breakdown
    if (gameState.statistics) {
        const dssStorageCost = document.getElementById('dssStorageCost');
        if (dssStorageCost) dssStorageCost.textContent = `$${gameState.statistics.total_storage_costs.toFixed(2)}`;
        
        const dssRestockCost = document.getElementById('dssRestockCost');
        if (dssRestockCost) dssRestockCost.textContent = `$${gameState.statistics.total_restock_costs.toFixed(2)}`;
        
        const dssUnlockCost = document.getElementById('dssUnlockCost');
        if (dssUnlockCost) dssUnlockCost.textContent = `$${gameState.statistics.unlock_costs || 0}`;
        
        const dssTotalCost = document.getElementById('dssTotalCost');
        if (dssTotalCost) {
            const total = gameState.statistics.total_storage_costs + 
                         gameState.statistics.total_restock_costs + 
                         (gameState.statistics.unlock_costs || 0);
            dssTotalCost.textContent = `$${total.toFixed(2)}`;
        }
        
        // Performance Metrics
        const dssROI = document.getElementById('dssROI');
        if (dssROI) dssROI.textContent = `${gameState.statistics.roi.toFixed(1)}%`;
        
        const dssProfitMargin = document.getElementById('dssProfitMargin');
        if (dssProfitMargin) {
            const margin = gameState.statistics.total_revenue > 0 
                ? (gameState.statistics.profit / gameState.statistics.total_revenue * 100) 
                : 0;
            dssProfitMargin.textContent = `${margin.toFixed(1)}%`;
        }
        
        const dssRevenue = document.getElementById('dssRevenue');
        if (dssRevenue) dssRevenue.textContent = `$${gameState.statistics.total_revenue.toFixed(2)}`;
        
        const dssProfit = document.getElementById('dssProfit');
        if (dssProfit) {
            dssProfit.textContent = `$${gameState.statistics.profit.toFixed(2)}`;
            dssProfit.className = gameState.statistics.profit >= 0 ? 'metric-value positive' : 'metric-value negative';
        }
    }
    
    // High Risk Items
    const highRiskPanel = document.getElementById('highRiskPanel');
    if (highRiskPanel) {
        const lowStockItems = gameState.products
            .map((p, i) => ({product: p, rec: gameState.recommendations[i]}))
            .filter(item => item.product.stock < item.rec.reorder_point);
        
        if (lowStockItems.length > 0) {
            highRiskPanel.innerHTML = lowStockItems.map(item => `
                <div class="dss-item danger">
                    <strong>${item.product.name}</strong>
                    <div class="dss-detail">Stock: ${item.product.stock} | Days left: ${item.rec.days_of_stock === Infinity ? '∞' : item.rec.days_of_stock.toFixed(1)}</div>
                </div>
            `).join('');
        } else {
            highRiskPanel.innerHTML = '<p class="no-data">All items stocked well</p>';
        }
    }
    
    // High Storage Cost
    const highStoragePanel = document.getElementById('highStoragePanel');
    if (highStoragePanel) {
        const highStorage = gameState.products
            .map(p => ({
                name: p.name,
                totalCost: p.stock * p.cost_storage
            }))
            .filter(item => item.totalCost > 0)
            .sort((a, b) => b.totalCost - a.totalCost);
        
        if (highStorage.length > 0) {
            highStoragePanel.innerHTML = highStorage.slice(0, 3).map(item => `
                <div class="dss-item">
                    <strong>${item.name}</strong>
                    <div class="dss-detail">Storage: $${item.totalCost.toFixed(2)}/day</div>
                </div>
            `).join('');
        } else {
            highStoragePanel.innerHTML = '<p class="no-data">No storage costs yet</p>';
        }
    }
}

// ========== CHARTS ==========

function initializeCharts() {
    // Budget Evolution Chart
    charts.budget = new Chart(document.getElementById('budgetChart'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Budget ($)',
                data: [],
                borderColor: 'rgba(59, 130, 246, 1)',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#f1f5f9',
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(30, 41, 59, 0.9)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#f1f5f9',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return 'Budget: $' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Budget ($)',
                        color: '#94a3b8',
                        font: {
                            size: 14
                        }
                    },
                    ticks: {
                        color: '#94a3b8',
                        callback: function(value) {
                            return '$' + value.toFixed(0);
                        }
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Day',
                        color: '#94a3b8',
                        font: {
                            size: 14
                        }
                    },
                    ticks: {
                        color: '#94a3b8'
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    }
                }
            }
        }
    });
    
    // Stock Levels Chart - Multi-line chart
    charts.stock = new Chart(document.getElementById('stockChart'), {
        type: 'line',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#f1f5f9',
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(30, 41, 59, 0.9)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#f1f5f9',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Stock Units',
                        color: '#94a3b8',
                        font: {
                            size: 14
                        }
                    },
                    ticks: {
                        color: '#94a3b8',
                        stepSize: 10
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Day',
                        color: '#94a3b8',
                        font: {
                            size: 14
                        }
                    },
                    ticks: {
                        color: '#94a3b8'
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

function initializeStockHistory() {
    if (!gameState) return;
    
    stockHistory = {};
    gameState.products.forEach(product => {
        stockHistory[product.name] = [product.stock];
    });
}

function updateStockHistory() {
    if (!gameState) return;
    
    gameState.products.forEach(product => {
        if (!stockHistory[product.name]) {
            stockHistory[product.name] = [product.stock];
        } else {
            stockHistory[product.name].push(product.stock);
        }
    });
}

/**
 * Update Budget Evolution Chart
 * Shows budget changes over time (day by day)
 */
function updateBudgetChart() {
    if (!gameState || !charts.budget) return;
    
    // Create labels for each day
    const labels = dayHistory.map(day => `Day ${day}`);
    
    // Update chart data
    charts.budget.data.labels = labels;
    charts.budget.data.datasets[0].data = budgetHistory;
    
    // Update the chart
    charts.budget.update('none'); // 'none' disables animation for better performance
}

/**
 * Update Stock Level Chart
 * Shows stock levels for all products over time (multiple lines)
 */
function updateStockChart() {
    if (!gameState || !charts.stock) return;
    
    // Create labels for each day
    const labels = dayHistory.map(day => `Day ${day}`);
    
    // Create datasets - one line per product
    const datasets = gameState.products.map((product, index) => {
        const colorIndex = index % CHART_COLORS.length;
        
        return {
            label: product.name,
            data: stockHistory[product.name] || [],
            borderColor: CHART_COLORS[colorIndex],
            backgroundColor: CHART_BG_COLORS[colorIndex],
            borderWidth: 3,
            tension: 0.4,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: CHART_COLORS[colorIndex],
            pointBorderColor: '#fff',
            pointBorderWidth: 2
        };
    });
    
    // Update chart data
    charts.stock.data.labels = labels;
    charts.stock.data.datasets = datasets;
    
    // Update the chart
    charts.stock.update('none'); // 'none' disables animation for better performance
}

// ========== GAME OVER LOGIC ==========

function checkGameOver() {
    if (!gameState) return;
    
    let gameOverReason = null;
    let gameOverType = '';
    
    // Condition 1: Budget <= -100
    if (gameState.budget <= -100) {
        gameOverReason = `💸 <strong>BANKRUPTCY!</strong><br><br>Your budget has fallen to <span class="negative">$${gameState.budget.toFixed(2)}</span>.<br>You are out of business!`;
        gameOverType = 'bankruptcy';
    }
    
    // Condition 2: Track out of stock products
    const currentOutOfStock = new Set();
    gameState.products.forEach(product => {
        if (product.stock === 0) {
            currentOutOfStock.add(product.name);
        }
    });
    
    // Check if 3 or more products are out of stock
    if (currentOutOfStock.size >= 3) {
        // Check if these are the same products as previous day
        const sameProducts = Array.from(currentOutOfStock).every(p => productsOutOfStock.has(p));
        
        if (sameProducts && currentOutOfStock.size >= 3) {
            consecutiveOutOfStockDays++;
        } else {
            consecutiveOutOfStockDays = 1;
        }
        
        productsOutOfStock = currentOutOfStock;
        
        // Game over if 3 products out of stock for 3 consecutive days
        if (consecutiveOutOfStockDays >= 3) {
            const outOfStockList = Array.from(currentOutOfStock).join(', ');
            gameOverReason = `📦 <strong>SUPPLY FAILURE!</strong><br><br>${currentOutOfStock.size} products (${outOfStockList}) have been out of stock for ${consecutiveOutOfStockDays} consecutive days.<br>Customers have abandoned your store!`;
            gameOverType = 'stockout';
        } else {
            // Warning notification but not game over yet
            if (currentOutOfStock.size >= 3 && consecutiveOutOfStockDays >= 2) {
                showToast(`⚠️ WARNING: ${currentOutOfStock.size} products out of stock for ${consecutiveOutOfStockDays} days! One more day and you'll lose customers!`, 'warning');
            } else if (currentOutOfStock.size >= 3) {
                showToast(`⚠️ ALERT: ${currentOutOfStock.size} products are out of stock! Restock immediately!`, 'warning');
            }
        }
    } else {
        consecutiveOutOfStockDays = 0;
        productsOutOfStock = currentOutOfStock;
    }
    
    // Low budget warning (not game over yet)
    if (!gameOverReason && gameState.budget < -50 && gameState.budget > -100) {
        const budgetRemaining = 100 + gameState.budget;
        showToast(`⚠️ BUDGET CRITICAL: Only $${budgetRemaining.toFixed(2)} until bankruptcy!`, 'error');
    }
    
    // Trigger game over if condition met
    if (gameOverReason) {
        gameOver = true;
        const nextDayBtn = document.getElementById('nextDayBtn');
        if (nextDayBtn) nextDayBtn.disabled = true;
        showGameOverModal(gameOverReason, gameOverType);
    }
}

function showGameOverModal(reason, type) {
    // Use the dedicated game over modal
    const modal = document.getElementById('gameOverModal');
    const content = document.getElementById('gameOverContent');
    
    if (!modal || !content || !gameState) return;
    
    const finalStats = gameState.statistics;
    
    content.innerHTML = `
        <div class="game-over-icon">${type === 'bankruptcy' ? '💸' : '📦'}</div>
        <h3 id="gameOverReason">${reason}</h3>
        
        <div class="game-over-stats">
            <h4>Final Statistics</h4>
            <div class="summary-stats">
                <div class="summary-item">
                    <span class="summary-label">Days Survived:</span>
                    <span class="summary-value">${gameState.day}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Final Budget:</span>
                    <span class="summary-value ${gameState.budget < 0 ? 'negative' : 'positive'}">$${gameState.budget.toFixed(2)}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Total Revenue:</span>
                    <span class="summary-value positive">$${finalStats.total_revenue.toFixed(2)}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Total Profit:</span>
                    <span class="summary-value ${finalStats.profit < 0 ? 'negative' : 'positive'}">$${finalStats.profit.toFixed(2)}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Total Sales:</span>
                    <span class="summary-value">${finalStats.total_sales} units</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Stockouts:</span>
                    <span class="summary-value ${finalStats.total_stockouts > 0 ? 'negative' : 'positive'}">${finalStats.total_stockouts}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">ROI:</span>
                    <span class="summary-value ${finalStats.roi < 0 ? 'negative' : 'positive'}">${finalStats.roi.toFixed(1)}%</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Total Costs:</span>
                    <span class="summary-value negative">$${(finalStats.total_storage_costs + finalStats.total_restock_costs).toFixed(2)}</span>
                </div>
            </div>
        </div>
        
        <div class="game-over-tips">
            <h4>💡 Tips for Next Game:</h4>
            <ul>
                ${type === 'bankruptcy' ? '<li>💰 Watch your budget! Avoid overstocking and balance restock costs.</li>' : ''}
                ${type === 'stockout' ? '<li>📦 Keep products in stock! Use EOQ recommendations to maintain inventory.</li>' : ''}
                <li>📊 Monitor the reorder points - restock before products run out.</li>
                <li>⚖️ Balance storage costs vs. stockout risks.</li>
                <li>📈 Use the charts to track trends and plan ahead.</li>
                <li>🏪 Unlock high-profit items early to boost revenue.</li>
            </ul>
        </div>
    `;
    
    modal.style.display = 'flex';
}

// ========== DAY SUMMARY ==========

function showDaySummary(summary) {
    const modal = document.getElementById('daySummaryModal');
    const content = document.getElementById('daySummaryContent');
    
    let html = '';
    
    // Show event if present
    if (summary.event && summary.event.name) {
        html += `
            <div class="event-banner">
                <h3>${summary.event.name}</h3>
                <p>${summary.event.description}</p>
            </div>
        `;
    }
    
    html += `
        <div class="summary-stats">
            <div class="summary-item">
                <span class="summary-label">Revenue:</span>
                <span class="summary-value positive">+$${summary.revenue.toFixed(2)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Storage Cost:</span>
                <span class="summary-value negative">-$${summary.storage_cost.toFixed(2)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Net Change:</span>
                <span class="summary-value ${summary.net_change >= 0 ? 'positive' : 'negative'}">
                    ${summary.net_change >= 0 ? '+' : ''}$${summary.net_change.toFixed(2)}
                </span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Budget:</span>
                <span class="summary-value">${summary.budget_after.toFixed(2)}</span>
            </div>
        </div>
        
        <h3>Sales</h3>
        <table class="summary-table">
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Sold</th>
                    <th>Revenue</th>
                    <th>Remaining</th>
                </tr>
            </thead>
            <tbody>
                ${summary.sales.map(sale => `
                    <tr>
                        <td>${sale.product}</td>
                        <td>${sale.sold}</td>
                        <td>$${sale.revenue.toFixed(2)}</td>
                        <td>${sale.remaining_stock}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    if (summary.alerts && summary.alerts.length > 0) {
        html += '<h3>Alerts</h3><div class="summary-alerts">';
        summary.alerts.forEach(alert => {
            html += `<div class="alert alert-${alert.severity}">${alert.message}</div>`;
        });
        html += '</div>';
    }
    
    content.innerHTML = html;
    modal.style.display = 'flex';
}

function closeDaySummary() {
    document.getElementById('daySummaryModal').style.display = 'none';
}

function closeGameOver() {
    const modal = document.getElementById('gameOverModal');
    if (modal) modal.style.display = 'none';
}

function restartGame() {
    closeGameOver();
    startGame();
}

function closeUnlockModal() {
    const modal = document.getElementById('unlockModal');
    if (modal) modal.style.display = 'none';
}

// ========== UTILITIES ==========

function showLoading(show) {
    document.getElementById('loadingSpinner').style.display = show ? 'flex' : 'none';
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// ========== CHART UTILITIES ==========

function refreshCharts() {
    if (!gameState) {
        showToast('Start a game first', 'warning');
        return;
    }
    
    updateBudgetChart();
    updateStockChart();
    updateChartStats();
    showToast('Charts refreshed', 'info');
}

function updateChartStats() {
    if (!gameState || budgetHistory.length < 2) return;
    
    // Budget Trend
    const budgetTrend = document.getElementById('budgetTrend');
    if (budgetTrend) {
        const firstBudget = budgetHistory[0];
        const lastBudget = budgetHistory[budgetHistory.length - 1];
        const change = lastBudget - firstBudget;
        const percentChange = (change / firstBudget * 100).toFixed(1);
        
        let icon = '📈';
        let trendClass = 'positive';
        let trendText = `+${percentChange}%`;
        
        if (change < 0) {
            icon = '📉';
            trendClass = 'negative';
            trendText = `${percentChange}%`;
        } else if (change === 0) {
            icon = '➡️';
            trendClass = '';
            trendText = 'Stable';
        }
        
        budgetTrend.innerHTML = `
            <span class="trend-icon">${icon}</span>
            <span class="trend-text ${trendClass}">${trendText}</span>
        `;
    }
    
    // Stock Health
    const stockHealth = document.getElementById('stockHealth');
    if (stockHealth && gameState.products) {
        const totalProducts = gameState.products.length;
        const lowStockCount = gameState.products.filter((p, i) => 
            p.stock < gameState.recommendations[i].reorder_point
        ).length;
        const outOfStockCount = gameState.products.filter(p => p.stock === 0).length;
        
        let icon = '✅';
        let healthText = 'Healthy';
        let healthClass = 'positive';
        
        if (outOfStockCount > 0) {
            icon = '🔴';
            healthText = `${outOfStockCount} Out of Stock`;
            healthClass = 'negative';
        } else if (lowStockCount > 0) {
            icon = '🟡';
            healthText = `${lowStockCount} Low Stock`;
            healthClass = 'warning';
        }
        
        stockHealth.innerHTML = `
            <span class="trend-icon">${icon}</span>
            <span class="trend-text ${healthClass}">${healthText}</span>
        `;
    }
    
    // Peak Budget Day
    const peakDay = document.getElementById('peakDay');
    if (peakDay && budgetHistory.length > 0) {
        const maxBudget = Math.max(...budgetHistory);
        const maxIndex = budgetHistory.indexOf(maxBudget);
        const peakDayNum = dayHistory[maxIndex];
        
        peakDay.innerHTML = `
            <span class="trend-icon">🏆</span>
            <span class="trend-text">Day ${peakDayNum} ($${maxBudget.toFixed(2)})</span>
        `;
    }
}

// ========== DAILY REPORT ==========

function refreshDailyReport() {
    if (!gameState) {
        showToast('Start a game first', 'warning');
        return;
    }
    
    getDailyReport();
}

async function getDailyReport() {
    if (!gameState || gameState.day === 0) {
        const reportContainer = document.getElementById('reportContainer');
        if (reportContainer) {
            reportContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <p>No daily report available yet. Advance to the next day to generate a report.</p>
                </div>
            `;
        }
        return;
    }
    
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/get_daily_report`, {
            method: 'GET'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.report) {
            displayDailyReport(data.report);
        } else {
            // Show current statistics if no report available
            displayCurrentStats();
        }
    } catch (error) {
        console.error('Error:', error);
        displayCurrentStats();
    } finally {
        showLoading(false);
    }
}

function displayDailyReport(report) {
    const reportContainer = document.getElementById('reportContainer');
    if (!reportContainer) return;
    
    reportContainer.innerHTML = `
        <div class="report-section">
            <h3>📅 Day ${report.day} Summary</h3>
            <div class="report-stats-grid">
                <div class="report-stat">
                    <span class="report-label">Revenue:</span>
                    <span class="report-value positive">+$${report.revenue.toFixed(2)}</span>
                </div>
                <div class="report-stat">
                    <span class="report-label">Storage Cost:</span>
                    <span class="report-value negative">-$${report.storage_cost.toFixed(2)}</span>
                </div>
                <div class="report-stat">
                    <span class="report-label">Net Change:</span>
                    <span class="report-value ${report.net_change >= 0 ? 'positive' : 'negative'}">
                        ${report.net_change >= 0 ? '+' : ''}$${report.net_change.toFixed(2)}
                    </span>
                </div>
                <div class="report-stat">
                    <span class="report-label">Budget After:</span>
                    <span class="report-value">$${report.budget_after.toFixed(2)}</span>
                </div>
            </div>
        </div>
        
        <div class="report-section">
            <h3>📊 Sales Details</h3>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Units Sold</th>
                        <th>Revenue</th>
                        <th>Remaining Stock</th>
                    </tr>
                </thead>
                <tbody>
                    ${report.sales.map(sale => `
                        <tr>
                            <td>${sale.product}</td>
                            <td>${sale.sold}</td>
                            <td class="positive">$${sale.revenue.toFixed(2)}</td>
                            <td>${sale.remaining_stock}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        ${report.alerts && report.alerts.length > 0 ? `
            <div class="report-section">
                <h3>⚠️ Alerts</h3>
                <div class="report-alerts">
                    ${report.alerts.map(alert => `
                        <div class="alert alert-${alert.severity || 'warning'}">
                            ${alert.message}
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;
}

function displayCurrentStats() {
    const reportContainer = document.getElementById('reportContainer');
    if (!reportContainer || !gameState) return;
    
    reportContainer.innerHTML = `
        <div class="report-section">
            <h3>📊 Current Statistics - Day ${gameState.day}</h3>
            <div class="report-stats-grid">
                <div class="report-stat">
                    <span class="report-label">Current Budget:</span>
                    <span class="report-value ${gameState.budget >= 0 ? 'positive' : 'negative'}">
                        $${gameState.budget.toFixed(2)}
                    </span>
                </div>
                <div class="report-stat">
                    <span class="report-label">Total Revenue:</span>
                    <span class="report-value positive">$${gameState.statistics.total_revenue.toFixed(2)}</span>
                </div>
                <div class="report-stat">
                    <span class="report-label">Total Profit:</span>
                    <span class="report-value ${gameState.statistics.profit >= 0 ? 'positive' : 'negative'}">
                        ${gameState.statistics.profit >= 0 ? '+' : ''}$${gameState.statistics.profit.toFixed(2)}
                    </span>
                </div>
                <div class="report-stat">
                    <span class="report-label">ROI:</span>
                    <span class="report-value ${gameState.statistics.roi >= 0 ? 'positive' : 'negative'}">
                        ${gameState.statistics.roi.toFixed(1)}%
                    </span>
                </div>
            </div>
        </div>
        
        <div class="report-section">
            <h3>💰 Cost Analysis</h3>
            <div class="report-stats-grid">
                <div class="report-stat">
                    <span class="report-label">Total Storage Costs:</span>
                    <span class="report-value negative">$${gameState.statistics.total_storage_costs.toFixed(2)}</span>
                </div>
                <div class="report-stat">
                    <span class="report-label">Total Restock Costs:</span>
                    <span class="report-value negative">$${gameState.statistics.total_restock_costs.toFixed(2)}</span>
                </div>
                <div class="report-stat">
                    <span class="report-label">Total Sales:</span>
                    <span class="report-value">${gameState.statistics.total_sales} units</span>
                </div>
                <div class="report-stat">
                    <span class="report-label">Total Stockouts:</span>
                    <span class="report-value ${gameState.statistics.total_stockouts > 0 ? 'negative' : 'positive'}">
                        ${gameState.statistics.total_stockouts}
                    </span>
                </div>
            </div>
        </div>
        
        <div class="report-section">
            <h3>📦 Current Inventory</h3>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Current Stock</th>
                        <th>Demand Rate</th>
                        <th>Days Left</th>
                    </tr>
                </thead>
                <tbody>
                    ${gameState.products.map((product, index) => {
                        const rec = gameState.recommendations[index];
                        return `
                            <tr>
                                <td>${product.name}</td>
                                <td>${product.stock}</td>
                                <td>${product.demand_rate}</td>
                                <td>${rec.days_of_stock === Infinity ? '∞' : rec.days_of_stock.toFixed(1)}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function exportReport() {
    if (!gameState) {
        showToast('No data to export', 'warning');
        return;
    }
    
    // Create CSV content
    let csvContent = "Stock Management Game Report\n\n";
    csvContent += `Day,${gameState.day}\n`;
    csvContent += `Budget,$${gameState.budget.toFixed(2)}\n`;
    csvContent += `Total Revenue,$${gameState.statistics.total_revenue.toFixed(2)}\n`;
    csvContent += `Total Profit,$${gameState.statistics.profit.toFixed(2)}\n`;
    csvContent += `ROI,${gameState.statistics.roi.toFixed(1)}%\n\n`;
    
    csvContent += "Product,Stock,Demand,Sale Price,Storage Cost,Restock Cost\n";
    gameState.products.forEach(product => {
        csvContent += `${product.name},${product.stock},${product.demand_rate},$${product.sale_price},$${product.cost_storage},$${product.cost_restock}\n`;
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-game-report-day${gameState.day}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showToast('Report exported successfully', 'success');
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('daySummaryModal');
    if (event.target === modal) {
        closeDaySummary();
    }
}
