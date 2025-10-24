#!/bin/bash

# Bluetti Pi Monitor Setup Script
# This script sets up a Raspberry Pi Zero W to run the Bluetti monitoring system

set -e

echo "🔋 Bluetti Pi Monitor Setup Script"
echo "=================================="

# Check if running on Raspberry Pi
if ! grep -q "Raspberry Pi" /proc/device-tree/model 2>/dev/null; then
    echo "⚠️  Warning: This script is designed for Raspberry Pi. Proceeding anyway..."
fi

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Python 3 and pip
echo "🐍 Installing Python 3 and pip..."
sudo apt install -y python3 python3-pip python3-venv

# Install bluetti_mqtt
echo "📡 Installing bluetti_mqtt..."
pip3 install bluetti_mqtt

# Install Mosquitto MQTT broker
echo "📨 Installing Mosquitto MQTT broker..."
sudo apt install -y mosquitto mosquitto-clients

# Configure Mosquitto
echo "⚙️  Configuring Mosquitto..."
sudo tee /etc/mosquitto/conf.d/bluetti.conf > /dev/null <<EOF
# Allow anonymous connections for local development
allow_anonymous true

# Listen on all interfaces
listener 1883 0.0.0.0

# Persistence settings
persistence true
persistence_location /var/lib/mosquitto/

# Logging
log_dest file /var/log/mosquitto/mosquitto.log
log_type error
log_type warning
log_type notice
log_type information
EOF

# Start and enable Mosquitto
sudo systemctl restart mosquitto
sudo systemctl enable mosquitto

# Install Node.js (using NodeSource repository for ARM)
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installations
echo "✅ Verifying installations..."
echo "Python version: $(python3 --version)"
echo "Pip version: $(pip3 --version)"
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Mosquitto version: $(mosquitto --version | head -1)"

# Create application directory
APP_DIR="/opt/bluetti-monitor"
echo "📁 Creating application directory: $APP_DIR"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Create systemd service files
echo "🔧 Creating systemd service files..."

# Bluetti MQTT service
sudo tee /etc/systemd/system/bluetti-mqtt.service > /dev/null <<EOF
[Unit]
Description=Bluetti MQTT Bridge
After=network.target mosquitto.service
StartLimitIntervalSec=0

[Service]
Type=simple
Restart=always
RestartSec=30
TimeoutStopSec=15
User=$USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/local/bin/bluetti-mqtt --broker localhost --interval 10 \${BLUETTI_DEVICE_MAC}
Environment=BLUETTI_DEVICE_MAC=00:11:22:33:44:55
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Node.js backend service
sudo tee /etc/systemd/system/bluetti-monitor.service > /dev/null <<EOF
[Unit]
Description=Bluetti Monitor Web Server
After=network.target mosquitto.service
StartLimitIntervalSec=0

[Service]
Type=simple
Restart=always
RestartSec=30
TimeoutStopSec=15
User=$USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node server/index.js
Environment=NODE_ENV=production
Environment=PORT=8082
Environment=MQTT_BROKER_HOST=localhost
Environment=MQTT_BROKER_PORT=1883
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
sudo systemctl daemon-reload

echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Copy your project files to $APP_DIR"
echo "2. Run 'npm install' in the project directory"
echo "3. Run 'npm run build' to build the React app"
echo "4. Update the device MAC address in /etc/systemd/system/bluetti-mqtt.service"
echo "5. Start the services:"
echo "   sudo systemctl start bluetti-mqtt"
echo "   sudo systemctl start bluetti-monitor"
echo "   sudo systemctl enable bluetti-mqtt"
echo "   sudo systemctl enable bluetti-monitor"
echo ""
echo "6. Access the dashboard at: http://$(hostname -I | awk '{print $1}'):8082"
echo ""
echo "🔍 To find your Bluetti device MAC address, run:"
echo "bluetti-mqtt --scan"
