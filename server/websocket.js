import {
  subscribeToBluettiData,
  unsubscribeFromBluettiData,
} from "./mqtt-handler.js";

let connectedClients = new Set();
let bluettiDataCache = {};

export function websocketHandler(wss) {
  // Subscribe to MQTT data and broadcast to all connected WebSocket clients
  subscribeToBluettiData((data) => {
    // Update cache with latest data
    if (!bluettiDataCache[data.deviceName]) {
      bluettiDataCache[data.deviceName] = {};
    }
    bluettiDataCache[data.deviceName][data.property] = data.value;

    // Broadcast to all connected clients
    const message = JSON.stringify({
      type: "bluetti-data",
      data: {
        deviceName: data.deviceName,
        property: data.property,
        value: data.value,
        timestamp: data.timestamp,
      },
    });

    connectedClients.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    });
  });

  wss.on("connection", (ws, req) => {
    console.log("New WebSocket connection");
    connectedClients.add(ws);

    // Send current cached data to new client
    const initialMessage = JSON.stringify({
      type: "initial-data",
      data: bluettiDataCache,
    });
    ws.send(initialMessage);

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message);
        console.log("Received WebSocket message:", data);

        // Handle different message types if needed
        switch (data.type) {
          case "ping":
            ws.send(JSON.stringify({ type: "pong" }));
            break;
          default:
            console.log("Unknown message type:", data.type);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    });

    ws.on("close", () => {
      console.log("WebSocket connection closed");
      connectedClients.delete(ws);
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      connectedClients.delete(ws);
    });

    // Send ping every 30 seconds to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: "ping" }));
      } else {
        clearInterval(pingInterval);
      }
    }, 30000);

    ws.on("close", () => {
      clearInterval(pingInterval);
    });
  });
}
