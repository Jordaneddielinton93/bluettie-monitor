# Bluetti AC200M Monitor

A real-time monitoring dashboard for Bluetti AC200M power stations running on Raspberry Pi with automatic startup and beautiful web interface.

## 🎯 Features

- **Real-time Monitoring**: Live data from your Bluetti AC200M power station
- **Beautiful Dashboard**: Modern, responsive web interface with glass-morphism design
- **Auto-Start**: Automatically starts on Raspberry Pi boot with systemd service
- **Auto-Restart**: Automatically restarts if the service crashes
- **Battery Pack Details**: Individual monitoring of all battery packs (pack1, pack2, pack3)
- **Power Monitoring**: DC/AC input and output power tracking
- **System Status**: Complete system status monitoring
- **MQTT Integration**: Uses bluetti-mqtt tool for Bluetooth communication
- **HTTP API**: Simple REST API for data access

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

2. **Run the setup script**:
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

- `GET /api/bluetti` - Returns current Bluetti data as JSON
- `GET /dashboard` - Serves the main dashboard interface

## 📱 Mobile Support

The dashboard is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- Any device with a web browser

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
