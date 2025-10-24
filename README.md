# Bluetti Pi Monitor

A Raspberry Pi Zero W monitoring system for Bluetti power stations that displays real-time data through a React-based web dashboard.

## Architecture

- **Raspberry Pi Zero W**: Runs bluetti_mqtt Python script, Mosquitto MQTT broker, and Node.js backend
- **React/Vite Frontend**: Real-time dashboard displaying battery status, power I/O, and device state
- **Communication**: Bluetooth → bluetti_mqtt → MQTT → WebSocket/REST API → React UI

## Features

- Real-time monitoring of battery level, power input/output, and device status
- Clean, mobile-responsive web interface
- WebSocket-based live data updates
- MQTT integration for reliable data transmission
- Auto-reconnection and error handling

## Quick Start

### Prerequisites

- Raspberry Pi Zero W (or any Raspberry Pi)
- SD card with Raspberry Pi OS Lite
- Bluetti power station with Bluetooth capability
- Basic familiarity with SSH and terminal commands

### 1. Initial Pi Setup

1. Flash Raspberry Pi OS Lite to your SD card
2. Enable SSH and configure WiFi before first boot:

   ```bash
   # Create 'ssh' file in boot partition
   touch /path/to/boot/ssh

   # Create 'wpa_supplicant.conf' in boot partition
   echo "country=US
   ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
   update_config=1

   network={
       ssid=\"YOUR_WIFI_SSID\"
       psk=\"YOUR_WIFI_PASSWORD\"
   }" > /path/to/boot/wpa_supplicant.conf
   ```

3. Insert SD card and power on the Pi
4. SSH into your Pi: `ssh pi@<pi-ip-address>`

### 2. Automated Setup

Run the setup script on your Raspberry Pi:

```bash
# Download and run the setup script
curl -fsSL https://raw.githubusercontent.com/your-username/bluetti-pi-monitor/main/pi-setup.sh | bash
```

Or manually run the setup script:

```bash
chmod +x pi-setup.sh
./pi-setup.sh
```

### 3. Deploy Application

1. Clone this repository to your Pi:

   ```bash
   cd /opt/bluetti-monitor
   git clone https://github.com/your-username/bluetti-pi-monitor.git .
   ```

2. Install Node.js dependencies:

   ```bash
   npm install
   ```

3. Build the React application:

   ```bash
   npm run build
   ```

4. Copy environment configuration:
   ```bash
   cp env.example .env
   # Edit .env with your device MAC address and settings
   ```

### 4. Find Your Bluetti Device

Discover your Bluetti device's MAC address:

```bash
bluetti-mqtt --scan
```

Example output:

```
Found AC3001234567890123: address 00:11:22:33:44:55
```

### 5. Configure and Start Services

1. Update the device MAC address in the service file:

   ```bash
   sudo nano /etc/systemd/system/bluetti-mqtt.service
   # Replace 00:11:22:33:44:55 with your device's MAC address
   ```

2. Start the services:

   ```bash
   sudo systemctl start bluetti-mqtt
   sudo systemctl start bluetti-monitor
   sudo systemctl enable bluetti-mqtt
   sudo systemctl enable bluetti-monitor
   ```

3. Check service status:
   ```bash
   sudo systemctl status bluetti-mqtt
   sudo systemctl status bluetti-monitor
   ```

### 6. Access the Dashboard

Open your web browser and navigate to:

```
http://<pi-ip-address>:8082
```

## Development

### Local Development Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/bluetti-pi-monitor.git
   cd bluetti-pi-monitor
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy environment configuration:

   ```bash
   cp env.example .env
   ```

4. Start development servers:
   ```bash
   npm run dev
   ```

This will start:

- Backend server on `http://localhost:8082`
- React development server on `http://localhost:5173`

### Testing with MQTT Broker

For local testing, you can run a local MQTT broker:

```bash
# Install Mosquitto locally (macOS)
brew install mosquitto

# Start Mosquitto
mosquitto -c /opt/homebrew/etc/mosquitto/mosquitto.conf
```

Or use a cloud MQTT broker for testing by updating the `.env` file.

## Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# MQTT Configuration
MQTT_BROKER_HOST=localhost
MQTT_BROKER_PORT=1883
MQTT_USERNAME=
MQTT_PASSWORD=

# Bluetti Device Configuration
BLUETTI_DEVICE_MAC=00:11:22:33:44:55
BLUETTI_DEVICE_NAME=AC300

# Server Configuration
PORT=8082
NODE_ENV=production
```

### MQTT Topics

The system uses the following MQTT topic structure:

- State topics: `bluetti/state/[DEVICE_NAME]/[PROPERTY]`
- Command topics: `bluetti/command/[DEVICE_NAME]/[PROPERTY]`

Example state topics:

- `bluetti/state/AC300/battery_percentage`
- `bluetti/state/AC300/ac_input_power`
- `bluetti/state/AC300/charging_status`

## Troubleshooting

### Common Issues

1. **Device not found during scan**:

   - Ensure your Bluetti device is powered on and in range
   - Try running the scan command multiple times
   - Check that Bluetooth is enabled on your Pi

2. **WebSocket connection errors**:

   - Verify the backend server is running: `sudo systemctl status bluetti-monitor`
   - Check firewall settings on port 8082
   - Ensure MQTT broker is running: `sudo systemctl status mosquitto`

3. **No data appearing on dashboard**:
   - Check bluetti_mqtt service: `sudo systemctl status bluetti-mqtt`
   - View logs: `sudo journalctl -u bluetti-mqtt -f`
   - Verify device MAC address is correct

### Logs

View service logs:

```bash
# Bluetti MQTT service logs
sudo journalctl -u bluetti-mqtt -f

# Web server logs
sudo journalctl -u bluetti-monitor -f

# Mosquitto logs
sudo tail -f /var/log/mosquitto/mosquitto.log
```

### Service Management

```bash
# Restart services
sudo systemctl restart bluetti-mqtt
sudo systemctl restart bluetti-monitor

# Stop services
sudo systemctl stop bluetti-mqtt
sudo systemctl stop bluetti-monitor

# Disable auto-start
sudo systemctl disable bluetti-mqtt
sudo systemctl disable bluetti-monitor
```

## Hardware Requirements

- **Raspberry Pi Zero W** (recommended) or any Raspberry Pi model
- **MicroSD card** (8GB minimum, 32GB recommended)
- **Power supply** for the Pi
- **Bluetti power station** with Bluetooth capability

## Software Dependencies

- **Raspberry Pi OS Lite** (or any Linux distribution)
- **Python 3.7+**
- **Node.js 18+**
- **Mosquitto MQTT broker**
- **bluetti_mqtt** Python package

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [bluetti_mqtt](https://github.com/warhammerkid/bluetti_mqtt) - The excellent MQTT interface for Bluetti devices
- [React](https://reactjs.org/) - Frontend framework
- [Vite](https://vitejs.dev/) - Build tool and development server
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework for styling
