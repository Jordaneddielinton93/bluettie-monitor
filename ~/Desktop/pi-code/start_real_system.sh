#!/bin/bash
# Start the real Bluetti monitoring system (no mock data)

echo "Starting real Bluetti monitoring system..."

# Kill any existing processes
echo "Stopping existing processes..."
pkill -f simple_bluetti_mqtt.py
pkill -f websocket_server
pkill -f 'python3 -m http.server'
pkill -f bluetti-mqtt

# Wait a moment
sleep 2

# Start HTTP server for the dashboard
echo "Starting HTTP server on port 8082..."
cd /home/pi/bluetti-monitor
python3 -m http.server 8082 &
HTTP_PID=$!

# Start WebSocket server
echo "Starting WebSocket server on port 8083..."
source venv/bin/activate
python3 websocket_server_fixed.py &
WS_PID=$!

# Start real Bluetti MQTT publisher
echo "Starting real Bluetti MQTT publisher..."
python3 real_bluetti_setup.py &
BLUETTI_PID=$!

echo "System started!"
echo "HTTP server PID: $HTTP_PID"
echo "WebSocket server PID: $WS_PID" 
echo "Bluetti MQTT PID: $BLUETTI_PID"
echo ""
echo "Access your dashboard at: http://192.168.1.145:8082"
echo ""
echo "To stop the system, run:"
echo "pkill -f 'python3 -m http.server'"
echo "pkill -f websocket_server_fixed.py"
echo "pkill -f real_bluetti_setup.py"
