# 🚀 Quick Start Guide - Stock Management Game

## ⚡ 3-Step Setup

### Step 1: Start Backend
```powershell
# Open PowerShell in project directory
cd "c:\Users\djell\OneDrive\سطح المكتب\DSS_project"

# Activate virtual environment and run server
.venv\Scripts\python.exe backend\app.py
```

**Expected Output:**
```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

### Step 2: Open Game
```powershell
# In a new PowerShell window or just double-click the file
Start-Process "frontend\game.html"
```

### Step 3: Play!
1. Click **"🎮 New Game"**
2. Start playing!

---

## 🎮 How to Play

### Game Objective
Maximize profit while avoiding bankruptcy and stockouts.

### Game Over Conditions
- **Bankruptcy**: Budget falls to -$100 or below
- **Supply Failure**: 3+ products out of stock for 3 consecutive days

### Basic Gameplay Loop

1. **Start Game**
   - Get random starting budget ($120-$300)
   - Start with 3 basic products

2. **Each Day**
   - Check inventory levels
   - Restock products before they run out
   - Monitor daily events (demand changes, supplier discounts, etc.)

3. **Restocking**
   - Use EOQ (Economic Order Quantity) recommendations
   - Buy in optimal quantities to minimize costs
   - Take advantage of supplier discounts when available

4. **Unlock New Products**
   - Visit the Store tab
   - Unlock higher-profit items
   - Expand your catalog strategically

5. **Use DSS Panel**
   - Check "Best to Restock" for priorities
   - Review "Highest Profit" items
   - Monitor "High-Risk Items" alerts
   - Analyze cost breakdowns

6. **Track Performance**
   - Charts tab shows budget and stock trends
   - Daily Report tab shows detailed financials
   - Watch ROI and profit metrics

---

## 🎯 Pro Tips

### Inventory Management
- **Restock BEFORE hitting reorder point**, not after
- **Use EOQ recommendations** - they're calculated for optimal cost
- **Watch "Days Left"** column - restock when < 3 days
- **Keep safety stock** for high-demand items

### Budget Management
- **Don't over-restock** - storage costs add up!
- **Balance stock levels** across all products
- **Save budget for unlocking** high-profit items
- **Monitor daily net change** in summaries

### Growth Strategy
- **Unlock high-margin items early** (check Store → margin %)
- **Prioritize Electronics & Premium** categories
- **Reinvest profits** into new products
- **Scale gradually** - don't unlock everything at once

### Event Management
- **High Demand Events**: Stock up beforehand!
- **Supplier Discounts**: Buy in bulk (use EOQ × 1.5)
- **Storage Cost Increases**: Reduce inventory temporarily
- **Price Surges**: Sell more, restock less

---

## 📊 Understanding the Interface

### Header Bar
- **Day**: Current day number
- **Budget**: Available cash (red if negative)
- **Event**: Current active event affecting the game
- **Alerts (🔔)**: Critical notifications (click to expand)

### Inventory Tab
**Color Coding:**
- 🔴 **Red Row** = Out of stock (CRITICAL - restock immediately!)
- 🟡 **Yellow Row** = Low stock (WARNING - restock soon)
- 🟢 **Green Row** = Adequate stock (OK)

**Key Columns:**
- **Reorder Point (ROP)**: Restock when stock drops below this
- **EOQ**: Optimal quantity to order
- **Days Left**: How many days until stockout

### Store Tab
- **Locked items**: Pay unlock cost to add to inventory
- **Filter by category**: Focus on specific types
- **Check sale price vs unlock cost**: ROI calculation

### DSS Panel
- **Best to Restock**: Top priority items (sorted by urgency)
- **Highest Profit**: Focus sales and stock on these
- **High-Risk Items**: Immediate attention needed
- **Cost Breakdown**: Where your money is going

### Charts Tab
- **Budget Evolution**: Track financial health over time
- **Stock Levels**: Visualize inventory trends
- **Look for patterns**: Predict future needs

### Daily Report Tab
- **Revenue**: Money earned from sales
- **Storage Cost**: Cost to hold inventory
- **Net Change**: Actual profit/loss for the day
- **Sales Details**: What sold and what's left

---

## 🆘 Troubleshooting

### Game Won't Start
**Problem**: Clicking "New Game" does nothing  
**Solution**: Check that backend is running on http://127.0.0.1:5000

### Cannot Restock
**Problem**: "Buy" button doesn't work  
**Solution**: Check you have enough budget for the purchase

### Charts Not Showing
**Problem**: Charts tab is empty  
**Solution**: Play at least 1 day (charts need data points)

### Backend Not Starting
**Problem**: Error when running app.py  
**Solution**: 
```powershell
# Install requirements
.venv\Scripts\pip.exe install -r backend\requirements.txt
```

---

## 📱 Keyboard Shortcuts

- **Ctrl + R**: Refresh game state
- **Ctrl + Click**: Quick restock (on Buy button)
- **Tab**: Navigate between tabs
- **Esc**: Close modal

---

## 🏆 Achievement Goals

Try to achieve these milestones:

- 🥉 **Bronze**: Survive 10 days
- 🥈 **Silver**: Survive 20 days, 100% ROI
- 🥇 **Gold**: Survive 30 days, 200% ROI, unlock all items
- 💎 **Diamond**: Survive 50 days, 500% ROI, $1000+ budget

---

## 📞 Support

If you encounter issues:

1. **Check Console**: Press F12 → Console tab → Look for errors
2. **Check Backend**: Look at PowerShell window running app.py
3. **Review Logs**: Check for error messages in both windows
4. **Restart**: Close everything and follow Step 1-2 again

---

## 📚 Additional Documentation

- **GAME_DOCUMENTATION.md**: Complete game mechanics and formulas
- **UI_DOCUMENTATION.md**: Full interface reference
- **FORMULAS.md**: All calculation formulas (EOQ, ROP, etc.)
- **COMPLETION_SUMMARY.md**: Technical implementation details

---

**Happy Gaming! 🎮📦💰**
