#!/bin/bash

# Bluetti Monitor API Server Setup Script
# This script sets up the API server with notification capabilities

echo "🚀 Setting up Bluetti Monitor API Server..."

# Install required Python packages
echo "📦 Installing required Python packages..."
pip3 install flask flask-cors requests twilio python-dotenv

# Make the API server executable
chmod +x api_server.py

# Create a systemd service for the API server
echo "⚙️ Creating systemd service..."
sudo tee /etc/systemd/system/bluetti-api.service > /dev/null <<EOF
[Unit]
Description=Bluetti Monitor API Server
After=network.target bluetooth.target

[Service]
User=pi
WorkingDirectory=/home/pi/bluetti-monitor
ExecStart=/usr/bin/python3 /home/pi/bluetti-monitor/api_server.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Create battery logger service file
echo "🔋 Creating battery logger service..."
sudo tee /etc/systemd/system/battery-logger.service > /dev/null <<EOF
[Unit]
Description=Battery Activity Logger
After=network.target mosquitto.service
StartLimitIntervalSec=0

[Service]
Type=simple
Restart=always
RestartSec=30
TimeoutStopSec=15
User=pi
WorkingDirectory=/home/pi/bluetti-monitor
ExecStart=/usr/bin/python3 /home/pi/bluetti-monitor/battery_logger.py
Environment=PYTHONUNBUFFERED=1
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable the services
sudo systemctl daemon-reload
sudo systemctl enable bluetti-api.service
sudo systemctl enable battery-logger.service

echo "✅ API Server setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit notification_config.json with your email/SMS settings"
echo "2. Start the services:"
echo "   sudo systemctl start bluetti-api"
echo "   sudo systemctl start battery-logger"
echo "3. Check status:"
echo "   sudo systemctl status bluetti-api"
echo "   sudo systemctl status battery-logger"
echo "4. View logs:"
echo "   sudo journalctl -u bluetti-api -f"
echo "   sudo journalctl -u battery-logger -f"
echo ""
echo "🌐 API Endpoints:"
echo "- http://your-pi-ip:8083/api/bluetti - Get all data"
echo "- http://your-pi-ip:8083/api/bluetti/battery - Get battery status"
echo "- http://your-pi-ip:8083/api/bluetti/power - Get power status"
echo "- http://your-pi-ip:8083/api/health - Health check"
echo "- http://your-pi-ip:8083/api/activity/current - Current battery activity"
echo "- http://your-pi-ip:8083/api/activity/charge-sessions - Charge sessions"
echo "- http://your-pi-ip:8083/mobile_dashboard.html - Mobile dashboard"
echo ""
echo "📱 Mobile Dashboard: http://your-pi-ip:8083/mobile_dashboard.html"
