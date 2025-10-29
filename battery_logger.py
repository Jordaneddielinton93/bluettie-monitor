#!/usr/bin/env python3
"""
Battery Activity Logger
Tracks battery usage, calculates time remaining, and logs charging sessions
"""

import sqlite3
import json
import time
import logging
import paho.mqtt.client as mqtt
from datetime import datetime, timedelta
import os
import threading

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuration
MQTT_BROKER_HOST = "127.0.0.1"
MQTT_BROKER_PORT = 1883
DB_PATH = "/home/pi/bluetti-monitor/battery_activity.db"
TOTAL_CAPACITY_WH = 6144  # AC200MAX (2048) + 2x B230 (2048 each)
SNAPSHOT_INTERVAL = 30  # seconds
CLEANUP_DAYS = 7

class BatteryLogger:
    def __init__(self):
        self.client = mqtt.Client()
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message
        self.latest_data = {}
        self.current_charge_session = None
        self.db_lock = threading.Lock()
        
        # Initialize database
        self._init_database()
        
        # Connect to MQTT
        self.client.connect(MQTT_BROKER_HOST, MQTT_BROKER_PORT, 60)
        self.client.loop_start()
        
        # Start snapshot timer
        self._start_snapshot_timer()
        
        # Start hourly discharge logging timer
        self._start_hourly_timer()
        
        # Cleanup old data on startup
        self._cleanup_old_data()

    def _init_database(self):
        """Initialize SQLite database with required tables"""
        try:
            os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
            
            with sqlite3.connect(DB_PATH) as conn:
                cursor = conn.cursor()
                
                # Battery snapshots table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS battery_snapshots (
                        id INTEGER PRIMARY KEY,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                        battery_percent REAL,
                        battery_voltage REAL,
                        ac_output_power REAL,
                        dc_output_power REAL,
                        total_output_power REAL,
                        ac_input_power REAL,
                        dc_input_power REAL,
                        time_remaining_hours REAL,
                        pack1_voltage REAL,
                        pack2_voltage REAL,
                        pack3_voltage REAL
                    )
                ''')
                
                # Charging sessions table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS charge_sessions (
                        id INTEGER PRIMARY KEY,
                        start_time DATETIME,
                        end_time DATETIME,
                        start_percent REAL,
                        end_percent REAL,
                        duration_minutes INTEGER,
                        charge_type TEXT,
                        avg_input_power REAL
                    )
                ''')
                
                # Discharge sessions table (hourly tracking)
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS discharge_sessions (
                        id INTEGER PRIMARY KEY,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                        battery_percent REAL,
                        battery_voltage REAL,
                        total_output_power REAL,
                        discharge_rate_percent_per_hour REAL,
                        estimated_hours_remaining REAL,
                        estimated_days_remaining REAL,
                        avg_power_consumption REAL,
                        session_type TEXT DEFAULT 'discharge'
                    )
                ''')
                
                # Dashboard section order preferences table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS section_order (
                        id INTEGER PRIMARY KEY,
                        section_name TEXT UNIQUE NOT NULL,
                        display_order INTEGER NOT NULL,
                        is_visible BOOLEAN DEFAULT 1,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                # Insert default section order if not exists
                cursor.execute('SELECT COUNT(*) FROM section_order')
                if cursor.fetchone()[0] == 0:
                    default_sections = [
                        ('battery_status', 1, 1),
                        ('power_flow', 2, 1),
                        ('activity_log', 3, 1),
                        ('discharge_analysis', 4, 1),
                        ('raw_data', 5, 1)
                    ]
                    cursor.executemany('''
                        INSERT INTO section_order (section_name, display_order, is_visible)
                        VALUES (?, ?, ?)
                    ''', default_sections)
                
                # Create indexes for better performance
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_snapshots_timestamp ON battery_snapshots(timestamp)')
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON charge_sessions(start_time)')
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_discharge_timestamp ON discharge_sessions(timestamp)')
                
                conn.commit()
                logger.info("Database initialized successfully")
                
        except Exception as e:
            logger.error(f"Error initializing database: {e}")

    def _on_connect(self, client, userdata, flags, rc):
        """MQTT connection callback"""
        logger.info(f"MQTT Connected with result code {rc}")
        client.subscribe("bluetti/state/#")

    def _on_message(self, client, userdata, msg):
        """MQTT message callback"""
        try:
            topic_parts = msg.topic.split('/')
            if len(topic_parts) >= 4 and topic_parts[0] == 'bluetti' and topic_parts[1] == 'state':
                key = topic_parts[-1]
                try:
                    value = json.loads(msg.payload.decode())
                except json.JSONDecodeError:
                    value = msg.payload.decode()
                
                self.latest_data[key] = value
                
                # Check for charging state changes
                self._check_charging_state()
                
        except Exception as e:
            logger.error(f"Error processing MQTT message: {e}")

    def _check_charging_state(self):
        """Check if charging state has changed and update session tracking"""
        try:
            ac_input = float(self.latest_data.get('ac_input_power', 0))
            dc_input = float(self.latest_data.get('dc_input_power', 0))
            battery_percent = float(self.latest_data.get('total_battery_percent', 0))
            
            # Only consider it charging if input power is significant (>10W) or battery is actually gaining charge
            is_charging = (ac_input > 10 or dc_input > 10) and battery_percent < 99.5
            is_full = battery_percent >= 99.5
            
            # Start new charging session
            if is_charging and not self.current_charge_session and not is_full:
                self.current_charge_session = {
                    'start_time': datetime.now(),
                    'start_percent': battery_percent,
                    'charge_type': 'AC' if ac_input > dc_input else 'DC',
                    'input_powers': [max(ac_input, dc_input)],
                    'last_charge_time': datetime.now()
                }
                logger.info(f"Started charging session at {battery_percent}%")
            
            # Update current session
            elif self.current_charge_session and is_charging:
                self.current_charge_session['input_powers'].append(max(ac_input, dc_input))
                self.current_charge_session['last_charge_time'] = datetime.now()
            
            # End charging session if not charging for more than 2 minutes or battery is full
            elif self.current_charge_session:
                time_since_last_charge = (datetime.now() - self.current_charge_session['last_charge_time']).total_seconds()
                if not is_charging and time_since_last_charge > 120:  # 2 minutes
                    self._end_charge_session(battery_percent)
                elif is_full:
                    self._end_charge_session(battery_percent)
                
        except (ValueError, TypeError) as e:
            logger.warning(f"Error checking charging state: {e}")

    def _end_charge_session(self, end_percent):
        """End current charging session and save to database"""
        if not self.current_charge_session:
            return
            
        try:
            session = self.current_charge_session
            end_time = datetime.now()
            duration = (end_time - session['start_time']).total_seconds() / 60  # minutes
            avg_power = sum(session['input_powers']) / len(session['input_powers']) if session['input_powers'] else 0
            
            # Only save sessions that lasted at least 5 minutes or had significant charge gain
            percent_gained = end_percent - session['start_percent']
            if duration >= 5 or percent_gained >= 1.0:
                with self.db_lock:
                    with sqlite3.connect(DB_PATH) as conn:
                        cursor = conn.cursor()
                        cursor.execute('''
                            INSERT INTO charge_sessions 
                            (start_time, end_time, start_percent, end_percent, duration_minutes, charge_type, avg_input_power)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        ''', (
                            session['start_time'].isoformat(),
                            end_time.isoformat(),
                            session['start_percent'],
                            end_percent,
                            int(duration),
                            session['charge_type'],
                            avg_power
                        ))
                        conn.commit()
                
                logger.info(f"Ended charging session: {session['start_percent']}% → {end_percent}% ({duration:.1f}min)")
            else:
                logger.info(f"Ignored short charging session: {session['start_percent']}% → {end_percent}% ({duration:.1f}min)")
            
            self.current_charge_session = None
            
        except Exception as e:
            logger.error(f"Error ending charge session: {e}")

    def _start_snapshot_timer(self):
        """Start periodic snapshot timer"""
        def snapshot_worker():
            while True:
                try:
                    self._take_snapshot()
                    time.sleep(SNAPSHOT_INTERVAL)
                except Exception as e:
                    logger.error(f"Error in snapshot worker: {e}")
                    time.sleep(60)  # Wait a minute before retrying
        
        thread = threading.Thread(target=snapshot_worker, daemon=True)
        thread.start()
        logger.info("Snapshot timer started")

    def _start_hourly_timer(self):
        """Start configurable discharge logging timer"""
        def discharge_worker():
            while True:
                try:
                    # Check if we need to log discharge data based on time comparison
                    self._check_and_log_discharge()
                    
                    # Check every minute to see if we need to log
                    time.sleep(60)  # Check every minute
                except Exception as e:
                    logger.error(f"Error in discharge worker: {e}")
                    time.sleep(60)  # Wait 1 minute before retrying
        
        thread = threading.Thread(target=discharge_worker, daemon=True)
        thread.start()
        logger.info("Discharge logging timer started (time-based checking)")

    def _check_and_log_discharge(self):
        """Check if we need to log discharge data based on selected interval"""
        try:
            # Get fresh data from API server instead of relying on MQTT
            self._fetch_latest_data_from_api()
            
            if not self.latest_data:
                logger.warning("No data available from API server")
                return
            
            # Get the selected interval from the database (default to 10 minutes)
            interval_minutes = self._get_discharge_interval()
            
            # Check if we need to log based on the last logged time
            with self.db_lock:
                with sqlite3.connect(DB_PATH) as conn:
                    cursor = conn.cursor()
                    
                    # Get the most recent discharge session
                    cursor.execute('''
                        SELECT timestamp FROM discharge_sessions 
                        ORDER BY timestamp DESC 
                        LIMIT 1
                    ''')
                    last_session = cursor.fetchone()
                    
                    current_time = datetime.now()
                    should_log = False
                    
                    if last_session:
                        last_time = datetime.fromisoformat(last_session[0])
                        time_diff = (current_time - last_time).total_seconds() / 60  # minutes
                        
                        # Log if enough time has passed
                        if time_diff >= interval_minutes:
                            should_log = True
                            logger.info(f"Time to log discharge: {time_diff:.1f} minutes since last log (interval: {interval_minutes} min)")
                    else:
                        # No previous logs, log immediately
                        should_log = True
                        logger.info("No previous discharge logs found, logging immediately")
                    
                    if should_log:
                        self._log_hourly_discharge()
                        
        except Exception as e:
            logger.error(f"Error checking discharge logging: {e}")

    def _fetch_latest_data_from_api(self):
        """Fetch latest data from API server with retry"""
        import requests
        import time
        
        for attempt in range(3):  # Try 3 times
            try:
                response = requests.get('http://localhost:8083/api/bluetti', timeout=5)
                if response.status_code == 200:
                    self.latest_data = response.json()
                    logger.debug(f"Fetched data from API: {len(self.latest_data)} fields")
                    return
                else:
                    logger.warning(f"API server returned status {response.status_code}")
            except Exception as e:
                if attempt < 2:  # Don't log error on last attempt
                    logger.debug(f"API connection attempt {attempt + 1} failed: {e}")
                    time.sleep(2)  # Wait 2 seconds before retry
                else:
                    logger.error(f"Error fetching data from API after 3 attempts: {e}")

    def _get_discharge_interval(self):
        """Get the selected discharge logging interval from database"""
        try:
            with sqlite3.connect(DB_PATH) as conn:
                cursor = conn.cursor()
                
                # Check if we have a settings table for discharge interval
                cursor.execute('''
                    SELECT name FROM sqlite_master 
                    WHERE type='table' AND name='discharge_settings'
                ''')
                
                if not cursor.fetchone():
                    # Create settings table if it doesn't exist
                    cursor.execute('''
                        CREATE TABLE discharge_settings (
                            id INTEGER PRIMARY KEY,
                            setting_name TEXT UNIQUE NOT NULL,
                            setting_value TEXT NOT NULL,
                            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                        )
                    ''')
                    
                    # Insert default interval (10 minutes)
                    cursor.execute('''
                        INSERT INTO discharge_settings (setting_name, setting_value)
                        VALUES ('interval_minutes', '10')
                    ''')
                    conn.commit()
                    return 10
                
                # Get the current interval setting
                cursor.execute('''
                    SELECT setting_value FROM discharge_settings 
                    WHERE setting_name = 'interval_minutes'
                ''')
                
                result = cursor.fetchone()
                if result:
                    return int(result[0])
                else:
                    return 10  # Default to 10 minutes
                    
        except Exception as e:
            logger.error(f"Error getting discharge interval: {e}")
            return 10  # Default to 10 minutes

    def _take_snapshot(self):
        """Take a snapshot of current battery state"""
        if not self.latest_data:
            return
            
        try:
            # Extract data
            battery_percent = float(self.latest_data.get('total_battery_percent', 0))
            battery_voltage = float(self.latest_data.get('total_battery_voltage', 0))
            ac_output = float(self.latest_data.get('ac_output_power', 0))
            dc_output = float(self.latest_data.get('dc_output_power', 0))
            ac_input = float(self.latest_data.get('ac_input_power', 0))
            dc_input = float(self.latest_data.get('dc_input_power', 0))
            
            total_output = ac_output + dc_output
            
            # Calculate time remaining
            remaining_wh = (battery_percent / 100) * TOTAL_CAPACITY_WH
            time_remaining_hours = remaining_wh / total_output if total_output > 0 else float('inf')
            
            # Get pack voltages
            pack1_voltage = float(self.latest_data.get('pack1_voltage', 0))
            pack2_voltage = float(self.latest_data.get('pack2_voltage', 0))
            pack3_voltage = float(self.latest_data.get('pack3_voltage', 0))
            
            # Save to database
            with self.db_lock:
                with sqlite3.connect(DB_PATH) as conn:
                    cursor = conn.cursor()
                    cursor.execute('''
                        INSERT INTO battery_snapshots 
                        (battery_percent, battery_voltage, ac_output_power, dc_output_power, 
                         total_output_power, ac_input_power, dc_input_power, time_remaining_hours,
                         pack1_voltage, pack2_voltage, pack3_voltage)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        battery_percent, battery_voltage, ac_output, dc_output,
                        total_output, ac_input, dc_input, time_remaining_hours,
                        pack1_voltage, pack2_voltage, pack3_voltage
                    ))
                    conn.commit()
            
            logger.debug(f"Snapshot saved: {battery_percent}%, {time_remaining_hours:.1f}h remaining")
            
        except (ValueError, TypeError) as e:
            logger.warning(f"Error taking snapshot: {e}")
        except Exception as e:
            logger.error(f"Unexpected error in snapshot: {e}")

    def _cleanup_old_data(self):
        """Remove data older than CLEANUP_DAYS"""
        try:
            cutoff_date = datetime.now() - timedelta(days=CLEANUP_DAYS)
            
            with self.db_lock:
                with sqlite3.connect(DB_PATH) as conn:
                    cursor = conn.cursor()
                    
                    # Cleanup snapshots
                    cursor.execute('DELETE FROM battery_snapshots WHERE timestamp < ?', (cutoff_date.isoformat(),))
                    snapshots_deleted = cursor.rowcount
                    
                    # Cleanup old charge sessions
                    cursor.execute('DELETE FROM charge_sessions WHERE start_time < ?', (cutoff_date.isoformat(),))
                    sessions_deleted = cursor.rowcount
                    
                    # Cleanup old discharge sessions
                    cursor.execute('DELETE FROM discharge_sessions WHERE timestamp < ?', (cutoff_date.isoformat(),))
                    discharge_deleted = cursor.rowcount
                    
                    conn.commit()
                    
            logger.info(f"Cleanup completed: {snapshots_deleted} snapshots, {sessions_deleted} charge sessions, {discharge_deleted} discharge sessions deleted")
            
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")

    def get_current_status(self):
        """Get current battery status with time remaining"""
        try:
            if not self.latest_data:
                return None
                
            battery_percent = float(self.latest_data.get('total_battery_percent', 0))
            battery_voltage = float(self.latest_data.get('total_battery_voltage', 0))
            ac_output = float(self.latest_data.get('ac_output_power', 0))
            dc_output = float(self.latest_data.get('dc_output_power', 0))
            ac_input = float(self.latest_data.get('ac_input_power', 0))
            dc_input = float(self.latest_data.get('dc_input_power', 0))
            
            total_output = ac_output + dc_output
            remaining_wh = (battery_percent / 100) * TOTAL_CAPACITY_WH
            time_remaining_hours = remaining_wh / total_output if total_output > 0 else float('inf')
            
            is_charging = ac_input > 0 or dc_input > 0
            
            result = {
                'battery_percent': battery_percent,
                'battery_voltage': battery_voltage,
                'total_capacity_wh': TOTAL_CAPACITY_WH,
                'remaining_capacity_wh': remaining_wh,
                'current_output_watts': total_output,
                'time_remaining': {
                    'hours': time_remaining_hours,
                    'days': time_remaining_hours / 24,
                    'formatted': self._format_time(time_remaining_hours)
                },
                'is_charging': is_charging,
                'timestamp': datetime.now().isoformat()
            }
            
            # Add current charging session info
            if self.current_charge_session:
                session = self.current_charge_session
                current_duration = (datetime.now() - session['start_time']).total_seconds() / 60
                result['current_session'] = {
                    'started_at': session['start_time'].isoformat(),
                    'start_percent': session['start_percent'],
                    'duration_minutes': int(current_duration),
                    'charge_type': session['charge_type']
                }
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting current status: {e}")
            return None

    def _format_time(self, hours):
        """Format time remaining as human-readable string"""
        if hours == float('inf'):
            return "∞"
        
        days = int(hours // 24)
        remaining_hours = int(hours % 24)
        minutes = int((hours % 1) * 60)
        
        if days > 0:
            return f"{days}d {remaining_hours}h {minutes}m"
        elif remaining_hours > 0:
            return f"{remaining_hours}h {minutes}m"
        else:
            return f"{minutes}m"

    def _log_hourly_discharge(self):
        """Log hourly discharge data and calculate discharge rates"""
        try:
            if not self.latest_data:
                return
            
            current_time = datetime.now()
            battery_percent = float(self.latest_data.get('total_battery_percent', 0))
            battery_voltage = float(self.latest_data.get('total_battery_voltage', 0))
            total_output_power = float(self.latest_data.get('ac_output_power', 0)) + float(self.latest_data.get('dc_output_power', 0))
            
            # Get the last discharge session to calculate rate
            with self.db_lock:
                with sqlite3.connect(DB_PATH) as conn:
                    cursor = conn.cursor()
                    
                    # Get discharge sessions from the last 4 hours to calculate rate
                    cursor.execute('''
                        SELECT battery_percent, timestamp, total_output_power
                        FROM discharge_sessions 
                        WHERE timestamp >= datetime('now', '-4 hours')
                        ORDER BY timestamp ASC
                    ''')
                    recent_sessions = cursor.fetchall()
                    
                    discharge_rate = 0.0
                    estimated_hours = 0.0
                    estimated_days = 0.0
                    avg_power = total_output_power
                    
                    if len(recent_sessions) >= 2:
                        # Calculate discharge rate from first to last session in the period
                        first_percent = recent_sessions[0][0]
                        first_timestamp = recent_sessions[0][1]
                        last_percent = recent_sessions[-1][0]
                        last_timestamp = recent_sessions[-1][1]
                        
                        first_time = datetime.fromisoformat(first_timestamp)
                        last_time = datetime.fromisoformat(last_timestamp)
                        hours_elapsed = (last_time - first_time).total_seconds() / 3600
                        
                        if hours_elapsed > 0 and first_percent > last_percent:
                            # Calculate discharge rate (% per hour)
                            discharge_rate = (first_percent - last_percent) / hours_elapsed
                            
                            # Calculate average power consumption from all sessions
                            total_power = sum(session[2] for session in recent_sessions)
                            avg_power = total_power / len(recent_sessions)
                            
                            # Estimate remaining time based on current discharge rate
                            if discharge_rate > 0:
                                estimated_hours = battery_percent / discharge_rate
                                estimated_days = estimated_hours / 24
                    
                    # Insert new discharge session
                    cursor.execute('''
                        INSERT INTO discharge_sessions 
                        (timestamp, battery_percent, battery_voltage, total_output_power, 
                         discharge_rate_percent_per_hour, estimated_hours_remaining, 
                         estimated_days_remaining, avg_power_consumption, session_type)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        current_time.isoformat(),
                        battery_percent,
                        battery_voltage,
                        total_output_power,
                        discharge_rate,
                        estimated_hours,
                        estimated_days,
                        avg_power,
                        'discharge'
                    ))
                    
                    conn.commit()
                    logger.info(f"Logged hourly discharge: {battery_percent:.1f}% (rate: {discharge_rate:.2f}%/hr, est: {estimated_days:.1f} days)")
                    
        except Exception as e:
            logger.error(f"Error logging hourly discharge: {e}")

    def run(self):
        """Main run loop"""
        logger.info("Battery Logger started")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            logger.info("Shutting down battery logger...")
            if self.current_charge_session:
                self._end_charge_session(float(self.latest_data.get('total_battery_percent', 0)))

if __name__ == "__main__":
    battery_logger = BatteryLogger()
    battery_logger.run()
