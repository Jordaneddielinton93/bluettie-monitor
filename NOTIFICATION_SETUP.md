# Notification Setup Guide

## 🔔 Setting Up Email and SMS Notifications

This guide will help you configure email and SMS notifications for your Bluetti monitor.

## 📧 Email Setup

### Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. **Use your email and app password** in the configuration

### Other Email Providers

- **Outlook**: `smtp-mail.outlook.com:587`
- **Yahoo**: `smtp.mail.yahoo.com:587`
- **Custom SMTP**: Update server and port in configuration

## 📱 SMS Setup

### Option 1: Twilio SMS (Recommended)

1. **Create a Twilio account** at [twilio.com](https://www.twilio.com)
2. **Get your credentials** from the Twilio Console
3. **Purchase a phone number**
4. **Configure environment variables**

### Option 2: Email-to-SMS (Free)

Use your carrier's email gateway to send SMS via email:

- **Verizon**: `@vtext.com`
- **AT&T**: `@txt.att.net`
- **T-Mobile**: `@tmomail.net`
- **Sprint**: `@messaging.sprintpcs.com`

## ⚙️ Configuration

### Step 1: Create Environment File

```bash
cp env.example .env
```

### Step 2: Configure Email

Edit your `.env` file:

```bash
# Email Configuration
EMAIL_ENABLED=true
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=your_email@gmail.com
EMAIL_TO=your_phone_number@carrier.com
```

### Step 3: Configure SMS

#### For Twilio:
```bash
# SMS Configuration
SMS_ENABLED=true
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
TO_PHONE_NUMBER=+1234567890
```

#### For Email-to-SMS:
```bash
# SMS Configuration
SMS_ENABLED=true
SMS_PROVIDER=email_sms
EMAIL_TO=your_phone_number@carrier.com
```

## 🧪 Testing

### Test Email Notifications

```bash
curl -X POST http://localhost:8083/api/notifications/test \
  -H "Content-Type: application/json" \
  -d '{"battery_level": 50}'
```

### Test SMS Notifications

```bash
curl -X POST http://localhost:8083/api/notifications/test \
  -H "Content-Type: application/json" \
  -d '{"battery_level": 50}'
```

### Check Configuration

```bash
curl http://localhost:8083/api/notifications/config
```

## 🔒 Security Best Practices

1. **Never commit your `.env` file** to version control
2. **Use app passwords** instead of your main password
3. **Keep your credentials secure**
4. **Regularly rotate your passwords**

## 🛠️ Troubleshooting

### Common Issues

1. **Email not sending**:
   - Check your SMTP settings
   - Verify your app password
   - Ensure 2FA is enabled

2. **SMS not sending**:
   - Check your Twilio credentials
   - Verify phone number format (+1234567890)
   - Ensure your Twilio account has credit

3. **Configuration not loading**:
   - Check your `.env` file syntax
   - Ensure the file is in the correct location
   - Restart the API server

### Debug Commands

```bash
# Check API server status
sudo systemctl status bluetti-api

# View API server logs
sudo journalctl -u bluetti-api -f

# Test API endpoints
curl http://localhost:8083/api/health
```

## 📋 Battery Alert Thresholds

The system automatically sends alerts when battery reaches:

- **100%** - "Battery FULL!"
- **50%** - "Battery at 50%"
- **30%** - "Battery at 30%" (with charging status warning)
- **15%** - "Battery at 15%" (WARNING: Low battery!)
- **10%** - "Battery at 10%" (CRITICAL: Very low battery!)
- **5%** - "Battery at 5%" (CRITICAL: Extremely low battery!)

## 🎯 Smart Alerts

The system includes smart logic:

- **30% Alert**: Only warns about charging if power input is 0W
- **Cooldown Period**: 5 minutes between notifications for the same level
- **Charging Status**: Shows if the device is currently charging

## 📞 Support

If you encounter issues:

1. **Check the troubleshooting section**
2. **Review the API server logs**
3. **Test your configuration**
4. **Open an issue on GitHub**

---

**Enjoy your smart Bluetti notifications!** 🔋📱
