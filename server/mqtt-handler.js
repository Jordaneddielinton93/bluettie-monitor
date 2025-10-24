import mqtt from "mqtt";
import { EventEmitter } from "events";

const mqttEmitter = new EventEmitter();

let client = null;
let isConnected = false;

export function mqttHandler() {
  const brokerHost = process.env.MQTT_BROKER_HOST || "localhost";
  const brokerPort = process.env.MQTT_BROKER_PORT || 1883;
  const username = process.env.MQTT_USERNAME || "";
  const password = process.env.MQTT_PASSWORD || "";

  const connectOptions = {
    host: brokerHost,
    port: brokerPort,
    protocol: "mqtt",
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000,
  };

  if (username && password) {
    connectOptions.username = username;
    connectOptions.password = password;
  }

  client = mqtt.connect(connectOptions);

  client.on("connect", () => {
    console.log("Connected to MQTT broker");
    isConnected = true;

    // Subscribe to all Bluetti state topics
    client.subscribe("bluetti/state/+/+", (err) => {
      if (err) {
        console.error("Error subscribing to MQTT topics:", err);
      } else {
        console.log("Subscribed to bluetti state topics");
      }
    });
  });

  client.on("error", (err) => {
    console.error("MQTT connection error:", err);
    isConnected = false;
  });

  client.on("disconnect", () => {
    console.log("Disconnected from MQTT broker");
    isConnected = false;
  });

  client.on("message", (topic, message) => {
    try {
      const topicParts = topic.split("/");
      if (
        topicParts.length >= 4 &&
        topicParts[0] === "bluetti" &&
        topicParts[1] === "state"
      ) {
        const deviceName = topicParts[2];
        const property = topicParts[3];
        const value = message.toString();

        const data = {
          deviceName,
          property,
          value,
          timestamp: new Date().toISOString(),
          topic,
        };

        console.log(`MQTT Data: ${deviceName}/${property} = ${value}`);
        mqttEmitter.emit("bluetti-data", data);
      }
    } catch (error) {
      console.error("Error parsing MQTT message:", error);
    }
  });
}

export function getMqttStatus() {
  return {
    connected: isConnected,
    client: client ? "connected" : "disconnected",
  };
}

export function subscribeToBluettiData(callback) {
  mqttEmitter.on("bluetti-data", callback);
}

export function unsubscribeFromBluettiData(callback) {
  mqttEmitter.off("bluetti-data", callback);
}
