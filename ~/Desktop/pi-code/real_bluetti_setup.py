#!/usr/bin/env python3
"""
Real Bluetti MQTT Publisher
This script connects to your actual Bluetti device and publishes real data to MQTT
"""
import subprocess
import sys
import time
import json
import paho.mqtt.client as mqtt
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Your Bluetti device MAC address
BLUETTI_MAC = "00:15:83:82:0B:B1"
MQTT_BROKER = "127.0.0.1"
MQTT_PORT = 1883

def setup_mqtt():
    """Setup MQTT client"""
    client = mqtt.Client()
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    return client

def run_bluetti_mqtt():
    """Run the real bluetti-mqtt tool"""
    try:
        # Run bluetti-mqtt with your device
        cmd = [
            "bluetti-mqtt",
            "--address", BLUETTI_MAC,
            "--broker", MQTT_BROKER,
            "--port", str(MQTT_PORT)
        ]
        
        logger.info(f"Starting bluetti-mqtt with command: {' '.join(cmd)}")
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        # Monitor the process
        while True:
            output = process.stdout.readline()
            if output == '' and process.poll() is not None:
                break
            if output:
                logger.info(f"bluetti-mqtt: {output.strip()}")
        
        # Check for errors
        stderr = process.stderr.read()
        if stderr:
            logger.error(f"bluetti-mqtt error: {stderr}")
            
    except Exception as e:
        logger.error(f"Error running bluetti-mqtt: {e}")

if __name__ == "__main__":
    logger.info("Starting real Bluetti MQTT publisher...")
    logger.info(f"Connecting to Bluetti device: {BLUETTI_MAC}")
    logger.info(f"MQTT broker: {MQTT_BROKER}:{MQTT_PORT}")
    
    run_bluetti_mqtt()
