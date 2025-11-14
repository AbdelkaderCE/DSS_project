# 📐 Stock Management Game - Formula Reference

## Quick Reference Guide for All Game Calculations

---

## 📊 Economic Order Quantity (EOQ)

### Wilson's Formula

```
EOQ = √((2 × D × S) / H)
```

**Variables:**
- `D` = Annual demand (daily_demand × 365)
- `S` = Fixed ordering cost (cost_restock)
- `H` = Holding cost per unit per year (cost_storage × 365)

**Simplified for Daily Operations:**
```python
eoq = math.sqrt((2 * daily_demand * cost_restock) / cost_storage)
```

**Example:**
```
Product: Widget A
- Daily Demand: 15 units
- Restock Cost: $50
- Storage Cost: $0.50/unit

EOQ = √((2 × 15 × 50) / 0.5)
    = √(1500 / 0.5)
    = √3000
    = 54.77 units
    ≈ 55 units
```

**Interpretation:**
- Order 55 units when restocking Widget A
- This minimizes total ordering + holding costs
- Optimal balance between frequent small orders vs. large infrequent orders

---

## 🎯 Reorder Point (ROP)

### Lead Time Formula

```
Reorder Point = Daily Demand × Lead Time
```

**Variables:**
- `Daily Demand` = Average units sold per day
- `Lead Time` = Days until new stock arrives (fixed at 3)

**Implementation:**
```python
reorder_point = product.daily_demand * 3
```

**Example:**
```
Product: Widget A
- Daily Demand: 15 units
- Lead Time: 3 days

Reorder Point = 15 × 3 = 45 units
```

**Interpretation:**
- When stock drops to 45 units, place a new order
- This ensures stock doesn't run out during the 3-day wait
- Safety buffer against stockouts

---

## 📅 Days of Stock

### Inventory Coverage

```
Days of Stock = Current Stock / Daily Demand
```

**Implementation:**
```python
days_of_stock = product.stock / product.daily_demand if product.daily_demand > 0 else float('inf')
```

**Examples:**

```
Current Stock: 30 units
Daily Demand: 15 units
Days of Stock = 30 / 15 = 2 days

Current Stock: 60 units
Daily Demand: 15 units
Days of Stock = 60 / 15 = 4 days

Current Stock: 10 units
Daily Demand: 0 units
Days of Stock = ∞ (infinite)
```

**Interpretation:**
- How many days current stock will last
- < 3 days = Critical (below reorder point)
- 3-5 days = Warning
- > 5 days = Healthy stock level

---

## 💰 Revenue Calculation

### Daily Sales Revenue

```
Revenue = Σ (Units Sold × Sale Price)
```

**With Stockout Handling:**
```
Actual Sold = min(Current Stock, Demand)
Revenue = Actual Sold × Sale Price
```

**Implementation:**
```python
actual_sold = min(product.stock, int(effective_demand))
revenue = actual_sold * product.sale_price
```

**Example:**

```
Product: Widget A
- Stock: 40 units
- Demand: 15 units
- Sale Price: $10/unit

Actual Sold = min(40, 15) = 15 units
Revenue = 15 × $10 = $150

Product: Widget B (Stockout)
- Stock: 5 units
- Demand: 8 units
- Sale Price: $15/unit

Actual Sold = min(5, 8) = 5 units
Revenue = 5 × $15 = $75
Lost Revenue = (8 - 5) × $15 = $45
```

---

## 🏦 Storage Cost

### Holding Cost Calculation

```
Storage Cost = Σ (Remaining Stock × Storage Cost Per Unit)
```

**Implementation:**
```python
day_storage_cost = sum(p.stock * p.cost_storage for p in products)
```

**Example:**

```
After sales:

Widget A: 25 units × $0.50 = $12.50
Widget B: 17 units × $0.30 = $5.10
Widget C: 10 units × $0.80 = $8.00

Total Storage Cost = $12.50 + $5.10 + $8.00 = $25.60
```

**Interpretation:**
- Daily holding cost for unsold inventory
- Deducted from budget each day
- Incentive to maintain optimal stock levels
- Avoid overstocking

---

## 💵 Budget Update

### Daily Budget Change

```
New Budget = Previous Budget + Revenue - Storage Cost
```

**Implementation:**
```python
self.budget += day_revenue - day_storage_cost
```

**Example:**

```
Starting Budget: $500.00
Daily Revenue: $370.00
Storage Cost: $25.60

New Budget = $500.00 + $370.00 - $25.60
           = $844.40

Net Change = $370.00 - $25.60 = +$344.40
```

---

## 📈 Profit & Loss

### Total Profit Calculation

```
Profit = Total Revenue - Total Storage Costs - Total Restock Costs - Total Unlock Costs
```

**Implementation:**
```python
profit = (self.total_revenue - 
          self.total_storage_costs - 
          self.total_restock_costs - 
          self.total_unlock_costs)
```

**Example (10-day simulation):**

```
Total Revenue:        $3,700.00
Total Storage Costs:    $256.00
Total Restock Costs:    $300.00
Total Unlock Costs:     $500.00

Profit = $3,700 - $256 - $300 - $500
       = $2,644.00
```

---

## 📊 Return on Investment (ROI)

### ROI Percentage

```
ROI = ((Current Budget - Initial Budget) / Initial Budget) × 100
```

**Implementation:**
```python
roi = ((self.budget - self.initial_budget) / self.initial_budget * 100) if self.initial_budget > 0 else 0
```

**Example:**

```
Initial Budget: $150.00
Current Budget: $650.00

ROI = (($650 - $150) / $150) × 100
    = ($500 / $150) × 100
    = 3.333 × 100
    = 333.3%
```

**Interpretation:**
- 333% ROI means you've tripled your initial investment
- Positive ROI = Profitable
- Negative ROI = Loss
- 0% ROI = Break-even

---

## 🎲 Event Multipliers

### Demand Spike (+20%)

```
Effective Demand = Base Demand × 1.2
```

**Example:**
```
Base Demand: 15 units
Event Multiplier: 1.2

Effective Demand = 15 × 1.2 = 18 units
```

### Calm Day (-20%)

```
Effective Demand = Base Demand × 0.8
```

**Example:**
```
Base Demand: 15 units
Event Multiplier: 0.8

Effective Demand = 15 × 0.8 = 12 units
```

### Supplier Discount (10-20% off)

```
Discounted Cost = Base Restock Cost × (0.8 to 0.9)
```

**Example:**
```
Base Restock Cost: $50
Discount: 15% (multiplier = 0.85)

Discounted Cost = $50 × 0.85 = $42.50
Savings = $50 - $42.50 = $7.50
```

### Spoilage (5-15% loss)

```
Units Lost = random(5% to 15% of stock)
New Stock = Current Stock - Units Lost
```

**Example:**
```
Current Stock: 50 units
Spoilage Rate: 10%

Units Lost = 50 × 0.10 = 5 units
New Stock = 50 - 5 = 45 units
```

---

## 📉 Lost Sales Calculation

### Stockout Impact

```
Lost Sales = Demand - Actual Sold
Lost Revenue = Lost Sales × Sale Price
```

**Example:**

```
Demand: 15 units
Available Stock: 10 units
Sale Price: $10/unit

Actual Sold = min(10, 15) = 10 units
Lost Sales = 15 - 10 = 5 units
Lost Revenue = 5 × $10 = $50
```

---

## 🎯 Alert Thresholds

### Stock Status

```
Critical: Stock ≤ Reorder Point
Warning:  Reorder Point < Stock < EOQ
OK:       Stock ≥ EOQ
```

**Example:**
```
Product with:
- Reorder Point: 45 units
- EOQ: 55 units

Stock = 30 → CRITICAL (30 ≤ 45)
Stock = 50 → WARNING (45 < 50 < 55)
Stock = 60 → OK (60 ≥ 55)
```

### Budget Alerts

```
Critical:  Budget < $0
Warning:   $0 ≤ Budget < $50
OK:        Budget ≥ $50
```

---

## 📊 Summary Statistics

### Cumulative Tracking

```python
# Revenue
self.total_revenue += day_revenue

# Storage Costs
self.total_storage_costs += day_storage_cost

# Restock Costs
self.total_restock_costs += restock_cost

# Unlock Costs
self.total_unlock_costs += unlock_price

# Units Sold
self.total_sales += actual_sold

# Stockouts
if actual_sold < demand:
    self.total_stockouts += 1
```

---

## 🧮 Practical Examples

### Example 1: Optimal Order Quantity

```
Product: Laptop
- Daily Demand: 5 units
- Restock Cost: $100
- Storage Cost: $2/unit
- Current Stock: 20 units

Step 1: Calculate EOQ
EOQ = √((2 × 5 × 100) / 2)
    = √(1000 / 2)
    = √500
    = 22.36 ≈ 22 units

Step 2: Calculate Reorder Point
ROP = 5 × 3 = 15 units

Step 3: Determine Action
Current Stock (20) > ROP (15) → No immediate action
Current Stock (20) < EOQ (22) → Consider restocking soon

Recommendation: Wait until stock drops to 15, then order 22 units
```

### Example 2: Budget Impact

```
Starting Budget: $200
Day 1:
  Revenue: $300 (sold 30 units @ $10)
  Storage: $15 (30 units × $0.50)
  Net: +$285
  New Budget: $485

Day 2:
  Restock: -$50 (buy 50 units)
  Revenue: $250 (sold 25 units @ $10)
  Storage: $27.50 (55 units × $0.50)
  Net: -$50 + $250 - $27.50 = +$172.50
  New Budget: $657.50

ROI = (($657.50 - $200) / $200) × 100
    = 228.75%
```

### Example 3: Event Impact

```
Normal Day:
- Demand: 15 units
- Revenue: 15 × $10 = $150

Demand Spike Day (+20%):
- Demand: 18 units
- Revenue: 18 × $10 = $180
- Extra Revenue: $30

Supplier Discount Day (-15%):
- Normal Restock: $50
- Discounted: $50 × 0.85 = $42.50
- Savings: $7.50
```

---

## 💡 Formula Tips

1. **EOQ Accuracy**: Round to nearest whole number (can't order fractional units)
2. **Reorder Point**: Conservative estimate (3 days lead time)
3. **Storage Cost**: Applied to end-of-day inventory
4. **Lost Sales**: Track for performance metrics
5. **ROI**: Key metric for game success
6. **Event Probability**: 10% chance daily = ~3 events per month

---

## 📱 Quick Reference Table

| Metric | Formula | Purpose |
|--------|---------|---------|
| EOQ | √((2DS)/H) | Optimal order quantity |
| ROP | D × LT | When to reorder |
| Days of Stock | Stock / Demand | Coverage duration |
| Revenue | Units × Price | Daily income |
| Storage Cost | Stock × Cost | Daily holding fee |
| Profit | Revenue - Costs | Total gain/loss |
| ROI | ((Final - Initial) / Initial) × 100 | % return |
| Lost Sales | Demand - Sold | Missed opportunity |

---

**Created:** 2025-01-14  
**Version:** 3.0  
**For:** Stock Management Game v3.0
