#!/usr/bin/env python3
"""
MQTT Notification Handler
Listens to MQTT messages and sends notifications directly
"""

import json
import time
import smtplib
import os
import paho.mqtt.client as mqtt
import logging
from datetime import datetime
from dotenv import load_dotenv
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Notification Configuration
NOTIFICATION_CONFIG = {
    "email": {
        "enabled": os.getenv("EMAIL_ENABLED", "false").lower() == "true",
        "smtp_server": os.getenv("SMTP_SERVER", "smtp.gmail.com"),
        "smtp_port": int(os.getenv("SMTP_PORT", "587")),
        "username": os.getenv("EMAIL_USERNAME", ""),
        "password": os.getenv("EMAIL_PASSWORD", ""),
        "from_email": os.getenv("EMAIL_FROM", ""),
        "to_email": os.getenv("EMAIL_TO", "")
    }
}

# Battery level thresholds
BATTERY_THRESHOLDS = [100, 50, 40, 39, 38, 37, 30, 15, 10, 5]
NOTIFICATION_COOLDOWN = 300  # 5 minutes between notifications for same level

# Track last notification times
last_notification_times = {}

class MQTTNotificationHandler:
    def __init__(self):
        self.client = mqtt.Client()
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message
        self.client.connect("127.0.0.1", 1883, 60)
        self.client.loop_start()
        logger.info("Connected to MQTT broker")

    def _on_connect(self, client, userdata, flags, rc):
        logger.info(f"MQTT Connected with result code {rc}")
        client.subscribe("bluetti/state/#")

    def _on_message(self, client, userdata, msg):
        topic_parts = msg.topic.split('/')
        
        if len(topic_parts) >= 4 and topic_parts[0] == 'bluetti' and topic_parts[1] == 'state':
            key = topic_parts[-1]
            try:
                value = json.loads(msg.payload.decode())
            except json.JSONDecodeError:
                value = msg.payload.decode()
            
            logger.info(f"MQTT Update: {key} = {value}")
            
            # Check for battery level notifications
            if key == 'total_battery_percent':
                self._check_battery_notifications(value)

    def _check_battery_notifications(self, battery_percent):
        """Check if we should send battery level notifications"""
        try:
            battery_percent = int(battery_percent)
        except (ValueError, TypeError):
            logger.warning(f"Invalid battery percent value: {battery_percent}")
            return

        # Check if this battery level should trigger a notification
        if battery_percent in BATTERY_THRESHOLDS:
            current_time = time.time()
            last_notification_time = last_notification_times.get(battery_percent, 0)
            
            # Check if enough time has passed since last notification for this level
            if current_time - last_notification_time >= NOTIFICATION_COOLDOWN:
                logger.info(f"Battery threshold reached: {battery_percent}% - Sending notification")
                self._send_battery_notification(battery_percent)
                last_notification_times[battery_percent] = current_time
            else:
                logger.info(f"Battery threshold {battery_percent}% reached but notification cooldown active")

    def _send_battery_notification(self, battery_percent):
        """Send battery level notification"""
        try:
            if NOTIFICATION_CONFIG["email"]["enabled"]:
                message = self._create_battery_message(battery_percent)
                subject_prefix = f"🔋 {battery_percent}%"
                self._send_email_notification(message, subject_prefix)
                logger.info(f"Battery notification sent for {battery_percent}%")
            else:
                logger.warning("Email notifications are disabled")
        except Exception as e:
            logger.error(f"Error sending battery notification: {e}")

    def _create_battery_message(self, battery_percent):
        """Create battery notification message"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        if battery_percent >= 50:
            status = "Good"
        elif battery_percent >= 30:
            status = "Low"
        elif battery_percent >= 15:
            status = "Critical"
        else:
            status = "Very Critical"
        
        return f"""
🔋 Bluetti AC200M Battery Alert

Battery Level: {battery_percent}%
Status: {status}

This is an automated alert to notify you about your Bluetti AC200M battery level.

Time: {timestamp}

Please check your Bluetti device and consider charging if necessary.
"""

    def _send_email_notification(self, message, subject_prefix):
        """Send email notification"""
        try:
            config = NOTIFICATION_CONFIG["email"]
            email_addresses = [email.strip() for email in config["to_email"].split(',')]
            
            server = smtplib.SMTP(config["smtp_server"], config["smtp_port"])
            server.starttls()
            server.login(config["username"], config["password"])
            
            for email_address in email_addresses:
                msg = MIMEMultipart()
                msg['From'] = config["from_email"]
                msg['To'] = email_address
                msg['Subject'] = f"{subject_prefix} - Bluetti AC200M Battery Alert"
                
                msg.attach(MIMEText(message, 'plain'))
                
                text = msg.as_string()
                server.sendmail(config["from_email"], email_address, text)
                logger.info(f"Email notification sent to {email_address}")
            
            server.quit()
            logger.info("Email notifications sent successfully to all recipients")
            
        except Exception as e:
            logger.error(f"Error sending email notification: {e}")

    def run(self):
        """Run the notification handler"""
        logger.info("Starting MQTT Notification Handler...")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            logger.info("Stopping MQTT Notification Handler...")
            self.client.loop_stop()
            self.client.disconnect()

if __name__ == "__main__":
    handler = MQTTNotificationHandler()
    handler.run()
