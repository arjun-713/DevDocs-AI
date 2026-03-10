#!/bin/bash

# DevDocs AI Startup Script
# This script starts both the FastAPI backend and the Next.js frontend.

# Set the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PROJECT_ROOT

# --- 1. Backend Startup ---
echo "🚀 Starting backend server..."
cd "$PROJECT_ROOT/backend" || exit

# Create required data directory if it doesn't exist
mkdir -p data

# Check if virtual environment exists
if [ ! -d "$PROJECT_ROOT/.venv" ]; then
    echo "❌ Virtual environment not found at $PROJECT_ROOT/.venv"
    echo "Please create it and install dependencies first."
    exit 1
fi

# Start uvicorn in the background
# We use the absolute path to the venv python to ensure it uses the correct interpreter
"$PROJECT_ROOT/.venv/bin/uvicorn" app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# --- 2. Frontend Startup ---
echo "🚀 Starting frontend development server..."
cd "$PROJECT_ROOT/frontend" || exit

# Start npm dev in the background
npm run dev &
FRONTEND_PID=$!

# --- 3. Management ---
echo "✅ Both servers are starting up!"
echo "📡 Backend: http://localhost:8000"
echo "🌐 Frontend: http://localhost:3000"
echo "按 CTRL+C to stop both servers."

# Trap SIGINT (CTRL+C) and SIGTERM to kill both background processes
trap "echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM

# Keep the script running to wait for background processes
wait
