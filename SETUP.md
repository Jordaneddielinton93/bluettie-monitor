# 🚀 Quick Setup Guide - Sci-Fi Vanlife Edition

## Prerequisites

- Raspberry Pi (Zero W, 3B+, 4B, or newer)
- Bluetti AC200M power station (or compatible model)
- SD card with Raspberry Pi OS installed
- WiFi connection

## 🛠️ Installation Steps

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/Jordaneddielinton93/bluettie-monitor.git
cd bluettie-monitor

# Copy environment configuration
cp env.example .env

# Edit with your settings
nano .env
```

### 2. Configure Environment Variables

Edit `.env` file with your specific settings:

```bash
# Required - Your Raspberry Pi's IP address
REACT_APP_API_BASE=http://YOUR_PI_IP:8083

# Required - Your Bluetti device details
BLUETTI_MAC=XX:XX:XX:XX:XX:XX
BLUETTI_MODEL=AC200MAX

# Optional - Notification settings
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
```

### 3. Run Setup Script

```bash
# Make setup script executable
chmod +x pi-setup.sh

# Run the setup (this will install dependencies and configure services)
./pi-setup.sh
```

### 4. Build and Deploy

```bash
# Install Node.js dependencies
npm install

# Build the React app
npm run build

# Copy to Pi (replace with your Pi's IP)
scp -r dist pi@YOUR_PI_IP:/home/pi/bluetti-monitor/

# Copy other files
scp battery_logger.py pi@YOUR_PI_IP:/home/pi/bluetti-monitor/
scp api_server.py pi@YOUR_PI_IP:/home/pi/bluetti-monitor/
scp start_react_app.sh pi@YOUR_PI_IP:/home/pi/bluetti-monitor/

# SSH to Pi and start services
ssh pi@YOUR_PI_IP
cd /home/pi/bluetti-monitor
sudo systemctl start battery-logger.service
sudo systemctl start bluetti-monitor.service
```

### 5. Access Your Dashboard

Open your browser and navigate to:
```
http://YOUR_PI_IP:8082
```

## 🎮 Features Overview

- **🚀 Sci-Fi Interface**: Halo-inspired futuristic dashboard
- **⚡ Real-time Monitoring**: Live Bluetti data every 2 seconds
- **🔋 Battery Activity Log**: Time remaining and charge session tracking
- **📊 Power Flow Visualization**: Animated energy distribution
- **📱 Mobile Ready**: Perfect for vanlife adventures

## 🔧 Troubleshooting

### Services Not Starting
```bash
# Check service status
sudo systemctl status battery-logger.service
sudo systemctl status bluetti-monitor.service

# View logs
sudo journalctl -u battery-logger.service -f
sudo journalctl -u bluetti-monitor.service -f
```

### API Not Responding
```bash
# Check if API server is running
curl http://YOUR_PI_IP:8083/api/bluetti

# Start API server manually
cd /home/pi/bluetti-monitor
source venv/bin/activate
python3 api_server.py
```

### Database Issues
```bash
# Check database file
ls -la /home/pi/bluetti-monitor/battery_activity.db

# Reset database (if needed)
rm /home/pi/bluetti-monitor/battery_activity.db
sudo systemctl restart battery-logger.service
```

## 📱 Mobile Access

The dashboard is fully responsive and works great on:
- Tablets (recommended for vanlife)
- Smartphones
- Laptops
- Desktop computers

## 🎯 Customization

### Changing Colors
Edit the CSS classes in the React components:
- `src/components/Dashboard.jsx`
- `src/components/PowerFlow.jsx`
- `src/components/ActivityLog.jsx`

### Adding New Features
- Backend: Add endpoints to `api_server.py`
- Frontend: Create components in `src/components/`
- Data: Modify `battery_logger.py` for new data collection

## 🛡️ Security Notes

- No hardcoded credentials in the code
- All sensitive data in environment variables
- Database stored locally on Pi
- MQTT communication over local network only

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the logs with `journalctl`
3. Ensure all environment variables are set correctly
4. Verify your Bluetti device is compatible

Enjoy your sci-fi vanlife power monitoring system! 🚀⚡🔋
