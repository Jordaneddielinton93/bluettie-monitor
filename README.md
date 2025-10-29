# Bluetti Pi Monitor - Sci-Fi Vanlife Edition

A futuristic, Halo-inspired monitoring dashboard for Bluetti power stations running on Raspberry Pi. Perfect for vanlife adventures with real-time battery monitoring, charge session tracking, and a stunning sci-fi interface.

## 🎯 Features

- **🚀 Sci-Fi Interface**: Halo-inspired futuristic dashboard with neon accents and terminal aesthetics
- **⚡ Real-time Monitoring**: Live data from your Bluetti AC200M power station
- **🔋 Battery Activity Log**: Comprehensive tracking with time remaining calculations
- **📊 Charge Session Timeline**: Beautiful timeline of charging sessions with duration and efficiency
- **🎮 Vanlife Ready**: Perfect for off-grid adventures and mobile power management
- **🔄 Auto-Start**: Automatically starts on Raspberry Pi boot with systemd service
- **🛡️ Auto-Restart**: Automatically restarts if the service crashes
- **📦 Battery Pack Details**: Individual monitoring of all battery packs (pack1, pack2, pack3)
- **⚡ Power Monitoring**: DC/AC input and output power tracking with flow visualization
- **🖥️ System Status**: Complete system status monitoring with sci-fi terminology
- **📡 MQTT Integration**: Uses bluetti-mqtt tool for Bluetooth communication
- **🌐 REST API**: Comprehensive API for data access and integration
- **📱 Mobile Dashboard**: Mobile-friendly web interface optimized for tablets
- **🔔 Smart Notifications**: Email and SMS alerts for battery levels
- **📧 Email Alerts**: Automatic email notifications at battery thresholds
- **📱 SMS Alerts**: Text message notifications via email-to-SMS
- **🚨 Smart Warnings**: Context-aware alerts (e.g., low battery + not charging)

## 📊 Dashboard Features

- **Battery Status**: Total battery level and individual pack monitoring
- **Power Flow**: Real-time DC/AC input and output power display
- **System Status**: Auto sleep mode, power settings, and system health
- **Raw Data**: Complete JSON data for debugging and integration
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Updates**: Data refreshes every 2 seconds automatically

## 🚀 Quick Start

### Prerequisites

- Raspberry Pi (Zero W, 3B+, 4B, or newer)
- Bluetti AC200M power station
- SD card with Raspberry Pi OS installed
- WiFi connection

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/yourusername/bluetti-monitor.git
   cd bluetti-monitor
   ```

2. **Configure environment variables**:

   ```bash
   # Copy the example environment file
   cp env.example .env
   
   # Edit the environment file with your settings
   nano .env
   ```

   **Required Environment Variables:**
   - `REACT_APP_API_BASE`: Your Raspberry Pi's IP address (e.g., `http://192.168.1.145:8083`)
   - `BLUETTI_MAC`: Your Bluetti device's MAC address
   - `BLUETTI_MODEL`: Your Bluetti model (e.g., `AC200MAX`)

   **Optional Environment Variables:**
   - Email/SMS notification settings (see `env.example` for details)

3. **Run the setup script**:

   ```bash
   chmod +x pi-setup.sh
   ./pi-setup.sh
   ```

3. **Access the dashboard**:
   - Open your browser and go to: `http://your-pi-ip:8082/dashboard`
   - Example: `http://192.168.1.145:8082/dashboard`

## 🔧 System Components

### Core Files

- `simple_bluetti_dashboard.html` - Main dashboard interface
- `simple_bluetti_server.py` - HTTP server and MQTT bridge
- `start_bluetti_monitor.sh` - Startup script with process monitoring
- `bluetti-monitor.service` - Systemd service configuration
- `manage_bluetti_service.sh` - Service management script

### Service Management

```bash
# Check service status
./manage_bluetti_service.sh status

# View live logs
./manage_bluetti_service.sh logs

# Restart service
./manage_bluetti_service.sh restart

# Stop service
./manage_bluetti_service.sh stop

# Start service
./manage_bluetti_service.sh start
```

## 📡 Data Flow

1. **Bluetti AC200M** → Bluetooth → **bluetti-mqtt tool**
2. **bluetti-mqtt tool** → MQTT Broker → **HTTP Server**
3. **HTTP Server** → Dashboard (via HTTP requests)

## 🎨 Dashboard Sections

### Battery Status

- Total battery percentage and voltage
- Individual pack details (pack1, pack2, pack3)
- Pack-specific percentages and voltages

### Power Output

- DC output power and status
- AC output power and status
- Real-time power flow visualization

### Power Input

- DC input power and voltage
- AC input power
- Power generation monitoring

### System Status

- Auto sleep mode settings
- Power off status
- AC output mode
- Internal AC voltage

## 🔌 API Endpoints

### Basic Endpoints

- `GET /api/bluetti` - Returns current Bluetti data as JSON
- `GET /dashboard` - Serves the main dashboard interface

### Advanced API Endpoints (New!)

- `GET /api/bluetti/battery` - Get battery status only
- `GET /api/bluetti/power` - Get power status only
- `GET /api/bluetti/status` - Get device status and connection info
- `GET /api/health` - Health check endpoint
- `POST /api/notifications/test` - Test notification system
- `GET /api/notifications/config` - Get notification configuration
- `POST /api/notifications/config` - Update notification configuration

### Mobile Dashboard

- `GET /mobile_dashboard.html` - Mobile-friendly dashboard interface

## 📱 Mobile Support

The dashboard is fully responsive and works on:

- Desktop computers
- Tablets
- Mobile phones
- Any device with a web browser

## 🌐 Remote Access & Notifications

### API Server Setup

1. **Install the API server**:

   ```bash
   ./setup_api_server.sh
   ```

2. **Configure notifications** in `notification_config.json`

3. **Access from anywhere**:
   - API: `http://your-pi-ip:8083/api/bluetti`
   - Mobile Dashboard: `http://your-pi-ip:8083/mobile_dashboard.html`

### Smart Notifications

The system automatically sends alerts when battery reaches:

- **100%** - "Battery FULL!"
- **50%** - "Battery at 50%"
- **30%** - "Battery at 30%" (with charging status warning)
- **15%** - "Battery at 15%" (WARNING: Low battery!)
- **10%** - "Battery at 10%" (CRITICAL: Very low battery!)
- **5%** - "Battery at 5%" (CRITICAL: Extremely low battery!)

### Notification Methods

- **Email**: Gmail, Outlook, Yahoo, or custom SMTP
- **SMS**: Email-to-SMS (free) or Twilio (paid)
- **Smart Alerts**: Only warn about charging if power input is 0W

### Quick Setup

1. **Run the setup script**: `./setup_api_server.sh`
2. **Configure notifications**: `./setup_twilio.sh` (for SMS)
3. **Edit your `.env` file** with your credentials
4. **Test notifications**: Use the API test endpoints

## 🛠️ Troubleshooting

### Service Not Starting

```bash
# Check service status
sudo systemctl status bluetti-monitor.service

# View service logs
sudo journalctl -u bluetti-monitor.service -f
```

### Bluetooth Issues

```bash
# Enable Bluetooth
sudo systemctl enable bluetti
sudo systemctl start bluetti

# Check Bluetooth status
sudo systemctl status bluetti
```

### MQTT Issues

```bash
# Check MQTT broker
sudo systemctl status mosquitto

# Restart MQTT broker
sudo systemctl restart mosquitto
```

## 📋 Requirements

### Hardware

- Raspberry Pi (Zero W, 3B+, 4B, or newer)
- Bluetti AC200M power station
- SD card (8GB minimum)

### Software

- Raspberry Pi OS
- Python 3.7+
- Node.js 16+ (for React development)
- MQTT broker (Mosquitto)

## 🔒 Security Notes

- The dashboard is designed for local network use
- No authentication is implemented (suitable for home networks)
- For production use, consider adding authentication and HTTPS

## 📝 Configuration

### Bluetti Device

- Update the MAC address in `start_bluetti_monitor.sh`
- Default: `00:15:83:82:0B:B1`

### Network Settings

- Update IP addresses in service files if needed
- Default port: 8082

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [bluetti_mqtt](https://github.com/warhammerkid/bluetti_mqtt) - For the MQTT integration
- Raspberry Pi Foundation - For the amazing hardware platform
- Bluetti - For the excellent power station

## 📞 Support

If you encounter any issues:

1. Check the troubleshooting section
2. Review the service logs
3. Open an issue on GitHub
4. Include your Raspberry Pi model and OS version

---

**Happy Monitoring! 🔋⚡**
