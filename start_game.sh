#!/bin/bash

echo "========================================"
echo "  Stock Management Game - Launcher"
echo "========================================"
echo ""

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "[ERROR] Virtual environment not found!"
    echo "Please run: python3 -m venv .venv"
    echo "Then run: source .venv/bin/activate"
    echo "Then run: pip install -r requirements.txt"
    exit 1
fi

echo "[1/3] Activating virtual environment..."
source .venv/bin/activate

echo "[2/3] Starting Flask backend server..."
echo ""
echo "Backend will run on: http://127.0.0.1:5000"
echo "Keep this terminal open while playing!"
echo ""

# Start Flask in background
python backend/app.py &
FLASK_PID=$!

# Wait for server to start
echo "Waiting for server to start..."
sleep 3

echo "[3/3] Opening game in browser..."

# Detect OS and open browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open frontend/game.html
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open frontend/game.html 2>/dev/null || echo "Please open frontend/game.html in your browser"
fi

echo ""
echo "========================================"
echo "  Game is now running!"
echo "========================================"
echo ""
echo "- Game URL: file://$(pwd)/frontend/game.html"
echo "- API URL: http://127.0.0.1:5000"
echo "- Flask PID: $FLASK_PID"
echo ""
echo "Press Ctrl+C to stop the server"
echo "========================================"
echo ""

# Wait for Ctrl+C
trap "echo ''; echo 'Stopping server...'; kill $FLASK_PID 2>/dev/null; exit 0" INT

# Keep script running
wait $FLASK_PID
