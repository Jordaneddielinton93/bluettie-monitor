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
import sqlite3
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Flask, jsonify, request
from flask_cors import CORS
import paho.mqtt.client as mqtt
import threading
import logging
from datetime import datetime, timedelta
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

# Battery activity database path
BATTERY_DB_PATH = "/home/pi/bluetti-monitor/battery_activity.db"

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

# Battery Activity API Endpoints

@app.route('/api/activity/current', methods=['GET'])
def get_activity_current():
    """Get current battery status with time remaining"""
    try:
        if not latest_bluetti_data:
            return jsonify({'error': 'No data available'}), 503
        
        # Extract current data
        battery_percent = float(latest_bluetti_data.get('total_battery_percent', 0))
        battery_voltage = float(latest_bluetti_data.get('total_battery_voltage', 0))
        ac_output = float(latest_bluetti_data.get('ac_output_power', 0))
        dc_output = float(latest_bluetti_data.get('dc_output_power', 0))
        ac_input = float(latest_bluetti_data.get('ac_input_power', 0))
        dc_input = float(latest_bluetti_data.get('dc_input_power', 0))
        
        total_output = ac_output + dc_output
        total_capacity_wh = 6144  # AC200MAX + 2x B230
        remaining_wh = (battery_percent / 100) * total_capacity_wh
        time_remaining_hours = remaining_wh / total_output if total_output > 0 else float('inf')
        
        is_charging = ac_input > 0 or dc_input > 0
        
        # Format time remaining
        if time_remaining_hours == float('inf'):
            formatted_time = "∞"
        else:
            days = int(time_remaining_hours // 24)
            remaining_hours = int(time_remaining_hours % 24)
            minutes = int((time_remaining_hours % 1) * 60)
            
            if days > 0:
                formatted_time = f"{days}d {remaining_hours}h {minutes}m"
            elif remaining_hours > 0:
                formatted_time = f"{remaining_hours}h {minutes}m"
            else:
                formatted_time = f"{minutes}m"
        
        result = {
            'battery_percent': battery_percent,
            'battery_voltage': battery_voltage,
            'total_capacity_wh': total_capacity_wh,
            'remaining_capacity_wh': remaining_wh,
            'current_output_watts': total_output,
            'time_remaining': {
                'hours': time_remaining_hours,
                'days': time_remaining_hours / 24,
                'formatted': formatted_time
            },
            'is_charging': is_charging,
            'timestamp': datetime.now().isoformat()
        }
        
        # Check for active charging session
        if is_charging and os.path.exists(BATTERY_DB_PATH):
            try:
                with sqlite3.connect(BATTERY_DB_PATH) as conn:
                    cursor = conn.cursor()
                    cursor.execute('''
                        SELECT start_time, start_percent, charge_type
                        FROM charge_sessions 
                        WHERE end_time IS NULL 
                        ORDER BY start_time DESC 
                        LIMIT 1
                    ''')
                    session = cursor.fetchone()
                    
                    if session:
                        start_time = datetime.fromisoformat(session[0])
                        duration = (datetime.now() - start_time).total_seconds() / 60
                        result['current_session'] = {
                            'started_at': session[0],
                            'start_percent': session[1],
                            'duration_minutes': int(duration),
                            'charge_type': session[2]
                        }
            except Exception as e:
                logger.warning(f"Error checking current session: {e}")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error getting current activity: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/activity/history', methods=['GET'])
def get_activity_history():
    """Get battery history for last 7 days"""
    try:
        if not os.path.exists(BATTERY_DB_PATH):
            return jsonify({'error': 'Database not available'}), 503
        
        # Get query parameters
        limit = request.args.get('limit', 100, type=int)
        hours = request.args.get('hours', 24, type=int)
        
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        with sqlite3.connect(BATTERY_DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT timestamp, battery_percent, battery_voltage, 
                       ac_output_power, dc_output_power, total_output_power,
                       ac_input_power, dc_input_power, time_remaining_hours,
                       pack1_voltage, pack2_voltage, pack3_voltage
                FROM battery_snapshots 
                WHERE timestamp > ? 
                ORDER BY timestamp DESC 
                LIMIT ?
            ''', (cutoff_time.isoformat(), limit))
            
            rows = cursor.fetchall()
            
            history = []
            for row in rows:
                history.append({
                    'timestamp': row[0],
                    'battery_percent': row[1],
                    'battery_voltage': row[2],
                    'ac_output_power': row[3],
                    'dc_output_power': row[4],
                    'total_output_power': row[5],
                    'ac_input_power': row[6],
                    'dc_input_power': row[7],
                    'time_remaining_hours': row[8],
                    'pack1_voltage': row[9],
                    'pack2_voltage': row[10],
                    'pack3_voltage': row[11]
                })
            
            return jsonify({
                'history': history,
                'count': len(history),
                'period_hours': hours
            })
            
    except Exception as e:
        logger.error(f"Error getting activity history: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/activity/charge-sessions', methods=['GET'])
def get_charge_sessions():
    """Get recent charging sessions"""
    try:
        if not os.path.exists(BATTERY_DB_PATH):
            return jsonify({'error': 'Database not available'}), 503
        
        limit = request.args.get('limit', 20, type=int)
        days = request.args.get('days', 7, type=int)
        
        cutoff_time = datetime.now() - timedelta(days=days)
        
        with sqlite3.connect(BATTERY_DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT start_time, end_time, start_percent, end_percent,
                       duration_minutes, charge_type, avg_input_power
                FROM charge_sessions 
                WHERE start_time > ? 
                ORDER BY start_time DESC 
                LIMIT ?
            ''', (cutoff_time.isoformat(), limit))
            
            rows = cursor.fetchall()
            
            sessions = []
            for row in rows:
                sessions.append({
                    'start_time': row[0],
                    'end_time': row[1],
                    'start_percent': row[2],
                    'end_percent': row[3],
                    'duration_minutes': row[4],
                    'charge_type': row[5],
                    'avg_input_power': row[6],
                    'percent_gained': row[3] - row[2] if row[1] else None,
                    'completed': row[1] is not None
                })
            
            return jsonify({
                'sessions': sessions,
                'count': len(sessions),
                'period_days': days
            })
            
    except Exception as e:
        logger.error(f"Error getting charge sessions: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/activity/stats', methods=['GET'])
def get_activity_stats():
    """Get summary statistics"""
    try:
        if not os.path.exists(BATTERY_DB_PATH):
            return jsonify({'error': 'Database not available'}), 503
        
        days = request.args.get('days', 7, type=int)
        cutoff_time = datetime.now() - timedelta(days=days)
        
        with sqlite3.connect(BATTERY_DB_PATH) as conn:
            cursor = conn.cursor()
            
            # Get consumption stats
            cursor.execute('''
                SELECT AVG(total_output_power), MAX(total_output_power), 
                       COUNT(*) as snapshot_count
                FROM battery_snapshots 
                WHERE timestamp > ? AND total_output_power > 0
            ''', (cutoff_time.isoformat(),))
            
            consumption_stats = cursor.fetchone()
            
            # Get charging stats
            cursor.execute('''
                SELECT COUNT(*) as total_sessions,
                       AVG(duration_minutes) as avg_duration,
                       AVG(end_percent - start_percent) as avg_percent_gained,
                       SUM(duration_minutes) as total_charge_time
                FROM charge_sessions 
                WHERE start_time > ? AND end_time IS NOT NULL
            ''', (cutoff_time.isoformat(),))
            
            charging_stats = cursor.fetchone()
            
            return jsonify({
                'period_days': days,
                'consumption': {
                    'avg_power_watts': consumption_stats[0] or 0,
                    'max_power_watts': consumption_stats[1] or 0,
                    'snapshot_count': consumption_stats[2] or 0
                },
                'charging': {
                    'total_sessions': charging_stats[0] or 0,
                    'avg_duration_minutes': charging_stats[1] or 0,
                    'avg_percent_gained': charging_stats[2] or 0,
                    'total_charge_time_minutes': charging_stats[3] or 0
                }
            })
            
    except Exception as e:
        logger.error(f"Error getting activity stats: {e}")
        return jsonify({'error': str(e)}), 500

# Discharge Session API Endpoints
@app.route('/api/discharge/current', methods=['GET'])
def get_discharge_current():
    """Get current discharge status and predictions based on historical analysis"""
    try:
        if not os.path.exists(BATTERY_DB_PATH):
            return jsonify({'error': 'Database not available'}), 503
            
        with sqlite3.connect(BATTERY_DB_PATH) as conn:
            cursor = conn.cursor()
            
            # Get the most recent discharge session for current battery level
            cursor.execute('''
                SELECT battery_percent, timestamp
                FROM discharge_sessions 
                ORDER BY timestamp DESC 
                LIMIT 1
            ''')
            latest = cursor.fetchone()
            
            if not latest:
                return jsonify({
                    'data_available': False,
                    'message': 'No discharge data available yet'
                })
            
            current_battery, current_timestamp = latest
            
            # Calculate statistics from all sessions in the last 24 hours
            cursor.execute('''
                SELECT 
                    AVG(discharge_rate_percent_per_hour) as avg_discharge_rate,
                    AVG(avg_power_consumption) as avg_power,
                    COUNT(*) as session_count,
                    MIN(timestamp) as first_session,
                    MAX(timestamp) as last_session
                FROM discharge_sessions 
                WHERE timestamp >= datetime('now', '-24 hours')
            ''')
            stats = cursor.fetchone()
            
            if not stats or stats[2] == 0:  # session_count
                return jsonify({
                    'data_available': False,
                    'message': 'Insufficient data for analysis'
                })
            
            avg_discharge_rate, avg_power, session_count, first_session, last_session = stats
            
            # Calculate time-based discharge rate from battery level changes
            cursor.execute('''
                SELECT battery_percent, timestamp
                FROM discharge_sessions 
                WHERE timestamp >= datetime('now', '-24 hours')
                ORDER BY timestamp ASC
            ''')
            sessions = cursor.fetchall()
            
            # Calculate actual discharge rate from battery level changes
            if len(sessions) >= 2:
                first_battery = sessions[0][0]
                last_battery = sessions[-1][0]
                first_time = datetime.fromisoformat(sessions[0][1])
                last_time = datetime.fromisoformat(sessions[-1][1])
                
                time_diff_hours = (last_time - first_time).total_seconds() / 3600
                battery_diff = first_battery - last_battery
                
                if time_diff_hours > 0:
                    actual_discharge_rate = battery_diff / time_diff_hours
                else:
                    actual_discharge_rate = avg_discharge_rate or 0
            else:
                actual_discharge_rate = avg_discharge_rate or 0
            
            # Calculate estimated time remaining based on current battery and discharge rate
            if actual_discharge_rate > 0:
                estimated_hours_remaining = current_battery / actual_discharge_rate
                estimated_days_remaining = estimated_hours_remaining / 24
            else:
                estimated_hours_remaining = 0
                estimated_days_remaining = 0
            
            # Format time remaining
            if estimated_days_remaining >= 1:
                formatted_time_remaining = f"{int(estimated_days_remaining)}d {int(estimated_hours_remaining % 24)}h"
            elif estimated_hours_remaining >= 1:
                formatted_time_remaining = f"{int(estimated_hours_remaining)}h {int((estimated_hours_remaining % 1) * 60)}m"
            else:
                formatted_time_remaining = f"{int(estimated_hours_remaining * 60)}m"
            
            return jsonify({
                'data_available': True,
                'battery_percent': current_battery,
                'discharge_rate_percent_per_hour': round(actual_discharge_rate, 2),
                'estimated_hours_remaining': round(estimated_hours_remaining, 1),
                'estimated_days_remaining': round(estimated_days_remaining, 1),
                'avg_power_consumption': round(avg_power or 0, 1),
                'last_updated': current_timestamp,
                'formatted_time_remaining': formatted_time_remaining,
                'analysis_period_hours': 24,
                'sessions_analyzed': session_count
            })
            
    except Exception as e:
        logger.error(f"Error getting current discharge status: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/discharge/history', methods=['GET'])
def get_discharge_history():
    """Get discharge session history"""
    try:
        if not os.path.exists(BATTERY_DB_PATH):
            return jsonify({'error': 'Database not available'}), 503
            
        hours = request.args.get('hours', 24, type=int)
        limit = request.args.get('limit', 50, type=int)
        
        # Limit to reasonable values
        hours = min(hours, 168)  # Max 1 week
        limit = min(limit, 200)  # Max 200 records
        
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        with sqlite3.connect(BATTERY_DB_PATH) as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT timestamp, battery_percent, discharge_rate_percent_per_hour,
                       estimated_hours_remaining, estimated_days_remaining,
                       avg_power_consumption, total_output_power
                FROM discharge_sessions 
                WHERE timestamp >= ?
                ORDER BY timestamp DESC 
                LIMIT ?
            ''', (cutoff_time.isoformat(), limit))
            
            sessions = []
            for row in cursor.fetchall():
                timestamp, battery_percent, discharge_rate, est_hours, est_days, avg_power, total_power = row
                
                # Format time remaining
                if est_days >= 1:
                    formatted_time = f"{int(est_days)}d {int(est_hours % 24)}h"
                elif est_hours >= 1:
                    formatted_time = f"{int(est_hours)}h {int((est_hours % 1) * 60)}m"
                else:
                    formatted_time = f"{int(est_hours * 60)}m"
                
                sessions.append({
                    'timestamp': timestamp,
                    'battery_percent': battery_percent,
                    'discharge_rate_percent_per_hour': discharge_rate,
                    'estimated_hours_remaining': est_hours,
                    'estimated_days_remaining': est_days,
                    'formatted_time_remaining': formatted_time,
                    'avg_power_consumption': avg_power,
                    'total_output_power': total_power
                })
            
            return jsonify({
                'sessions': sessions,
                'count': len(sessions),
                'period_hours': hours
            })
            
    except Exception as e:
        logger.error(f"Error getting discharge history: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/discharge/stats', methods=['GET'])
def get_discharge_stats():
    """Get discharge statistics"""
    try:
        if not os.path.exists(BATTERY_DB_PATH):
            return jsonify({'error': 'Database not available'}), 503
            
        days = request.args.get('days', 7, type=int)
        days = min(days, 30)  # Max 30 days
        
        cutoff_time = datetime.now() - timedelta(days=days)
        
        with sqlite3.connect(BATTERY_DB_PATH) as conn:
            cursor = conn.cursor()
            
            # Get discharge statistics
            cursor.execute('''
                SELECT 
                    COUNT(*) as total_sessions,
                    AVG(discharge_rate_percent_per_hour) as avg_discharge_rate,
                    MIN(discharge_rate_percent_per_hour) as min_discharge_rate,
                    MAX(discharge_rate_percent_per_hour) as max_discharge_rate,
                    AVG(avg_power_consumption) as avg_power_consumption,
                    MIN(avg_power_consumption) as min_power_consumption,
                    MAX(avg_power_consumption) as max_power_consumption,
                    AVG(estimated_days_remaining) as avg_estimated_days
                FROM discharge_sessions 
                WHERE timestamp >= ? AND discharge_rate_percent_per_hour > 0
            ''', (cutoff_time.isoformat(),))
            
            stats = cursor.fetchone()
            
            if not stats or stats[0] == 0:
                return jsonify({
                    'period_days': days,
                    'total_sessions': 0,
                    'discharge_rate': {
                        'avg_percent_per_hour': 0,
                        'min_percent_per_hour': 0,
                        'max_percent_per_hour': 0
                    },
                    'power_consumption': {
                        'avg_watts': 0,
                        'min_watts': 0,
                        'max_watts': 0
                    },
                    'predictions': {
                        'avg_estimated_days': 0
                    }
                })
            
            total_sessions, avg_rate, min_rate, max_rate, avg_power, min_power, max_power, avg_est_days = stats
            
            return jsonify({
                'period_days': days,
                'total_sessions': total_sessions,
                'discharge_rate': {
                    'avg_percent_per_hour': round(avg_rate or 0, 2),
                    'min_percent_per_hour': round(min_rate or 0, 2),
                    'max_percent_per_hour': round(max_rate or 0, 2)
                },
                'power_consumption': {
                    'avg_watts': round(avg_power or 0, 1),
                    'min_watts': round(min_power or 0, 1),
                    'max_watts': round(max_power or 0, 1)
                },
                'predictions': {
                    'avg_estimated_days': round(avg_est_days or 0, 1)
                }
            })
            
    except Exception as e:
        logger.error(f"Error getting discharge stats: {e}")
        return jsonify({'error': str(e)}), 500

# Section Order Management API Endpoints
@app.route('/api/sections/order', methods=['GET'])
def get_section_order():
    """Get current section order and visibility settings"""
    try:
        with sqlite3.connect(BATTERY_DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT section_name, display_order, is_visible 
                FROM section_order 
                ORDER BY display_order
            ''')
            sections = []
            for row in cursor.fetchall():
                sections.append({
                    'name': row[0],
                    'order': row[1],
                    'visible': bool(row[2])
                })
            
            return jsonify({
                'sections': sections,
                'count': len(sections)
            })
            
    except Exception as e:
        logger.error(f"Error getting section order: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/sections/order', methods=['POST'])
def update_section_order():
    """Update section order and visibility settings"""
    try:
        data = request.get_json()
        if not data or 'sections' not in data:
            return jsonify({'error': 'Invalid request data'}), 400
        
        with sqlite3.connect(BATTERY_DB_PATH) as conn:
            cursor = conn.cursor()
            
            # Update each section's order and visibility
            for section in data['sections']:
                cursor.execute('''
                    UPDATE section_order 
                    SET display_order = ?, is_visible = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE section_name = ?
                ''', (section['order'], section['visible'], section['name']))
            
            conn.commit()
            
            return jsonify({
                'success': True,
                'message': 'Section order updated successfully'
            })
            
    except Exception as e:
        logger.error(f"Error updating section order: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/sections/reset', methods=['POST'])
def reset_section_order():
    """Reset section order to default"""
    try:
        with sqlite3.connect(BATTERY_DB_PATH) as conn:
            cursor = conn.cursor()
            
            # Reset to default order
            default_sections = [
                ('battery_status', 1, 1),
                ('power_flow', 2, 1),
                ('activity_log', 3, 1),
                ('discharge_analysis', 4, 1),
                ('raw_data', 5, 1)
            ]
            
            # Clear existing data
            cursor.execute('DELETE FROM section_order')
            
            # Insert default order
            cursor.executemany('''
                INSERT INTO section_order (section_name, display_order, is_visible)
                VALUES (?, ?, ?)
            ''', default_sections)
            
            conn.commit()
            
            return jsonify({
                'success': True,
                'message': 'Section order reset to default'
            })
            
    except Exception as e:
        logger.error(f"Error resetting section order: {e}")
        return jsonify({'error': str(e)}), 500

# Discharge Data Edit API Endpoints
@app.route('/api/discharge/edit', methods=['POST'])
def edit_discharge_data():
    """Edit discharge data manually"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        discharge_rate = data.get('discharge_rate_percent_per_hour')
        estimated_hours = data.get('estimated_hours_remaining')
        estimated_minutes = data.get('estimated_minutes_remaining')
        
        if discharge_rate is None or estimated_hours is None:
            return jsonify({'error': 'discharge_rate_percent_per_hour and estimated_hours_remaining are required'}), 400
        
        with sqlite3.connect(BATTERY_DB_PATH) as conn:
            cursor = conn.cursor()
            
            # Insert a new manual discharge session
            cursor.execute('''
                INSERT INTO discharge_sessions 
                (timestamp, battery_percent, battery_voltage, total_output_power, 
                 discharge_rate_percent_per_hour, estimated_hours_remaining, 
                 estimated_days_remaining, avg_power_consumption, session_type)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                datetime.now().isoformat(),
                100.0,  # Assume full battery for manual entry
                0.0,    # No voltage data for manual entry
                0.0,    # No power data for manual entry
                discharge_rate,
                estimated_hours,
                estimated_hours / 24,
                0.0,    # No power consumption data for manual entry
                'manual'
            ))
            
            conn.commit()
            
            return jsonify({
                'success': True,
                'message': 'Discharge data updated successfully',
                'data': {
                    'discharge_rate_percent_per_hour': discharge_rate,
                    'estimated_hours_remaining': estimated_hours,
                    'estimated_days_remaining': estimated_hours / 24
                }
            })
            
    except Exception as e:
        logger.error(f"Error editing discharge data: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/discharge/clear', methods=['POST'])
def clear_discharge_data():
    """Clear all discharge data"""
    try:
        with sqlite3.connect(BATTERY_DB_PATH) as conn:
            cursor = conn.cursor()
            
            # Clear all discharge sessions
            cursor.execute('DELETE FROM discharge_sessions')
            
            conn.commit()
            
            return jsonify({
                'success': True,
                'message': 'All discharge data cleared successfully'
            })
            
    except Exception as e:
        logger.error(f"Error clearing discharge data: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/discharge/interval', methods=['GET'])
def get_discharge_interval():
    """Get current discharge logging interval"""
    try:
        with sqlite3.connect(BATTERY_DB_PATH) as conn:
            cursor = conn.cursor()
            
            # Get the current interval setting
            cursor.execute('''
                SELECT setting_value FROM discharge_settings 
                WHERE setting_name = 'interval_minutes'
            ''')
            
            result = cursor.fetchone()
            interval = int(result[0]) if result else 10
            
            return jsonify({
                'interval_minutes': interval,
                'interval_label': f"{interval} minutes" if interval < 60 else f"{interval // 60} hour{'s' if interval // 60 > 1 else ''}"
            })
            
    except Exception as e:
        logger.error(f"Error getting discharge interval: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/discharge/interval', methods=['POST'])
def set_discharge_interval():
    """Set discharge logging interval"""
    try:
        data = request.get_json()
        if not data or 'interval_minutes' not in data:
            return jsonify({'error': 'interval_minutes is required'}), 400
        
        interval = int(data['interval_minutes'])
        if interval < 1 or interval > 1440:  # 1 minute to 24 hours
            return jsonify({'error': 'Interval must be between 1 and 1440 minutes'}), 400
        
        with sqlite3.connect(BATTERY_DB_PATH) as conn:
            cursor = conn.cursor()
            
            # Update or insert the interval setting
            cursor.execute('''
                INSERT OR REPLACE INTO discharge_settings (setting_name, setting_value, updated_at)
                VALUES ('interval_minutes', ?, CURRENT_TIMESTAMP)
            ''', (str(interval),))
            
            conn.commit()
            
            return jsonify({
                'success': True,
                'message': f'Discharge logging interval set to {interval} minutes',
                'interval_minutes': interval
            })
            
    except Exception as e:
        logger.error(f"Error setting discharge interval: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    # Start MQTT handler
    mqtt_handler = MQTTHandler()
    
    # Start Flask app
    logger.info("Starting Bluetti Monitor API Server...")
    app.run(host='0.0.0.0', port=8083, debug=False)
