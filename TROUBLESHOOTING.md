# Troubleshooting Guide - Stock Management Game

## 🔧 Common Issues and Solutions

---

## 1. Game Won't Start / "New Game" Button Does Nothing

### Symptoms
- Clicking "New Game" button shows no response
- No data appears in Inventory tab
- Console shows network errors

### Root Cause
Backend Flask server is not running or not accessible.

### Solution

**Step 1: Verify Flask is Running**
```powershell
# Check if process is running on port 5000
netstat -ano | findstr :5000
```

**Step 2: Start Backend Manually**
```powershell
cd "c:\Users\djell\OneDrive\سطح المكتب\DSS_project"
.venv\Scripts\python.exe backend\app.py
```

**Expected Output:**
```
 * Serving Flask app 'app'
 * Running on http://127.0.0.1:5000
```

**Step 3: Test Health Endpoint**
Open browser to: `http://127.0.0.1:5000/health`

Should return: `{"status": "healthy"}`

**Step 4: Refresh Game Page**
Press `Ctrl+R` in game window.

---

## 2. Port 5000 Already in Use

### Symptoms
```
OSError: [WinError 10048] Only one usage of each socket address is normally permitted
```

### Root Cause
Another application is using port 5000 (common with AirPlay on Windows).

### Solution

**Option A: Kill Existing Process**
```powershell
# Find PID using port 5000
netstat -ano | findstr :5000

# Kill process (replace <PID> with actual number)
taskkill /PID <PID> /F
```

**Option B: Change Flask Port**

Edit `backend/app.py` line 107:
```python
# Change from:
app.run(debug=True, host='0.0.0.0', port=5000)

# To:
app.run(debug=True, host='0.0.0.0', port=5001)
```

Then edit `frontend/game-script.js` line 2:
```javascript
// Change from:
const API_URL = 'http://127.0.0.1:5000';

// To:
const API_URL = 'http://127.0.0.1:5001';
```

---

## 3. CORS Errors in Browser Console

### Symptoms
```
Access to fetch at 'http://127.0.0.1:5000/game/start' from origin 'null' has been blocked by CORS policy
```

### Root Cause
Opening HTML file directly with `file://` protocol instead of through http server.

### Solution

**Quick Fix: Use File Protocol (Current Setup)**
The game is already configured to work with `file://` protocol via Flask-CORS.

**Verify CORS is Enabled:**
Check `backend/app.py` has:
```python
from flask_cors import CORS
CORS(app)
```

**Alternative: Use HTTP Server**
```powershell
# Python HTTP server
cd frontend
python -m http.server 8000

# Open: http://localhost:8000/game.html
```

---

## 4. "Buy" Button Not Working

### Symptoms
- Clicking "Buy" in Inventory tab does nothing
- Console shows errors about missing product ID

### Root Cause
JavaScript event listeners not properly attached.

### Solution

**Check Console for Errors:**
Press `F12` → Console tab

**Common Fix: Refresh Page**
Hard refresh: `Ctrl+Shift+R`

**Verify Element IDs:**
Open `frontend/game.html` and verify:
```html
<tbody id="inventoryTableBody"></tbody>
```

Matches `game-script.js`:
```javascript
const inventoryTableBody = document.getElementById('inventoryTableBody');
```

---

## 5. Store Items Show "Undefined" Prices

### Symptoms
- Store tab shows "Cost: $undefined"
- Unlock buttons display "NaN"

### Root Cause
Backend API returning different field names than expected.

### Solution

**Verify API Response:**
Open: `http://127.0.0.1:5000/game/state`

Check store items have `unlock_price` field:
```json
{
  "store_items": [
    {
      "id": "item_001",
      "name": "Smartphone",
      "unlock_price": 250,
      "cost": 180,
      ...
    }
  ]
}
```

**Update JavaScript if Needed:**
In `game-script.js` function `updateStoreGrid()`, verify:
```javascript
unlockPrice: ${item.unlock_price}
```

---

## 6. Game Over Modal Not Appearing

### Symptoms
- Budget goes below -$100 but game continues
- No game over message shown

### Root Cause
Modal display logic not triggered or modal element missing.

### Solution

**Verify Modal HTML Exists:**
In `game.html`, check for:
```html
<div id="gameOverModal" class="modal">
  <div class="modal-content">
    ...
  </div>
</div>
```

**Check JavaScript Logic:**
In `game-script.js`, verify `checkGameOver()` function:
```javascript
if (budget <= -100) {
    showGameOverModal(data);
}
```

**Manual Test:**
Open console and run:
```javascript
checkGameOver({budget: -150, day: 10, inventory: []});
```

---

## 7. Charts Not Displaying

### Symptoms
- Charts tab is blank or shows "No data"
- Console errors about Chart.js

### Root Cause
Chart.js CDN not loaded or insufficient data points.

### Solution

**Verify Chart.js CDN:**
In `game.html`, check `<head>` section:
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
```

**Check Internet Connection:**
CDN requires internet access. If offline, download Chart.js locally.

**Ensure Data Exists:**
Charts need at least 2 days of history. Play through day 2 first.

**Manual Refresh:**
Click "Refresh Charts" button in Charts tab.

---

## 8. Random Events Not Appearing

### Symptoms
- Event display always shows "No event today"
- No demand spikes or supplier discounts

### Root Cause
Event generation logic disabled or event data not returned by API.

### Solution

**Verify Backend Logic:**
In `backend/game_data.py`, check `generate_random_event()`:
```python
if random.random() < 0.5:
    return None  # 50% chance of no event
```

**Check API Response:**
After advancing day, verify `/game/day/next` returns:
```json
{
  "event": {
    "type": "DEMAND_SPIKE",
    "description": "Surge in demand for Office Chair!",
    ...
  }
}
```

**Frontend Display:**
In `game-script.js`, check `updateEventDisplay()` is called:
```javascript
if (data.event && data.event.type !== 'CALM_DAY') {
    updateEventDisplay(data.event);
}
```

---

## 9. Virtual Environment Not Found

### Symptoms
```
.venv is not recognized as an internal or external command
```

### Root Cause
Virtual environment not created or activated.

### Solution

**Create Virtual Environment:**
```powershell
cd "c:\Users\djell\OneDrive\سطح المكتب\DSS_project"
python -m venv .venv
```

**Activate It:**
```powershell
.venv\Scripts\activate
```

**Verify Activation:**
Prompt should show `(.venv)` prefix:
```
(.venv) PS C:\Users\djell\OneDrive\سطح المكتب\DSS_project>
```

**Install Requirements:**
```powershell
pip install -r requirements.txt
```

---

## 10. Module Not Found Errors

### Symptoms
```
ModuleNotFoundError: No module named 'flask'
ModuleNotFoundError: No module named 'flask_cors'
```

### Root Cause
Dependencies not installed or wrong Python environment.

### Solution

**Verify Virtual Environment is Active:**
```powershell
# Should show (.venv) in prompt
where python

# Should point to: .venv\Scripts\python.exe
```

**Install Requirements:**
```powershell
pip install -r requirements.txt
```

**Verify Installation:**
```powershell
pip list

# Should show:
# Flask         3.0.0
# Flask-CORS    4.0.0
# ...
```

**Alternative: Reinstall Everything**
```powershell
# Deactivate and delete old venv
deactivate
Remove-Item -Recurse -Force .venv

# Create fresh venv
python -m venv .venv
.venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
```

---

## 🔍 Debugging Tips

### Enable Verbose Logging

**Backend (Flask):**
Already enabled with `debug=True` in `app.py`.

**Frontend (JavaScript):**
Add to `game-script.js` top:
```javascript
const DEBUG = true;
function log(...args) {
    if (DEBUG) console.log('[Game]', ...args);
}
```

Then use: `log('State updated:', data);`

### Check API Responses

**Install Browser Extension:**
- Use "JSON Viewer" for Chrome/Edge
- Pretty-prints API responses

**Or Use PowerShell:**
```powershell
# Test health endpoint
Invoke-RestMethod http://127.0.0.1:5000/health

# Test game start
Invoke-RestMethod -Method POST http://127.0.0.1:5000/game/start
```

### Monitor Network Traffic

1. Press `F12` in browser
2. Go to **Network** tab
3. Click "New Game"
4. Check all API calls (should be green 200 status)
5. Click on requests to see request/response data

---

## 🆘 Still Having Issues?

### Collect Debug Information

1. **Backend Logs:**
   - Copy all output from PowerShell window running `app.py`

2. **Frontend Console:**
   - Press `F12` → Console tab
   - Right-click → "Save as..."

3. **Browser Info:**
   - Browser name and version
   - Operating system

4. **API Test:**
   ```powershell
   Invoke-RestMethod http://127.0.0.1:5000/health
   ```

### Reset to Clean State

**Nuclear Option: Complete Reset**
```powershell
# Stop all processes
taskkill /F /IM python.exe

# Delete virtual environment
Remove-Item -Recurse -Force .venv

# Recreate everything
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

# Restart backend
python backend\app.py

# Refresh browser (Ctrl+Shift+R)
```

---

## 📞 Additional Resources

- **Game Documentation:** `GAME_DOCUMENTATION.md`
- **UI Reference:** `UI_DOCUMENTATION.md`
- **Quick Start:** `QUICK_START.md`
- **API Reference:** `README.md` → API Endpoints section

---

**Most issues are solved by restarting the Flask backend and hard-refreshing the browser! 🔄**
