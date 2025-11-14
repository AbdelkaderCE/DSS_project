# 🎮 Enhanced Stock Management Game - Complete Documentation

## Overview

The Enhanced Stock Management Game is a comprehensive inventory management simulation with unlockable products, daily random events, and full game mechanics. Players must balance inventory levels, manage budgets, and maximize profits while dealing with dynamic market conditions.

---

## 🎯 Game Features

### Core Mechanics
- **Daily Simulation**: Day-by-day inventory operations
- **Budget Management**: Starting budget between $120-$300
- **EOQ Calculations**: Economic Order Quantity recommendations
- **Reorder Points**: Automatic stock level monitoring (3-day lead time)
- **Dynamic Events**: Random daily events affecting gameplay (10% chance)

### Progression System
- **Base Products**: 3 starting products (Widget A, B, C)
- **Store Items**: 10 unlockable products across 4 categories:
  - 📱 **Electronics**: Smartphone ($500), Laptop ($1000), Headphones ($200)
  - 🍔 **Food & Beverage**: Energy Drink ($150), Snack Box ($100), Coffee ($300)
  - 📝 **Office Supplies**: Notebook ($80), Pen ($50)
  - 🎁 **Premium**: Watch ($2000), Gaming Console ($1500)

### Event System
- **DEMAND_SPIKE** (+20% demand): Sudden market demand increase
- **CALM_DAY** (-20% demand): Quiet trading day
- **SUPPLIER_DISCOUNT** (10-20% off): Reduced restock costs
- **SPOILAGE** (5-15% loss): Product quality deterioration

### Tracking & Analytics
- **Budget History**: Day-by-day budget tracking
- **Stock History**: Per-product stock level tracking
- **Statistics**: Revenue, costs, profit, ROI, total sales, stockouts
- **Daily Reports**: Detailed summary of each day's operations

---

## 📊 Game Mechanics

### Daily Simulation Flow

Each day follows these steps:

1. **Event Application** (10% chance)
   - Random event selected from event pool
   - Event effects applied to relevant products
   
2. **Demand Processing**
   - Effective demand = base demand × event multiplier
   - Stock reduced by actual sales (capped at available stock)
   
3. **Revenue Calculation**
   - Revenue = units_sold × sale_price
   - Added to total revenue
   
4. **Storage Costs**
   - Storage cost = remaining_stock × cost_storage
   - Deducted from budget
   
5. **Budget Update**
   - Budget += revenue - storage_cost
   
6. **Recommendations**
   - Reorder Point = demand × 3 days
   - EOQ = √((2 × demand × restock_cost) / storage_cost)
   
7. **Alert Generation**
   - **Critical**: Stock ≤ reorder point
   - **Warning**: Stock < EOQ
   - **Budget**: Negative or low budget alerts
   
8. **History Update**
   - Budget history appended
   - Stock history per product updated
   - Daily report saved

---

## 🔧 StockGame Class API

### Initialization

```python
from game import StockGame

game = StockGame()
# Initializes with 3 base products
# Random budget between $120-$300
# 10 locked store items
```

### Properties

```python
game.day                    # Current day number
game.budget                 # Current budget
game.initial_budget         # Starting budget
game.unlocked_products      # List[BaseProduct]
game.store_items           # List[StoreItem]
game.current_event         # Optional[DailyEvent]
game.event_history         # List[DailyEvent]
game.budget_history        # List[float]
game.day_history          # List[int]
game.stock_history        # Dict[str, List[int]]
```

### Methods

#### `next_day() -> Dict[str, Any]`

Simulates one day of operations.

**Returns:**
```python
{
    'day': 2,
    'event': {
        'event_type': 'DEMAND_SPIKE',
        'name': 'Market Rush',
        'description': 'Sudden increase in demand!',
        'impact_multiplier': 1.2,
        'affected_product': 'Widget A',
        'duration_days': 1
    },
    'sales': [
        {
            'product': 'Widget A',
            'demand': 18.0,  # Base 15 × 1.2 multiplier
            'sold': 18,
            'revenue': 180.0,
            'remaining_stock': 32
        },
        ...
    ],
    'revenue': 370.0,
    'storage_cost': 36.10,
    'net_change': 333.90,
    'budget_after': 470.90,
    'alerts': [
        {
            'type': 'low_stock',
            'severity': 'critical',
            'product': 'Widget A',
            'message': '🔴 CRITICAL: Widget A stock (32) at reorder point!',
            'current_stock': 32,
            'reorder_point': 45,
            'recommended_order': 55
        }
    ],
    'recommendations': [...],
    'new_unlocks': [...]  # Newly affordable items
}
```

#### `restock(product_name: str, quantity: int) -> Dict[str, Any]`

Purchase inventory for a product.

**Parameters:**
- `product_name`: Name of product to restock
- `quantity`: Number of units to order

**Returns:**
```python
{
    'success': True,
    'product': 'Widget A',
    'quantity': 50,
    'cost': 50.0,  # Fixed restock cost
    'discount_applied': False,
    'discount_saved': 0,
    'old_stock': 32,
    'new_stock': 82,
    'budget': 420.90,
    'warning': None  # Or budget warning message
}
```

**Note:** Supplier discount event reduces restock cost by 10-20%

#### `unlock_item(item_name: str) -> Dict[str, Any]`

Unlock a store item and add to product catalog.

**Parameters:**
- `item_name`: Name of item to unlock

**Returns:**
```python
{
    'success': True,
    'item': 'Smartphone',
    'unlock_price': 500.0,
    'starting_stock': 10,
    'budget': 560.40,
    'message': '🎉 Successfully unlocked Smartphone! Added to your inventory with 10 units.'
}
```

**Error Cases:**
```python
# Not found
{'success': False, 'error': "Item 'XYZ' not found in store"}

# Already unlocked
{'success': False, 'error': "'Smartphone' is already unlocked"}

# Insufficient funds
{'success': False, 'error': "Insufficient funds. Need $500.00, have $450.00"}
```

#### `get_state() -> Dict[str, Any]`

Get complete game state.

**Returns:**
```python
{
    'day': 2,
    'budget': 470.90,
    'initial_budget': 137.0,
    'products': [
        {
            'name': 'Widget A',
            'stock': 32,
            'demand_rate': 15,
            'cost_storage': 0.5,
            'cost_restock': 50,
            'sale_price': 10
        },
        ...
    ],
    'store_items': [
        {
            'name': 'Smartphone',
            'unlock_price': 500.0,
            'starting_stock': 10,
            'daily_demand': 3,
            'sale_price': 150,
            'category': 'Electronics',
            'description': 'High-end smartphone',
            'unlocked': False,
            'affordable': False  # budget >= unlock_price
        },
        ...
    ],
    'current_event': {...},  # Or None
    'alerts': [...],
    'recommendations': [...],
    'statistics': {
        'total_revenue': 740.0,
        'total_storage_costs': 58.30,
        'total_restock_costs': 120.0,
        'total_unlock_costs': 0.0,
        'total_sales': 56,
        'total_stockouts': 0,
        'profit': 561.70,
        'roi': 243.8  # % return on investment
    },
    'history': {
        'budget': [137.0, 470.90, ...],
        'days': [1, 2, ...],
        'stock': {
            'Widget A': [50, 35, 32, ...],
            'Widget B': [30, 22, ...],
            ...
        }
    }
}
```

#### `get_daily_report() -> Dict[str, Any]`

Get most recent daily report (same format as `next_day()` return).

#### `apply_multipliers(demand_factor=1.0, storage_factor=1.0, restock_factor=1.0) -> Dict[str, Any]`

Preview scenario with temporary multipliers (doesn't modify game state).

**Parameters:**
- `demand_factor`: Demand multiplier (1.5 = +50%)
- `storage_factor`: Storage cost multiplier
- `restock_factor`: Restock cost multiplier

**Returns:**
```python
{
    'demand_factor': 1.5,
    'storage_factor': 1.2,
    'restock_factor': 0.9,
    'modified_products': [
        {
            'name': 'Widget A',
            'original_demand': 15,
            'modified_demand': 22.5,
            'original_storage_cost': 0.5,
            'modified_storage_cost': 0.6,
            'original_restock_cost': 50,
            'modified_restock_cost': 45
        },
        ...
    ],
    'note': 'These are preview multipliers. They do not affect actual game state.'
}
```

---

## 🌐 Flask API Endpoints

### Game Endpoints

#### `GET /start_game`

Start a new game session.

**Response:**
```json
{
    "success": true,
    "message": "New game started! Starting budget: $137.00",
    "state": { ... full game state ... }
}
```

#### `POST /next_day`

Advance to next day.

**Response:**
```json
{
    "success": true,
    "day_summary": { ... daily report ... },
    "state": { ... updated game state ... }
}
```

#### `POST /restock`

Restock a product.

**Request Body:**
```json
{
    "product": "Widget A",
    "quantity": 50
}
```

**Response:**
```json
{
    "success": true,
    "restock_result": { ... restock details ... },
    "state": { ... updated game state ... }
}
```

#### `POST /unlock_item`

Unlock a store item.

**Request Body:**
```json
{
    "item_name": "Smartphone"
}
```

**Response:**
```json
{
    "success": true,
    "unlock_result": { ... unlock details ... },
    "state": { ... updated game state ... }
}
```

#### `GET /get_state`

Get current game state.

**Response:**
```json
{
    "success": true,
    "state": { ... full game state ... }
}
```

#### `GET /get_daily_report`

Get most recent daily report.

**Response:**
```json
{
    "success": true,
    "report": { ... daily report ... }
}
```

#### `POST /apply_multipliers`

Preview scenario with multipliers.

**Request Body:**
```json
{
    "demand_factor": 1.5,
    "storage_factor": 1.2,
    "restock_factor": 0.9
}
```

**Response:**
```json
{
    "success": true,
    "preview": { ... modified product states ... }
}
```

---

## 📈 Formulas & Calculations

### Economic Order Quantity (EOQ)

```
EOQ = √((2 × D × S) / H)

Where:
- D = Annual demand (daily_demand × 365)
- S = Ordering cost (cost_restock)
- H = Holding cost per unit (cost_storage)
```

### Reorder Point

```
Reorder Point = Daily Demand × Lead Time

Where:
- Lead Time = 3 days (fixed)
```

### Budget Calculation

```
Daily Budget Change = Revenue - Storage Cost

Revenue = Σ (units_sold × sale_price)
Storage Cost = Σ (remaining_stock × cost_storage)
```

### Days of Stock

```
Days of Stock = Current Stock / Daily Demand
```

### ROI (Return on Investment)

```
ROI = ((Current Budget - Initial Budget) / Initial Budget) × 100
```

---

## 🎯 Game Strategy Tips

1. **Monitor Reorder Points**: Restock when stock hits reorder point to avoid stockouts
2. **Use EOQ**: Order quantities close to EOQ for optimal cost balance
3. **Watch Events**: Supplier discounts are great for bulk restocking
4. **Unlock Wisely**: Higher-priced items have better profit margins
5. **Track History**: Use charts to identify trends and patterns
6. **Budget Buffer**: Keep some budget reserve for emergencies
7. **Spoilage Risk**: High-demand products are more valuable despite spoilage risk
8. **Stockout Cost**: Lost sales impact both revenue and customer satisfaction

---

## 🐛 Error Handling

All API endpoints return standardized error responses:

```json
{
    "success": false,
    "error": "Descriptive error message"
}
```

Common error codes:
- **400 Bad Request**: Missing parameters or invalid data
- **500 Internal Server Error**: Server-side exception

---

## 📝 Example Game Session

```python
from game import StockGame

# Initialize
game = StockGame()
print(f"Starting budget: ${game.budget:.2f}")

# Day 1
day1 = game.next_day()
print(f"Day 1 revenue: ${day1['revenue']:.2f}")
print(f"Day 1 alerts: {len(day1['alerts'])}")

# Restock critical items
for rec in day1['recommendations']:
    if rec['status'] == 'critical':
        result = game.restock(rec['product'], int(rec['eoq']))
        print(f"Restocked {rec['product']}: {result['quantity']} units")

# Day 2
day2 = game.next_day()

# Unlock new product if affordable
state = game.get_state()
affordable = [item for item in state['store_items'] 
              if item['affordable'] and not item['unlocked']]

if affordable:
    unlock = game.unlock_item(affordable[0]['name'])
    print(f"Unlocked: {unlock['message']}")

# Get final stats
final = game.get_state()
print(f"\nFinal Budget: ${final['budget']:.2f}")
print(f"Profit: ${final['statistics']['profit']:.2f}")
print(f"ROI: {final['statistics']['roi']:.1f}%")
```

---

## 🚀 Quick Start

### Backend

```bash
# Activate virtual environment
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run Flask server
python backend/app.py
```

Server runs on: `http://localhost:5000`

### Testing

```bash
# Test game mechanics
python backend/game.py

# Test data structures
python backend/game_data.py
```

---

## 📦 Data Structures

### BaseProduct
```python
@dataclass
class BaseProduct:
    name: str
    stock: int
    cost_storage: float
    cost_restock: float
    sale_price: float
    daily_demand: float
    unlocked: bool = True
```

### StoreItem
```python
@dataclass
class StoreItem:
    name: str
    unlock_price: float
    starting_stock: int
    cost_storage: float
    cost_restock: float
    sale_price: float
    daily_demand: float
    category: str
    description: str
    unlocked: bool = False
```

### DailyEvent
```python
@dataclass
class DailyEvent:
    event_type: EventType
    name: str
    description: str
    impact_multiplier: float
    affected_product: Optional[str]
    duration_days: int
```

---

## 📊 Chart Data Format

### Budget History Chart
```javascript
{
    labels: [1, 2, 3, ...],  // Day numbers
    data: [137.0, 470.90, 818.70, ...]  // Budget values
}
```

### Stock History Chart
```javascript
{
    labels: [1, 2, 3, ...],  // Day numbers
    datasets: [
        {
            label: 'Widget A',
            data: [50, 35, 20, ...]
        },
        {
            label: 'Widget B',
            data: [30, 22, 14, ...]
        },
        ...
    ]
}
```

---

## 🎨 Frontend Integration

See `frontend/game.html` and `frontend/game-script.js` for complete UI implementation including:

- Real-time state updates
- Interactive product table
- Budget evolution chart (Chart.js)
- Multi-product stock tracking chart
- Alert system with visual indicators
- Store modal for unlocking items
- Event notifications
- Game statistics dashboard

---

## 📄 License

MIT License - Free for educational and commercial use

---

## 🤝 Contributing

This is an educational project. Feel free to extend with:
- More product categories
- Additional event types
- Achievement system
- Multiplayer features
- Save/load functionality
- Advanced analytics

---

**Version:** 3.0  
**Last Updated:** 2025-01-14  
**Author:** DSS Project Team
