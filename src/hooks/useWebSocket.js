import { useState, useEffect, useRef } from "react";

export function useWebSocket() {
  const [bluettiData, setBluettiData] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  function connectWebSocket() {
    try {
      const wsUrl =
        process.env.NODE_ENV === "production"
          ? `ws://${window.location.host}/ws`
          : "ws://localhost:8082/ws";

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        setError(null);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === "initial-data") {
            setBluettiData(message.data);
          } else if (message.type === "bluetti-data") {
            setBluettiData((prev) => {
              const newData = { ...prev };
              if (!newData[message.data.deviceName]) {
                newData[message.data.deviceName] = {};
              }
              newData[message.data.deviceName][message.data.property] =
                message.data.value;
              return newData;
            });
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      wsRef.current.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);

        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("Attempting to reconnect WebSocket...");
          connectWebSocket();
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setError("Connection error. Please check if the server is running.");
        setIsConnected(false);
      };
    } catch (err) {
      console.error("Error creating WebSocket connection:", err);
      setError("Failed to connect to server.");
      setIsConnected(false);
    }
  }

  return {
    bluettiData,
    isConnected,
    error,
  };
}
