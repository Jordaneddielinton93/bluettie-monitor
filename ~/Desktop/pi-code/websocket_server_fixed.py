#!/usr/bin/env python3
"""
Fixed WebSocket Server for Bluetti Monitor
This version properly handles the path parameter and connects to real Bluetti data
"""
import asyncio
import websockets
import json
import paho.mqtt.client as mqtt
import threading
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MQTTWebSocketBridge:
    def __init__(self):
        self.mqtt_client = mqtt.Client()
        self.mqtt_client.on_connect = self.on_connect
        self.mqtt_client.on_message = self.on_message
        self.websocket_clients = set()
        self.loop = None

    def on_connect(self, client, userdata, flags, rc):
        logger.info(f'Connected to MQTT broker with result code {rc}')
        # Subscribe to all Bluetti topics
        client.subscribe('bluetti/+/+')
        client.subscribe('bluetti/device/+')

    def on_message(self, client, userdata, msg):
        try:
            data = json.loads(msg.payload.decode())
            logger.info(f'Received MQTT data from {msg.topic}: {data}')

            # Broadcast to all WebSocket clients
            if self.loop:
                asyncio.run_coroutine_threadsafe(
                    self.broadcast_message(json.dumps(data)), 
                    self.loop
                )
        except json.JSONDecodeError as e:
            logger.error(f'Error parsing MQTT message: {e} - Message: {msg.payload.decode()}')
        except Exception as e:
            logger.error(f'Unexpected error in on_message: {e}')

    async def broadcast_message(self, message):
        """Broadcast message to all connected WebSocket clients"""
        disconnected_clients = set()
        
        for ws in self.websocket_clients.copy():
            try:
                if ws.open:
                    await ws.send(message)
                    logger.debug(f"Sent message to client: {ws.remote_address}")
                else:
                    disconnected_clients.add(ws)
            except Exception as e:
                logger.error(f"Error sending to WebSocket client: {e}")
                disconnected_clients.add(ws)
        
        # Remove disconnected clients
        for ws in disconnected_clients:
            self.websocket_clients.discard(ws)
            logger.info(f"Removed disconnected client: {ws.remote_address}")

    async def websocket_handler(self, websocket, path):
        """Handle WebSocket connections - FIXED: includes path parameter"""
        logger.info(f"WebSocket client connected from {websocket.remote_address} on path {path}")
        self.websocket_clients.add(websocket)
        
        try:
            # Keep connection alive
            await websocket.wait_closed()
        except websockets.exceptions.ConnectionClosedOK:
            logger.info(f"WebSocket client {websocket.remote_address} disconnected gracefully.")
        except websockets.exceptions.ConnectionClosedError as e:
            logger.error(f"WebSocket client {websocket.remote_address} disconnected with error: {e}")
        except Exception as e:
            logger.error(f"Unexpected error in WebSocket handler for {websocket.remote_address}: {e}")
        finally:
            self.websocket_clients.discard(websocket)
            logger.info(f"WebSocket client {websocket.remote_address} removed.")

    def start_mqtt_loop(self):
        """Start MQTT client in separate thread"""
        try:
            self.mqtt_client.connect("127.0.0.1", 1883, 60)
            self.mqtt_client.loop_forever()
        except Exception as e:
            logger.error(f"MQTT connection error: {e}")

    async def start_websocket_server(self):
        """Start WebSocket server"""
        self.loop = asyncio.get_running_loop()
        start_server = websockets.serve(self.websocket_handler, '0.0.0.0', 8083)
        logger.info("WebSocket server starting on port 8083")
        await start_server

    def start(self):
        """Start both MQTT and WebSocket servers"""
        # Start MQTT in a separate thread
        mqtt_thread = threading.Thread(target=self.start_mqtt_loop)
        mqtt_thread.daemon = True
        mqtt_thread.start()
        
        # Start WebSocket server in the main asyncio loop
        asyncio.run(self.start_websocket_server())

if __name__ == "__main__":
    logger.info("Starting Bluetti WebSocket Bridge...")
    bridge = MQTTWebSocketBridge()
    bridge.start()
