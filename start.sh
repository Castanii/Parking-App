#!/bin/bash

# Parking App Startup Script
# Starts the Spring Boot backend (Java 25 / Gradle 9) and then the React frontend

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# Java 25 is required for the backend
export JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/temurin-25-jdk-amd64}"
export PATH="$JAVA_HOME/bin:$PATH"

echo "============================================"
echo "  Parking App - Starting Services"
echo "  Java: $(java -version 2>&1 | head -1)"
echo "============================================"

# --- Backend ---
echo ""
echo "[1/2] Building and starting the Spring Boot backend..."
cd "$BACKEND_DIR"

echo "  Compiling backend..."
./gradlew clean build -x test -q
echo "  Build successful. Starting backend..."

./gradlew bootRun -q &
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID"

# Wait for the backend to become available on port 8080
echo "  Waiting for backend to be ready on http://localhost:8080 ..."
for i in $(seq 1 60); do
    if curl -s http://localhost:8080 > /dev/null 2>&1 || curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
        echo "  Backend is up!"
        break
    fi
    # Also check if the process died unexpectedly
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "  ERROR: Backend process exited unexpectedly."
        exit 1
    fi
    sleep 2
done

# --- Frontend ---
echo ""
echo "[2/2] Starting the React frontend..."
cd "$FRONTEND_DIR"

# Install dependencies if node_modules is missing
if [ ! -d "node_modules" ]; then
    echo "  Installing frontend dependencies..."
    npm install
fi

npm run dev &
FRONTEND_PID=$!
echo "  Frontend PID: $FRONTEND_PID"

echo ""
echo "============================================"
echo "  Both services are running!"
echo ""
echo "  Backend  -> http://localhost:8080"
echo "  Frontend -> http://localhost:5173"
echo ""
echo "  Press Ctrl+C to stop all services."
echo "============================================"

# Handle Ctrl+C: gracefully stop both services
trap "echo ''; echo 'Stopping services...'; kill $FRONTEND_PID $BACKEND_PID 2>/dev/null; echo 'Done.'; exit 0" INT TERM

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
