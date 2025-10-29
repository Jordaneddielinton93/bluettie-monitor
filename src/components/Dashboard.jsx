import { useState, useEffect } from "react";
import StatusCard from "./StatusCard";
import PowerFlow from "./PowerFlow";
import ActivityLog from "./ActivityLog";
import { useBatteryActivity } from "../hooks/useBatteryActivity";
import {
  formatPower,
  formatVoltage,
  formatCurrent,
  formatEnergy,
} from "../utils/formatters";

const API_BASE =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_BASE || "http://localhost:8083"
    : "http://localhost:8083";

export default function Dashboard() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentStatus, chargeSessions, history, stats } =
    useBatteryActivity();

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/bluetti`);
      if (!response.ok) throw new Error("Failed to fetch data");
      const bluettiData = await response.json();
      setData(bluettiData);
      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-cyan-400 font-mono text-lg">
            INITIALIZING SYSTEMS...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-800 flex items-center justify-center">
        <div className="bg-slate-800/90 border border-red-400/30 rounded-xl p-8 text-center">
          <div className="text-red-400 text-6xl mb-4">⚠</div>
          <div className="text-red-300 font-mono text-xl mb-2">
            SYSTEM ERROR
          </div>
          <div className="text-gray-300 font-mono">{error}</div>
        </div>
      </div>
    );
  }

  // API returns data directly, not wrapped in device name
  const deviceData = data;
  const deviceName = "BLUETTI AC200MAX"; // Assuming a single main device for display

  // Extract key metrics (property names may vary based on your Bluetti model)
  const batteryPercentage =
    parseFloat(deviceData["total_battery_percent"]) || 0;
  const batteryCapacity = 6144; // Total capacity: AC200MAX (2048) + 2x B230 (2048 each)
  const batteryVoltage = parseFloat(deviceData["total_battery_voltage"]) || 0;
  const batteryCurrent = parseFloat(deviceData["internal_current_one"]) || 0;

  const acInputPower = parseFloat(deviceData["ac_input_power"]) || 0;
  const acOutputPower = parseFloat(deviceData["ac_output_power"]) || 0;
  const acInputVoltage = parseFloat(deviceData["ac_input_voltage"]) || 0;
  const acOutputVoltage = parseFloat(deviceData["ac_output_voltage"]) || 0;

  const dcInputPower = parseFloat(deviceData["dc_input_power"]) || 0;
  const dcOutputPower = parseFloat(deviceData["dc_output_power"]) || 0;

  // Calculate charging status based on input power
  const chargingStatus =
    acInputPower > 0 || dcInputPower > 0 ? "Charging" : "Not Charging";

  // Calculate device status based on power state and output mode
  const powerOff = deviceData["power_off"] === "ON";
  const acOutputMode = deviceData["ac_output_mode"];
  const dcOutputOn = deviceData["dc_output_on"] === "ON";

  let deviceStatus = "Unknown";
  if (powerOff) {
    deviceStatus = "Power Off";
  } else if (acOutputMode === "STOP" && !dcOutputOn) {
    deviceStatus = "Standby";
  } else if (acOutputMode === "STOP" && dcOutputOn) {
    deviceStatus = "DC Only";
  } else if (acOutputMode !== "STOP") {
    deviceStatus = "AC Active";
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4 space-y-6">
      {/* Sci-Fi Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-blue-500/20 to-purple-500/20 rounded-xl blur-xl"></div>
        <div className="relative bg-slate-800/90 backdrop-blur-sm border border-cyan-400/30 rounded-xl shadow-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 font-mono">
                {deviceName}
              </h2>
            </div>
            <div className="text-xs text-cyan-300 font-mono">SYSTEM ONLINE</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/50 border border-cyan-400/20 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-cyan-300 text-sm font-mono">STATUS</span>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div className="text-white text-lg font-mono">{deviceStatus}</div>
              <div className="text-cyan-400 text-xs font-mono">
                {deviceStatus}
              </div>
            </div>
            <div className="bg-slate-900/50 border border-cyan-400/20 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-cyan-300 text-sm font-mono">POWER</span>
                <div
                  className={`w-2 h-2 rounded-full animate-pulse ${
                    chargingStatus === "Charging"
                      ? "bg-yellow-400"
                      : "bg-blue-400"
                  }`}
                ></div>
              </div>
              <div className="text-white text-lg font-mono">
                {chargingStatus}
              </div>
              <div className="text-cyan-400 text-xs font-mono">
                {chargingStatus}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Battery Information - Sci-Fi Style */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 via-emerald-500/10 to-cyan-400/10 rounded-xl blur-xl"></div>
        <div className="relative bg-slate-800/90 backdrop-blur-sm border border-green-400/30 rounded-xl shadow-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 font-mono">
              POWER CORE STATUS
            </h3>
            <div className="text-xs text-green-300 font-mono">
              {batteryPercentage.toFixed(1)}% CAPACITY
            </div>
          </div>

          {/* Battery Level Visual */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-300 text-sm font-mono">
                CORE LEVEL
              </span>
              <span className="text-white font-mono text-lg">
                {batteryPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-400 transition-all duration-1000"
                style={{ width: `${batteryPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 border border-green-400/20 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-green-300 text-sm font-mono mb-1">
                CAPACITY
              </div>
              <div className="text-white text-lg font-mono">
                {formatEnergy(batteryCapacity)}
              </div>
              <div className="text-green-400 text-xs font-mono">
                TOTAL STORAGE
              </div>
            </div>
            <div className="bg-slate-900/50 border border-green-400/20 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-green-300 text-sm font-mono mb-1">
                VOLTAGE
              </div>
              <div className="text-white text-lg font-mono">
                {formatVoltage(batteryVoltage)}
              </div>
              <div className="text-green-400 text-xs font-mono">
                CORE VOLTAGE
              </div>
            </div>
            <div className="bg-slate-900/50 border border-green-400/20 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-green-300 text-sm font-mono mb-1">
                CURRENT
              </div>
              <div className="text-white text-lg font-mono">
                {formatCurrent(batteryCurrent)}
              </div>
              <div className="text-green-400 text-xs font-mono">FLOW RATE</div>
            </div>
            <div className="bg-slate-900/50 border border-green-400/20 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-green-300 text-sm font-mono mb-1">
                REMAINING
              </div>
              <div className="text-white text-lg font-mono">
                {formatEnergy((batteryPercentage / 100) * batteryCapacity)}
              </div>
              <div className="text-green-400 text-xs font-mono">AVAILABLE</div>
            </div>
          </div>
        </div>
      </div>

      {/* Power Flow - Sci-Fi Style */}
      <PowerFlow data={data} />

      {/* Activity Log - Sci-Fi Style */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 via-pink-500/10 to-cyan-400/10 rounded-xl blur-xl"></div>
        <div className="relative bg-slate-800/90 backdrop-blur-sm border border-purple-400/30 rounded-xl shadow-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-mono">
              ACTIVITY LOG
            </h3>
            <div className="text-xs text-purple-300 font-mono">
              REAL-TIME MONITORING
            </div>
          </div>
          <ActivityLog />
        </div>
      </div>

      {/* AC Power - Sci-Fi Style */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-400/10 via-red-500/10 to-yellow-400/10 rounded-xl blur-xl"></div>
        <div className="relative bg-slate-800/90 backdrop-blur-sm border border-orange-400/30 rounded-xl shadow-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400 font-mono">
              AC POWER SYSTEMS
            </h3>
            <div className="text-xs text-orange-300 font-mono">
              ALTERNATING CURRENT
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 border border-orange-400/20 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-orange-300 text-sm font-mono mb-1">
                INPUT
              </div>
              <div className="text-white text-lg font-mono">
                {formatPower(acInputPower)}
              </div>
              <div className="text-orange-400 text-xs font-mono">AC IN</div>
            </div>
            <div className="bg-slate-900/50 border border-orange-400/20 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-orange-300 text-sm font-mono mb-1">
                OUTPUT
              </div>
              <div className="text-white text-lg font-mono">
                {formatPower(acOutputPower)}
              </div>
              <div className="text-orange-400 text-xs font-mono">AC OUT</div>
            </div>
            <div className="bg-slate-900/50 border border-orange-400/20 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-orange-300 text-sm font-mono mb-1">
                IN VOLTAGE
              </div>
              <div className="text-white text-lg font-mono">
                {formatVoltage(acInputVoltage)}
              </div>
              <div className="text-orange-400 text-xs font-mono">VAC IN</div>
            </div>
            <div className="bg-slate-900/50 border border-orange-400/20 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-orange-300 text-sm font-mono mb-1">
                OUT VOLTAGE
              </div>
              <div className="text-white text-lg font-mono">
                {formatVoltage(acOutputVoltage)}
              </div>
              <div className="text-orange-400 text-xs font-mono">VAC OUT</div>
            </div>
          </div>
        </div>
      </div>

      {/* DC Power - Sci-Fi Style */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-cyan-500/10 to-teal-400/10 rounded-xl blur-xl"></div>
        <div className="relative bg-slate-800/90 backdrop-blur-sm border border-blue-400/30 rounded-xl shadow-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 font-mono">
              DC POWER SYSTEMS
            </h3>
            <div className="text-xs text-blue-300 font-mono">
              DIRECT CURRENT
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/50 border border-blue-400/20 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-blue-300 text-sm font-mono mb-1">INPUT</div>
              <div className="text-white text-lg font-mono">
                {formatPower(dcInputPower)}
              </div>
              <div className="text-blue-400 text-xs font-mono">DC IN</div>
            </div>
            <div className="bg-slate-900/50 border border-blue-400/20 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-blue-300 text-sm font-mono mb-1">OUTPUT</div>
              <div className="text-white text-lg font-mono">
                {formatPower(dcOutputPower)}
              </div>
              <div className="text-blue-400 text-xs font-mono">DC OUT</div>
            </div>
          </div>
        </div>
      </div>

      {/* Raw Data Section - Sci-Fi Style */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-400/10 via-slate-500/10 to-gray-600/10 rounded-xl blur-xl"></div>
        <div className="relative bg-slate-800/90 backdrop-blur-sm border border-gray-400/30 rounded-xl shadow-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-slate-400 font-mono">
              SYSTEM DATA
            </h3>
            <div className="text-xs text-gray-300 font-mono">
              DEBUG INFORMATION
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2 font-mono">
                MAIN BLUETTI DATA
              </h4>
              <pre className="text-xs text-gray-400 overflow-auto bg-slate-900/50 p-3 rounded border border-gray-600/30 max-h-64 font-mono">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2 font-mono">
                CURRENT ACTIVITY STATUS
              </h4>
              <pre className="text-xs text-gray-400 overflow-auto bg-slate-900/50 p-3 rounded border border-gray-600/30 max-h-64 font-mono">
                {JSON.stringify(currentStatus, null, 2)}
              </pre>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2 font-mono">
                CHARGE SESSIONS
              </h4>
              <pre className="text-xs text-gray-400 overflow-auto bg-slate-900/50 p-3 rounded border border-gray-600/30 max-h-64 font-mono">
                {JSON.stringify(chargeSessions, null, 2)}
              </pre>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2 font-mono">
                BATTERY HISTORY (LAST 24H)
              </h4>
              <pre className="text-xs text-gray-400 overflow-auto bg-slate-900/50 p-3 rounded border border-gray-600/30 max-h-64 font-mono">
                {JSON.stringify(history, null, 2)}
              </pre>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2 font-mono">
                STATISTICS
              </h4>
              <pre className="text-xs text-gray-400 overflow-auto bg-slate-900/50 p-3 rounded border border-gray-600/30 max-h-64 font-mono">
                {JSON.stringify(stats, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
