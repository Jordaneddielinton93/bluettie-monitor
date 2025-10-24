# Bluetti Monitor API & Notification System

## 🚀 Overview

This API server provides REST endpoints for accessing your Bluetti data remotely and sends automatic notifications based on battery levels. Perfect for monitoring your power station from anywhere!

## 📱 Features

- **REST API Endpoints** - Access data from any device
- **Mobile-Friendly Dashboard** - Responsive web interface
- **Email Notifications** - Battery level alerts via email
- **SMS Notifications** - Text message alerts
- **Smart Alerts** - Only notify when conditions are met
- **Remote Access** - Monitor from anywhere with internet

## 🔧 Installation

1. **Run the setup script:**
   ```bash
   chmod +x setup_api_server.sh
   ./setup_api_server.sh
   ```

2. **Configure notifications** (edit `notification_config.json`):
   ```json
   {
     "email": {
       "enabled": true,
       "smtp_server": "smtp.gmail.com",
       "smtp_port": 587,
       "username": "your_email@gmail.com",
       "password": "your_app_password",
       "from_email": "your_email@gmail.com",
       "to_email": "your_phone_number@carrier.com"
     }
   }
   ```

3. **Start the API server:**
   ```bash
   sudo systemctl start bluetti-api
   ```

## 🌐 API Endpoints

### Get All Data
```
GET http://your-pi-ip:8083/api/bluetti
```

### Get Battery Status Only
```
GET http://your-pi-ip:8083/api/bluetti/battery
```

### Get Power Status Only
```
GET http://your-pi-ip:8083/api/bluetti/power
```

### Get Device Status
```
GET http://your-pi-ip:8083/api/bluetti/status
```

### Health Check
```
GET http://your-pi-ip:8083/api/health
```

### Test Notifications
```
POST http://your-pi-ip:8083/api/notifications/test
Content-Type: application/json

{
  "battery_level": 50
}
```

## 📱 Mobile Dashboard

Access the mobile-friendly dashboard at:
```
http://your-pi-ip:8083/mobile_dashboard.html
```

## 🔔 Notification System

### Battery Level Alerts

The system automatically sends notifications when the battery reaches these levels:
- **100%** - "Battery FULL!"
- **50%** - "Battery at 50%"
- **30%** - "Battery at 30%" (with charging status warning)
- **15%** - "Battery at 15%" (WARNING: Low battery!)
- **10%** - "Battery at 10%" (CRITICAL: Very low battery!)
- **5%** - "Battery at 5%" (CRITICAL: Extremely low battery!)

### Smart Alerts

- **30% Alert**: Only warns about charging if power input is 0W
- **Cooldown Period**: 5 minutes between notifications for the same level
- **Charging Status**: Shows if the device is currently charging

## 📧 Email Setup

### Gmail Setup
1. Enable 2-factor authentication
2. Generate an App Password
3. Use your email and app password in the config

### Other Email Providers
- **Outlook**: `smtp-mail.outlook.com:587`
- **Yahoo**: `smtp.mail.yahoo.com:587`
- **Custom SMTP**: Update server and port in config

## 📱 SMS Setup

### Option 1: Email-to-SMS (Free)
Use your carrier's email gateway:
- **Verizon**: `your_phone_number@vtext.com`
- **AT&T**: `your_phone_number@txt.att.net`
- **T-Mobile**: `your_phone_number@tmomail.net`
- **Sprint**: `your_phone_number@messaging.sprintpcs.com`

### Option 2: Twilio (Paid)
1. Create a Twilio account
2. Get your Account SID and Auth Token
3. Purchase a phone number
4. Update the config with your Twilio details

## 🔧 Configuration

### Notification Config (`notification_config.json`)
```json
{
  "email": {
    "enabled": true,
    "smtp_server": "smtp.gmail.com",
    "smtp_port": 587,
    "username": "your_email@gmail.com",
    "password": "your_app_password",
    "from_email": "your_email@gmail.com",
    "to_email": "your_phone_number@carrier.com"
  },
  "sms": {
    "enabled": true,
    "provider": "email_sms",
    "to_phone_number": "your_phone_number"
  },
  "battery_thresholds": [100, 50, 30, 15, 10, 5],
  "notification_cooldown": 300
}
```

## 🚀 Usage Examples

### Check Battery Status from Phone
```bash
curl http://your-pi-ip:8083/api/bluetti/battery
```

### Test Notifications
```bash
curl -X POST http://your-pi-ip:8083/api/notifications/test \
  -H "Content-Type: application/json" \
  -d '{"battery_level": 50}'
```

### Mobile Dashboard
Open in your phone's browser:
```
http://your-pi-ip:8083/mobile_dashboard.html
```

## 🔍 Troubleshooting

### Check API Server Status
```bash
sudo systemctl status bluetti-api
```

### View API Server Logs
```bash
sudo journalctl -u bluetti-api -f
```

### Test API Endpoints
```bash
curl http://your-pi-ip:8083/api/health
```

### Check Notification Config
```bash
curl http://your-pi-ip:8083/api/notifications/config
```

## 📊 Data Format

### Battery Status Response
```json
{
  "total_battery_percent": "47",
  "total_battery_voltage": "53.18",
  "dc_input_power": "0",
  "ac_input_power": "0",
  "last_updated": "2025-10-24T02:30:00"
}
```

### Power Status Response
```json
{
  "ac_output_power": "0",
  "dc_output_power": "28",
  "ac_input_power": "0",
  "dc_input_power": "0",
  "power_generation": "0",
  "last_updated": "2025-10-24T02:30:00"
}
```

## 🔒 Security Notes

- The API server runs on port 8083
- No authentication is implemented (suitable for local network)
- For internet access, consider adding authentication
- Use HTTPS in production environments

## 🎯 Next Steps

1. **Configure your email/SMS settings**
2. **Test the notification system**
3. **Access the mobile dashboard from your phone**
4. **Set up port forwarding** (if accessing from outside your network)
5. **Consider adding authentication** for internet access

## 📞 Support

If you encounter issues:
1. Check the API server logs
2. Verify your notification configuration
3. Test the API endpoints manually
4. Ensure your Pi has internet access for email/SMS

---

**Enjoy monitoring your Bluetti power station from anywhere!** 🔋📱
