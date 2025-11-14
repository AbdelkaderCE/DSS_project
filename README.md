# 📦 Stock Management Game - Complete Edition

A sophisticated inventory management simulation game with real-time analytics, decision support system, and economic order quantity (EOQ) calculations.

![Game Version](https://img.shields.io/badge/version-3.0-blue)
![Python](https://img.shields.io/badge/python-3.8+-green)
![Flask](https://img.shields.io/badge/flask-3.0-red)
![License](https://img.shields.io/badge/license-MIT-yellow)

---

## 🎮 About The Game

**Stock Management Game** is an educational business simulation where you manage inventory, unlock new products, respond to market events, and optimize your supply chain to maximize profits.

### Key Features

- 🏪 **13 Products**: 3 starter items + 10 unlockable products across 4 categories
- 📊 **Real-time Analytics**: Budget evolution, stock levels, and performance metrics
- 🎲 **Random Events**: Market dynamics including demand spikes, supplier discounts, and spoilage
- 🎯 **Decision Support System (DSS)**: AI-powered recommendations for optimal restocking
- 📈 **Economic Order Quantity (EOQ)**: Industry-standard inventory optimization
- 🏆 **Game Over Conditions**: Bankruptcy (-$100) or supply failure (3+ stockouts for 3 days)
- 📋 **Comprehensive Reports**: Daily financial summaries with export functionality

---

## 📁 Project Structure

```
DSS_project/
├── backend/
│   ├── app.py                 # Flask API server
│   ├── game.py                # StockGame class with full logic
│   ├── game_data.py           # Product catalog and event definitions
│   └── inventory_optimization.py  # EOQ calculations
├── frontend/
│   ├── game.html              # Main game interface
│   ├── game-style.css         # Complete styling (1000+ lines)
│   └── game-script.js         # Game logic and API integration (700+ lines)
├── venv/                      # Python virtual environment
├── README.md                  # This file
├── requirements.txt           # Python dependencies
├── start_game.bat             # Windows launch script
└── start_game.sh              # Linux/Mac launch script
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+** installed
- **Modern web browser** (Chrome, Firefox, Edge, Safari)
- **Internet connection** (for Chart.js CDN)

---

## 📋 Installation

### Step 1: Clone or Download the Project

```bash
cd C:\Users\djell\OneDrive\سطح المكتب\DSS_project
```

### Step 2: Create Virtual Environment (if not exists)

**Windows:**
```powershell
python -m venv venv
```

**Linux/Mac:**
```bash
python3 -m venv venv
```

### Step 3: Install Dependencies

**Windows:**
```powershell
.\venv\Scripts\activate
pip install -r requirements.txt
```

**Linux/Mac:**
```bash
source venv/bin/activate
pip install -r requirements.txt
```

---

## 🎯 How to Launch the Game

### Option 1: Automatic Launch Scripts (Recommended)

#### **Windows:**
Simply **double-click** `start_game.bat` or run:
```powershell
.\start_game.bat
```

#### **Linux/Mac:**
Make it executable first:
```bash
chmod +x start_game.sh
./start_game.sh
```

The script will:
1. ✅ Activate the virtual environment
2. ✅ Start the Flask backend server
3. ✅ Open the game in your default browser
4. ✅ Keep the server running

---

### Option 2: Manual Launch

#### **Step 1: Start the Backend Server**

Open a terminal/PowerShell in the project directory:

**Windows:**
```powershell
.\venv\Scripts\activate
python backend\app.py
```

**Linux/Mac:**
```bash
source venv/bin/activate
python backend/app.py
```

You should see:
```
 * Running on http://127.0.0.1:5000
 * Running on http://192.168.X.X:5000
```

**Keep this terminal open!** The server must stay running.

#### **Step 2: Open the Game**

**Option A:** Double-click `frontend/game.html` in File Explorer

**Option B:** Run in terminal:
```powershell
# Windows
start frontend/game.html

# Linux
xdg-open frontend/game.html

# Mac
open frontend/game.html
```

---

## 🎮 How to Play

### Starting the Game

1. **Click "🎮 New Game"** in the header
2. You'll start with a **random budget** between $120-$300
3. **3 starter products** are in your inventory:
   - Office Chair
   - Desk Lamp
   - Water Bottle

### Game Tabs Overview

#### 📦 **Inventory Tab**
- View all unlocked products
- See stock levels, demand, and costs
- **Restock products** using the Buy buttons
- Monitor **Reorder Points** and **EOQ** recommendations
- Track days of stock remaining

#### 🏪 **Store Tab**
- Browse **10 unlockable products** in 4 categories:
  - 📱 Electronics (Smartphone, Laptop, Headphones)
  - 🍔 Food & Beverage (Energy Drink, Snack Box, Coffee)
  - 📝 Office Supplies (Notebook Set, Pen Pack)
  - 🎁 Premium (Designer Watch, Gaming Console)
- **Filter by category** using the dropdown
- **Unlock products** when you have enough budget

#### 🎯 **DSS Panel Tab**
- **Best to Restock**: Priority recommendations
- **Highest Profit**: Top revenue-generating products
- **Cost Breakdown**: Storage, restock, and unlock costs
- **High-Risk Items**: Products with critical stock levels
- **High Storage Cost**: Optimize expensive items
- **Performance Metrics**: ROI, profit margin, revenue, net profit

#### 📊 **Charts Tab**
- **Budget Evolution**: Track your financial performance over time
- **Stock Levels**: Monitor inventory trends for all products
- **Statistics**: Budget trend, stock health, peak performance day

#### 📋 **Daily Report Tab**
- Financial summary (revenue, costs, net change)
- Sales breakdown by product
- Active alerts and recommendations
- **Export to CSV** for external analysis

### Daily Actions

1. **Review Alerts** - Check the 🔔 notification icon
2. **Restock Low Items** - Buy inventory before stockouts
3. **Unlock New Products** - Expand your catalog when profitable
4. **Click "⏭️ Next Day"** - Advance to the next day

### Daily Events (10% Chance)

- 📈 **Demand Spike** (+20% demand)
- 💰 **Supplier Discount** (-10-20% restock costs)
- ⚠️ **Spoilage** (5-15% stock loss on random product)
- 😴 **Calm Day** (-20% demand)

### Winning Strategy

- 🎯 Maintain stock above **Reorder Points**
- 💡 Use **EOQ recommendations** for optimal order sizes
- 💰 Take advantage of **Supplier Discount events**
- 🏪 Unlock **high-profit items** early
- 📊 Monitor **DSS Panel** for insights
- 💵 Keep a **budget buffer** for emergencies

### Game Over Conditions

❌ **Bankruptcy**: Budget falls to **-$100** or lower
❌ **Supply Failure**: **3+ products** out of stock for **3 consecutive days**

Progressive warnings will alert you before game over!

---

## 🔧 API Endpoints

The Flask backend provides these RESTful endpoints:

### Game Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/start_game` | GET | Create new game instance |
| `/next_day` | POST | Advance to next day |
| `/restock` | POST | Purchase inventory |
| `/unlock_item` | POST | Unlock store product |
| `/get_state` | GET | Get current game state |
| `/get_daily_report` | GET | Get last day's summary |
| `/health` | GET | API health check |

### Legacy DSS Endpoints (Still Available)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/recommend` | POST | Get EOQ recommendations |
| `/simulate` | POST | Run scenario analysis |

---

## 📊 Game Formulas

### Economic Order Quantity (EOQ)
```
EOQ = √((2 × Annual Demand × Restock Cost) / Storage Cost per Unit)
```

### Reorder Point (ROP)
```
ROP = Daily Demand × Lead Time
Lead Time = 3 days (default)
```

### Days of Stock Remaining
```
Days Left = Current Stock ÷ Daily Demand
```

### Return on Investment (ROI)
```
ROI = ((Current Budget - Initial Budget) / Initial Budget) × 100%
```

### Profit Margin
```
Profit Margin = (Net Profit / Total Revenue) × 100%
```

---

## 🛠️ Troubleshooting

### Issue: "Module not found" errors

**Solution:**
```bash
pip install -r requirements.txt
```

### Issue: Backend won't start

**Solution:**
- Check if port 5000 is already in use
- Try changing the port in `backend/app.py`:
  ```python
  app.run(debug=True, port=5001)
  ```

### Issue: Game won't load in browser

**Solution:**
- Ensure backend is running (check terminal)
- Check browser console for errors (F12)
- Verify you're opening `game.html` not `index.html`

### Issue: Charts not displaying

**Solution:**
- Check internet connection (Chart.js loads from CDN)
- Open browser developer console (F12) to check for errors

### Issue: Store items show "undefined"

**Solution:**
- Restart the backend server to ensure latest code is loaded
- Clear browser cache (Ctrl + Shift + Del)

---

## 🎨 Technologies Used

### Backend
- **Python 3.8+**
- **Flask 3.0** - Web framework
- **Flask-CORS** - Cross-origin resource sharing
- **Dataclasses** - Type-safe data structures

### Frontend
- **HTML5** - Semantic structure
- **CSS3** - Modern styling with animations
- **Vanilla JavaScript** - No frameworks
- **Chart.js 4.4** - Data visualization
- **Fetch API** - Asynchronous requests

---

## 📈 Game Statistics

- **13 Total Products** (3 base + 10 unlockable)
- **4 Product Categories**
- **4 Daily Event Types**
- **6 DSS Analysis Panels**
- **2 Interactive Charts**
- **5 Main Game Tabs**
- **Multiple Game Over Conditions**

---

## 🤝 Contributing

This is an educational project. Feel free to:
- Add new products in `backend/game_data.py`
- Create new event types
- Enhance the UI/UX
- Add new DSS analysis panels
- Improve formulas and calculations

---

## 📝 License

This project is created for educational purposes.

---

## 👨‍💻 Author

Created as part of a Decision Support Systems (DSS) course project.

---

## 🎓 Educational Value

This game teaches:
- Inventory management principles
- Economic Order Quantity (EOQ) theory
- Supply chain optimization
- Financial decision-making
- Risk management
- Data-driven analytics

---

## 📞 Support

If you encounter issues:
1. Check this README thoroughly
2. Review the troubleshooting section
3. Check browser console for errors (F12)
4. Verify backend terminal for error messages

---

## 🎉 Have Fun!

Enjoy managing your virtual inventory empire! Remember: the key to success is balancing costs, avoiding stockouts, and making data-driven decisions.

**Good luck, and may your profits soar! 📈💰**

---

**Last Updated:** November 14, 2025
**Version:** 3.0
**Status:** Production Ready ✅