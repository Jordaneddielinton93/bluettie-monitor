#!/usr/bin/env python3
"""
Bluetti Monitor API Server
Provides REST API endpoints and notification system
"""

import json
import time
import smtplib
import requests
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Flask, jsonify, request
from flask_cors import CORS
import paho.mqtt.client as mqtt
import threading
import logging
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configuration
app = Flask(__name__)
CORS(app)

# MQTT Configuration
MQTT_BROKER_HOST = "127.0.0.1"
MQTT_BROKER_PORT = 1883

# Notification Configuration from Environment Variables
NOTIFICATION_CONFIG = {
    "email": {
        "enabled": os.getenv("EMAIL_ENABLED", "false").lower() == "true",
        "smtp_server": os.getenv("SMTP_SERVER", "smtp.gmail.com"),
        "smtp_port": int(os.getenv("SMTP_PORT", "587")),
        "username": os.getenv("EMAIL_USERNAME", ""),
        "password": os.getenv("EMAIL_PASSWORD", ""),
        "from_email": os.getenv("EMAIL_FROM", ""),
        "to_email": os.getenv("EMAIL_TO", "")
    },
    "sms": {
        "enabled": os.getenv("SMS_ENABLED", "false").lower() == "true",
        "provider": os.getenv("SMS_PROVIDER", "email_sms"),
        "twilio_account_sid": os.getenv("TWILIO_ACCOUNT_SID", ""),
        "twilio_auth_token": os.getenv("TWILIO_AUTH_TOKEN", ""),
        "twilio_phone_number": os.getenv("TWILIO_PHONE_NUMBER", ""),
        "to_phone_number": os.getenv("TO_PHONE_NUMBER", "")
    }
}

# Battery level thresholds
BATTERY_THRESHOLDS = [100, 50, 40, 39, 38, 37, 30, 15, 10, 5]
NOTIFICATION_COOLDOWN = 300  # 5 minutes between notifications for same level

# Global data storage
latest_bluetti_data = {}
device_id = None
last_notifications = {}

# Logging setup
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MQTTHandler:
    def __init__(self):
        self.client = mqtt.Client()
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message
        self.client.connect(MQTT_BROKER_HOST, MQTT_BROKER_PORT, 60)
        self.client.loop_start()
        logger.info(f"Connected to MQTT broker at {MQTT_BROKER_HOST}:{MQTT_BROKER_PORT}")

    def _on_connect(self, client, userdata, flags, rc):
        logger.info(f"MQTT Connected with result code {rc}")
        client.subscribe("bluetti/state/#")

    def _on_message(self, client, userdata, msg):
        global latest_bluetti_data, device_id
        topic_parts = msg.topic.split('/')
        
        if len(topic_parts) >= 4 and topic_parts[0] == 'bluetti' and topic_parts[1] == 'state':
            if device_id is None:
                device_id = topic_parts[2]
                logger.info(f"Discovered Bluetti Device ID: {device_id}")

            key = topic_parts[-1]
            try:
                value = json.loads(msg.payload.decode())
            except json.JSONDecodeError:
                value = msg.payload.decode()
            
            latest_bluetti_data[key] = value
            
            # Check for battery level notifications
            if key == 'total_battery_percent':
                self._check_battery_notifications(value)

    def _check_battery_notifications(self, battery_percent):
        """Check if we should send battery level notifications"""
        try:
            battery_percent = int(battery_percent)
            
            # Check each threshold
            for threshold in BATTERY_THRESHOLDS:
                if battery_percent == threshold:
                    # Check if we've already notified for this level recently
                    now = time.time()
                    if threshold in last_notifications:
                        if now - last_notifications[threshold] < NOTIFICATION_COOLDOWN:
                            continue
                    
                    # Send notification
                    self._send_battery_notification(battery_percent, threshold)
                    last_notifications[threshold] = now
                    break
                    
        except (ValueError, TypeError):
            logger.warning(f"Invalid battery percentage: {battery_percent}")

    def _send_battery_notification(self, battery_percent, threshold):
        """Send battery level notification"""
        try:
            # Get current power input status
            power_input = latest_bluetti_data.get('dc_input_power', '0')
            ac_input = latest_bluetti_data.get('ac_input_power', '0')
            
            # Create message
            message = self._create_battery_message(battery_percent, threshold, power_input, ac_input)
            
            # Send email notification
            if NOTIFICATION_CONFIG["email"]["enabled"]:
                self._send_email_notification(message, battery_percent)
            
            # Send SMS notification
            if NOTIFICATION_CONFIG["sms"]["enabled"]:
                self._send_sms_notification(message)
                
            logger.info(f"Sent battery notification for {battery_percent}%")
            
        except Exception as e:
            logger.error(f"Error sending battery notification: {e}")

    def _create_battery_message(self, battery_percent, threshold, power_input, ac_input):
        """Create battery notification message"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        if threshold == 100:
            return f"🔋 Bluetti AC200M - Battery FULL! ({battery_percent}%) - {timestamp}"
        elif threshold == 50:
            return f"🔋 Bluetti AC200M - Battery at 50% ({battery_percent}%) - {timestamp}"
        elif threshold == 30:
            if power_input == '0' and ac_input == '0':
                return f"⚠️ Bluetti AC200M - Battery at 30% ({battery_percent}%) - WARNING: Not charging! Consider plugging in soon. - {timestamp}"
            else:
                return f"🔋 Bluetti AC200M - Battery at 30% ({battery_percent}%) - Currently charging - {timestamp}"
        elif threshold == 15:
            return f"⚠️ Bluetti AC200M - Battery at 15% ({battery_percent}%) - WARNING: Low battery! - {timestamp}"
        elif threshold == 10:
            return f"🚨 Bluetti AC200M - Battery at 10% ({battery_percent}%) - CRITICAL: Very low battery! - {timestamp}"
        elif threshold == 5:
            return f"🚨 Bluetti AC200M - Battery at 5% ({battery_percent}%) - CRITICAL: Extremely low battery! - {timestamp}"
        else:
            return f"🔋 Bluetti AC200M - Battery at {battery_percent}% - {timestamp}"

    def _send_email_notification(self, message, battery_percent):
        """Send email notification"""
        try:
            config = NOTIFICATION_CONFIG["email"]
            
            # Split email addresses if multiple are provided
            email_addresses = [email.strip() for email in config["to_email"].split(',')]
            
            server = smtplib.SMTP(config["smtp_server"], config["smtp_port"])
            server.starttls()
            server.login(config["username"], config["password"])
            
            # Send to each email address separately
            for email_address in email_addresses:
                msg = MimeMultipart()
                msg['From'] = config["from_email"]
                msg['To'] = email_address
                msg['Subject'] = f"🔋 {battery_percent}% - Bluetti AC200M Battery Alert"
                
                msg.attach(MimeText(message, 'plain'))
                
                text = msg.as_string()
                server.sendmail(config["from_email"], email_address, text)
                logger.info(f"Email notification sent to {email_address}")
            
            server.quit()
            logger.info("Email notifications sent successfully to all recipients")
            
        except Exception as e:
            logger.error(f"Error sending email notification: {e}")

    def _send_sms_notification(self, message):
        """Send SMS notification"""
        try:
            config = NOTIFICATION_CONFIG["sms"]
            
            if config["provider"] == "twilio":
                # Twilio SMS (requires Twilio account)
                from twilio.rest import Client
                client = Client(config["twilio_account_sid"], config["twilio_auth_token"])
                message = client.messages.create(
                    body=message,
                    from_=config["twilio_phone_number"],
                    to=config["to_phone_number"]
                )
                logger.info("SMS notification sent successfully via Twilio")
                
            elif config["provider"] == "email_sms":
                # Email-to-SMS (carrier specific)
                self._send_email_notification(message, "SMS")
                
        except Exception as e:
            logger.error(f"Error sending SMS notification: {e}")

# API Routes
@app.route('/api/bluetti', methods=['GET'])
def get_bluetti_data():
    """Get current Bluetti data"""
    return jsonify(latest_bluetti_data)

@app.route('/api/bluetti/battery', methods=['GET'])
def get_battery_status():
    """Get battery status only"""
    battery_data = {
        'total_battery_percent': latest_bluetti_data.get('total_battery_percent', 'N/A'),
        'total_battery_voltage': latest_bluetti_data.get('total_battery_voltage', 'N/A'),
        'dc_input_power': latest_bluetti_data.get('dc_input_power', 'N/A'),
        'ac_input_power': latest_bluetti_data.get('ac_input_power', 'N/A'),
        'last_updated': datetime.now().isoformat()
    }
    return jsonify(battery_data)

@app.route('/api/bluetti/power', methods=['GET'])
def get_power_status():
    """Get power status only"""
    power_data = {
        'ac_output_power': latest_bluetti_data.get('ac_output_power', 'N/A'),
        'dc_output_power': latest_bluetti_data.get('dc_output_power', 'N/A'),
        'ac_input_power': latest_bluetti_data.get('ac_input_power', 'N/A'),
        'dc_input_power': latest_bluetti_data.get('dc_input_power', 'N/A'),
        'power_generation': latest_bluetti_data.get('power_generation', 'N/A'),
        'last_updated': datetime.now().isoformat()
    }
    return jsonify(power_data)

@app.route('/api/bluetti/status', methods=['GET'])
def get_device_status():
    """Get device status and connection info"""
    status_data = {
        'device_id': device_id,
        'connected': len(latest_bluetti_data) > 0,
        'last_updated': datetime.now().isoformat(),
        'data_fields': list(latest_bluetti_data.keys())
    }
    return jsonify(status_data)

@app.route('/api/notifications/test', methods=['POST'])
def test_notifications():
    """Test notification system"""
    try:
        data = request.get_json()
        test_level = data.get('battery_level', 50)
        
        # Create test message
        message = f"🧪 TEST: Bluetti Battery Alert - {test_level}% - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        
        # Send test notifications
        if NOTIFICATION_CONFIG["email"]["enabled"]:
            mqtt_handler._send_email_notification(message, test_level)
        
        if NOTIFICATION_CONFIG["sms"]["enabled"]:
            mqtt_handler._send_sms_notification(message)
        
        return jsonify({'success': True, 'message': 'Test notifications sent'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/notifications/config', methods=['GET', 'POST'])
def notification_config():
    """Get or update notification configuration"""
    if request.method == 'GET':
        return jsonify(NOTIFICATION_CONFIG)
    
    elif request.method == 'POST':
        try:
            data = request.get_json()
            NOTIFICATION_CONFIG.update(data)
            return jsonify({'success': True, 'message': 'Configuration updated'})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'mqtt_connected': True,
        'data_available': len(latest_bluetti_data) > 0
    })

if __name__ == "__main__":
    # Start MQTT handler
    mqtt_handler = MQTTHandler()
    
    # Start Flask app
    logger.info("Starting Bluetti Monitor API Server...")
    app.run(host='0.0.0.0', port=8083, debug=False)
