#!/bin/bash

echo 'Starting Bluetti AC200M Monitor with React App...'
echo $(date): Starting Bluetti Monitor Service >> /home/pi/bluetti-monitor/service.log

# Kill any existing processes
pkill -f bluetti-mqtt
pkill -f simple_bluetti_server.py
pkill -f "python3 -m http.server"
sleep 2

# Start bluetti-mqtt in background
echo 'Starting bluetti-mqtt...'
cd /home/pi/bluetti-monitor
source venv/bin/activate
nohup bluetti-mqtt --broker 127.0.0.1 --port 1883 --ha-config none 00:15:83:82:0B:B1 > /home/pi/bluetti-monitor/bluetti_mqtt.log 2>&1 &
BLUETTI_PID=$!
echo bluetti-mqtt PID: $BLUETTI_PID
echo $(date): bluetti-mqtt started with PID $BLUETTI_PID >> /home/pi/bluetti-monitor/service.log

# Start battery logger in background
echo 'Starting battery logger...'
cd /home/pi/bluetti-monitor
source venv/bin/activate
nohup python3 battery_logger.py > /home/pi/bluetti-monitor/battery_logger.log 2>&1 &
BATTERY_LOGGER_PID=$!
echo Battery logger PID: $BATTERY_LOGGER_PID
echo $(date): Battery logger started with PID $BATTERY_LOGGER_PID >> /home/pi/bluetti-monitor/service.log

# Start API server in background
echo 'Starting API server...'
nohup python3 api_server.py > /home/pi/bluetti-monitor/api_server.log 2>&1 &
API_PID=$!
echo API server PID: $API_PID
echo $(date): API server started with PID $API_PID >> /home/pi/bluetti-monitor/service.log

# Start React app HTTP server in background
echo 'Starting React app server...'
cd /home/pi/bluetti-monitor/dist
nohup python3 -m http.server 8082 > /home/pi/bluetti-monitor/react_server.log 2>&1 &
REACT_PID=$!
echo React app PID: $REACT_PID
echo $(date): React app started with PID $REACT_PID >> /home/pi/bluetti-monitor/service.log

echo ''
echo '🎉 Bluetti AC200M Monitor is running!'
echo '📊 Dashboard: http://192.168.1.145:8082'
echo '🔌 API: http://192.168.1.145:8083/api/bluetti'
echo '📱 Mobile: http://192.168.1.145:8083/mobile_dashboard.html'
echo ''
echo 'PIDs:'
echo "bluetti-mqtt: $BLUETTI_PID"
echo "battery-logger: $BATTERY_LOGGER_PID"
echo "API server: $API_PID"
echo "React app: $REACT_PID"
echo $(date): Bluetti Monitor Service fully started >> /home/pi/bluetti-monitor/service.log

# Keep the script running to prevent systemd from thinking it failed
while true; do
    sleep 60
    # Check if processes are still running
    if ! pgrep -f bluetti-mqtt > /dev/null; then
        echo $(date): bluetti-mqtt process died, restarting... >> /home/pi/bluetti-monitor/service.log                                                                                              
        cd /home/pi/bluetti-monitor
        source venv/bin/activate
        nohup bluetti-mqtt --broker 127.0.0.1 --port 1883 --ha-config none 00:15:83:82:0B:B1 > /home/pi/bluetti-monitor/bluetti_mqtt.log 2>&1 &                                                     
    fi
    
    if ! pgrep -f battery_logger.py > /dev/null; then
        echo $(date): Battery logger process died, restarting... >> /home/pi/bluetti-monitor/service.log
        cd /home/pi/bluetti-monitor
        source venv/bin/activate
        nohup python3 battery_logger.py > /home/pi/bluetti-monitor/battery_logger.log 2>&1 &
    fi
    
    if ! pgrep -f api_server.py > /dev/null; then
        echo $(date): API server process died, restarting... >> /home/pi/bluetti-monitor/service.log                                                                                                
        cd /home/pi/bluetti-monitor
        nohup python3 api_server.py > /home/pi/bluetti-monitor/api_server.log 2>&1 &
    fi
    
    if ! pgrep -f "python3 -m http.server" > /dev/null; then
        echo $(date): React app process died, restarting... >> /home/pi/bluetti-monitor/service.log
        cd /home/pi/bluetti-monitor/dist
        nohup python3 -m http.server 8082 > /home/pi/bluetti-monitor/react_server.log 2>&1 &
    fi
done
