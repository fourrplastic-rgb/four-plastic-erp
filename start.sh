#!/bin/bash

echo "========================================"
echo "   FOUR PLASTIC - Development Server"
echo "========================================"

# Function to handle shutdown
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up trap to catch Ctrl+C
trap cleanup SIGINT SIGTERM

# Get the current directory
CURRENT_DIR=$(pwd)
echo "📂 Working directory: $CURRENT_DIR"

# Start Backend
echo ""
echo "🚀 Starting Backend Server..."
cd backend
../venv/bin/python3 app.py &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Wait a moment for backend to start
sleep 3

# Start Frontend
echo ""
echo "🎨 Starting Frontend Server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

# Go back to original directory
cd "$CURRENT_DIR"

echo ""
echo "✅ Servers are running!"
echo "📌 Backend:  http://localhost:5001"
echo "📌 Frontend: http://localhost:3000"
echo ""
echo "⚠️  Press Ctrl+C to stop both servers"
echo ""

# Wait forever
wait