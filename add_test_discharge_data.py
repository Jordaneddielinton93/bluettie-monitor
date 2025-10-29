#!/usr/bin/env python3
"""
Script to add test discharge data to the database for testing purposes.
This is useful when the battery-logger service hasn't had time to create
real discharge sessions yet (it only logs hourly).
"""

import sqlite3
from datetime import datetime, timedelta
import sys

DB_PATH = "/home/pi/bluetti-monitor/battery_activity.db"

def add_test_discharge_data():
    """Add test discharge sessions to the database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if discharge_sessions table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='discharge_sessions'")
        if not cursor.fetchone():
            print("Error: discharge_sessions table does not exist")
            return False
        
        # Clear existing test data
        cursor.execute("DELETE FROM discharge_sessions WHERE session_type = 'test'")
        
        # Add test discharge sessions
        now = datetime.now()
        base_battery = 89.0
        base_discharge_rate = 2.5
        
        for i in range(6):
            timestamp = now - timedelta(hours=i)
            battery_percent = base_battery - (i * 1.5)  # Decreasing battery
            discharge_rate = base_discharge_rate + (i * 0.1)  # Slightly increasing discharge rate
            hours_remaining = battery_percent / discharge_rate if discharge_rate > 0 else 0
            
            cursor.execute('''
                INSERT INTO discharge_sessions 
                (timestamp, battery_percent, battery_voltage, total_output_power, 
                 discharge_rate_percent_per_hour, estimated_hours_remaining, 
                 estimated_days_remaining, avg_power_consumption, session_type)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                timestamp.isoformat(),
                battery_percent,
                53.2,  # Typical battery voltage
                18.0,  # Typical output power
                discharge_rate,
                hours_remaining,
                hours_remaining / 24,
                18.0,
                'test'
            ))
        
        conn.commit()
        print(f"Added 6 test discharge sessions to database")
        
        # Verify the data
        cursor.execute("SELECT COUNT(*) FROM discharge_sessions")
        count = cursor.fetchone()[0]
        print(f"Total discharge sessions in database: {count}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"Error adding test discharge data: {e}")
        return False

if __name__ == "__main__":
    success = add_test_discharge_data()
    sys.exit(0 if success else 1)
