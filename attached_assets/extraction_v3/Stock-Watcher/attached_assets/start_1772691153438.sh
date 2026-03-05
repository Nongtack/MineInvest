#!/bin/bash
# ─────────────────────────────────────────────
#  Portfolio Tracker — Local Server
# ─────────────────────────────────────────────
PORT=8080
DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "  ██████  ██████  ██████  ████████"
echo "  ██  ██  ██  ██  ██  ██     ██"
echo "  ██████  ██  ██  ██████     ██"
echo "  ██      ██  ██  ██  ██     ██"
echo "  ██      ██████  ██  ██     ██"
echo ""
echo "  Portfolio Tracker — starting server..."
echo "  ────────────────────────────────────────"
echo ""

# Check if port is already in use
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "  ⚠️  Port $PORT already in use. Stopping old process..."
  kill $(lsof -Pi :$PORT -sTCP:LISTEN -t) 2>/dev/null
  sleep 1
fi

echo "  📂 Serving from: $DIR"
echo "  🌐 Open in browser: http://localhost:$PORT"
echo ""
echo "  📱 iPhone shortcut:"
echo "     1. เปิด Safari บน iPhone"
echo "     2. ไปที่ http://[IP ของเครื่อง]:$PORT"
echo "        (ดู IP: System Settings › Wi-Fi › ⓘ)"
echo "     3. กด Share › Add to Home Screen"
echo "     4. กด Add — จะได้ไอคอนบน home screen!"
echo ""
echo "  🛑 หยุด server: กด Ctrl+C"
echo "  ────────────────────────────────────────"
echo ""

# Try python3 first, then python
if command -v python3 &>/dev/null; then
  cd "$DIR" && python3 -m http.server $PORT
elif command -v python &>/dev/null; then
  cd "$DIR" && python -m SimpleHTTPServer $PORT
else
  echo "  ❌ ไม่พบ Python กรุณาติดตั้ง Python ก่อน"
  exit 1
fi
