// API Configuration
const API_BASE_URL = 'http://127.0.0.1:5000';

// Store products
let products = [];
let charts = {};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('productForm').addEventListener('submit', handleFormSubmit);
    loadSampleData(); // Optional: Load sample data for testing
});

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();
    
    const product = {
        name: document.getElementById('productName').value,
        stock: parseFloat(document.getElementById('stock').value),
        demand: parseFloat(document.getElementById('demand').value),
        cost_storage: parseFloat(document.getElementById('costStorage').value),
        cost_restock: parseFloat(document.getElementById('costRestock').value)
    };
    
    products.push(product);
    updateProductsList();
    clearForm();
    showToast('Product added successfully!', 'success');
}

// Clear form
function clearForm() {
    document.getElementById('productForm').reset();
    document.getElementById('productName').focus();
}

// Update products list display
function updateProductsList() {
    const productsList = document.getElementById('productsList');
    const actionsBar = document.getElementById('actionsBar');
    
    if (products.length === 0) {
        productsList.innerHTML = '<p class="empty-state">No products added yet. Add products using the form above.</p>';
        actionsBar.style.display = 'none';
        return;
    }
    
    actionsBar.style.display = 'flex';
    
    productsList.innerHTML = products.map((product, index) => `
        <div class="product-card">
            <div class="product-header">
                <h3>${product.name}</h3>
                <button class="btn-remove" onclick="removeProduct(${index})">×</button>
            </div>
            <div class="product-details">
                <div class="detail-item">
                    <span class="label">Stock:</span>
                    <span class="value">${product.stock}</span>
                </div>
                <div class="detail-item">
                    <span class="label">Annual Demand:</span>
                    <span class="value">${product.demand}</span>
                </div>
                <div class="detail-item">
                    <span class="label">Storage Cost:</span>
                    <span class="value">$${product.cost_storage}/unit/year</span>
                </div>
                <div class="detail-item">
                    <span class="label">Restock Cost:</span>
                    <span class="value">$${product.cost_restock}/order</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Remove product
function removeProduct(index) {
    products.splice(index, 1);
    updateProductsList();
    showToast('Product removed', 'info');
}

// Clear all products
function clearAllProducts() {
    if (confirm('Are you sure you want to remove all products?')) {
        products = [];
        updateProductsList();
        document.getElementById('resultsSection').style.display = 'none';
        document.getElementById('chartsSection').style.display = 'none';
        document.getElementById('simulationSection').style.display = 'none';
        showToast('All products cleared', 'info');
    }
}

// Get recommendations from API
async function getRecommendations() {
    if (products.length === 0) {
        showToast('Please add at least one product', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/recommend`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ products })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            displayRecommendations(data.recommendations);
            createCharts(data.recommendations);
            showToast('Recommendations generated successfully!', 'success');
        } else {
            throw new Error(data.error || 'Failed to get recommendations');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

// Display recommendations
function displayRecommendations(recommendations) {
    const container = document.getElementById('recommendationsContainer');
    const resultsSection = document.getElementById('resultsSection');
    
    container.innerHTML = recommendations.map(rec => `
        <div class="recommendation-card ${getStatusClass(rec.recommendation)}">
            <div class="rec-header">
                <h3>${rec.name}</h3>
                <span class="status-badge">${getStatusBadge(rec.recommendation)}</span>
            </div>
            
            <div class="rec-metrics">
                <div class="metric">
                    <div class="metric-label">Current Stock</div>
                    <div class="metric-value">${rec.current_stock}</div>
                </div>
                <div class="metric">
                    <div class="metric-label">EOQ</div>
                    <div class="metric-value">${rec.eoq}</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Reorder Point</div>
                    <div class="metric-value">${rec.reorder_point}</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Annual Demand</div>
                    <div class="metric-value">${rec.annual_demand}</div>
                </div>
            </div>
            
            <div class="rec-costs">
                <div class="cost-item">
                    <span>Ordering Cost:</span>
                    <span>$${rec.total_ordering_cost}</span>
                </div>
                <div class="cost-item">
                    <span>Holding Cost:</span>
                    <span>$${rec.total_holding_cost}</span>
                </div>
                <div class="cost-item total">
                    <span>Total Cost:</span>
                    <span>$${rec.total_inventory_cost}</span>
                </div>
            </div>
            
            <div class="rec-action">
                <strong>Recommendation:</strong> ${rec.recommendation}
            </div>
        </div>
    `).join('');
    
    resultsSection.style.display = 'block';
}

// Get status class for styling
function getStatusClass(recommendation) {
    if (recommendation.includes('ORDER NOW')) return 'status-critical';
    if (recommendation.includes('MONITOR')) return 'status-warning';
    return 'status-ok';
}

// Get status badge
function getStatusBadge(recommendation) {
    if (recommendation.includes('ORDER NOW')) return '🔴 Critical';
    if (recommendation.includes('MONITOR')) return '🟡 Warning';
    return '🟢 OK';
}

// Create charts
function createCharts(recommendations) {
    const chartsSection = document.getElementById('chartsSection');
    chartsSection.style.display = 'block';
    
    // Destroy existing charts
    Object.values(charts).forEach(chart => chart.destroy());
    charts = {};
    
    const productNames = recommendations.map(r => r.name);
    
    // EOQ vs Current Stock Chart
    charts.eoq = new Chart(document.getElementById('eoqChart'), {
        type: 'bar',
        data: {
            labels: productNames,
            datasets: [
                {
                    label: 'Current Stock',
                    data: recommendations.map(r => r.current_stock),
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2
                },
                {
                    label: 'EOQ',
                    data: recommendations.map(r => r.eoq),
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2
                },
                {
                    label: 'Reorder Point',
                    data: recommendations.map(r => r.reorder_point),
                    backgroundColor: 'rgba(255, 159, 64, 0.6)',
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Quantity'
                    }
                }
            }
        }
    });
    
    // Cost Breakdown Chart
    charts.cost = new Chart(document.getElementById('costChart'), {
        type: 'doughnut',
        data: {
            labels: ['Total Ordering Cost', 'Total Holding Cost'],
            datasets: [{
                data: [
                    recommendations.reduce((sum, r) => sum + r.total_ordering_cost, 0),
                    recommendations.reduce((sum, r) => sum + r.total_holding_cost, 0)
                ],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // Reorder Points Chart
    charts.reorder = new Chart(document.getElementById('reorderChart'), {
        type: 'line',
        data: {
            labels: productNames,
            datasets: [{
                label: 'Reorder Point',
                data: recommendations.map(r => r.reorder_point),
                fill: true,
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 2,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Units'
                    }
                }
            }
        }
    });
    
    // Total Inventory Costs Chart
    charts.inventoryCost = new Chart(document.getElementById('inventoryCostChart'), {
        type: 'bar',
        data: {
            labels: productNames,
            datasets: [{
                label: 'Total Inventory Cost',
                data: recommendations.map(r => r.total_inventory_cost),
                backgroundColor: 'rgba(255, 206, 86, 0.6)',
                borderColor: 'rgba(255, 206, 86, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Cost ($)'
                    }
                }
            }
        }
    });
}

// Run simulation
async function runSimulation() {
    if (products.length === 0) {
        showToast('Please add at least one product', 'error');
        return;
    }
    
    const simulationSection = document.getElementById('simulationSection');
    simulationSection.style.display = 'block';
    simulationSection.scrollIntoView({ behavior: 'smooth' });
    
    const demandMult = parseFloat(document.getElementById('demandMultiplier').value);
    const storageMult = parseFloat(document.getElementById('storageMultiplier').value);
    const restockMult = parseFloat(document.getElementById('restockMultiplier').value);
    
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/simulate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                products,
                scenarios: [
                    {
                        name: 'Current Scenario',
                        modifications: {
                            demand_multiplier: 1.0,
                            cost_storage_multiplier: 1.0,
                            cost_restock_multiplier: 1.0
                        }
                    },
                    {
                        name: 'Custom Scenario',
                        modifications: {
                            demand_multiplier: demandMult,
                            cost_storage_multiplier: storageMult,
                            cost_restock_multiplier: restockMult
                        }
                    }
                ]
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            displaySimulationResults(data.scenarios);
            showToast('Simulation completed successfully!', 'success');
        } else {
            throw new Error(data.error || 'Simulation failed');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

// Display simulation results
function displaySimulationResults(scenarios) {
    const container = document.getElementById('simulationResults');
    
    container.innerHTML = `
        <h3>Scenario Comparison</h3>
        ${scenarios.map(scenario => `
            <div class="scenario-card">
                <h4>${scenario.name}</h4>
                <div class="scenario-mods">
                    <span>Demand: ×${scenario.modifications.demand_multiplier}</span>
                    <span>Storage Cost: ×${scenario.modifications.cost_storage_multiplier}</span>
                    <span>Restock Cost: ×${scenario.modifications.cost_restock_multiplier}</span>
                </div>
                <div class="scenario-results">
                    ${scenario.recommendations.map(rec => `
                        <div class="scenario-product">
                            <strong>${rec.name}</strong>
                            <div class="scenario-metrics">
                                <span>EOQ: ${rec.eoq}</span>
                                <span>Reorder Point: ${rec.reorder_point}</span>
                                <span>Total Cost: $${rec.total_inventory_cost}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('')}
    `;
}

// Show loading spinner
function showLoading(show) {
    document.getElementById('loadingSpinner').style.display = show ? 'flex' : 'none';
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// Load sample data for testing
function loadSampleData() {
    // You can comment this out if you don't want sample data
    const sampleProducts = [
        {
            name: 'Widget A',
            stock: 50,
            demand: 1000,
            cost_storage: 2.5,
            cost_restock: 100
        },
        {
            name: 'Widget B',
            stock: 200,
            demand: 5000,
            cost_storage: 1.5,
            cost_restock: 150
        },
        {
            name: 'Widget C',
            stock: 10,
            demand: 500,
            cost_storage: 3.0,
            cost_restock: 80
        }
    ];
    
    // Uncomment to load sample data automatically
    // products = sampleProducts;
    // updateProductsList();
}
