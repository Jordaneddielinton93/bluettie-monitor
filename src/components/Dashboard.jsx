import { useState, useEffect } from "react";
import StatusCard from "./StatusCard";
import PowerFlow from "./PowerFlow";
import ActivityLog from "./ActivityLog";
import DischargeLog from "./DischargeLog";
import { useBatteryActivity } from "../hooks/useBatteryActivity";
import {
  formatPower,
  formatVoltage,
  formatCurrent,
  formatEnergy,
} from "../utils/formatters";

const API_BASE = "http://192.168.1.145:8083";

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
  const deviceData = data || {};
  const deviceName = "BLUETTI AC200MAX"; // Assuming a single main device for display

  // Extract key metrics (property names may vary based on your Bluetti model)
  const batteryPercentage =
    parseFloat(deviceData["total_battery_percent"]) || 0;
  const batteryCapacity = 6144; // Total capacity in Wh
  const timeRemaining = currentStatus?.time_remaining || {
    hours: 0,
    days: 0,
    formatted: "0h 0m",
  };

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

  // Don't render drag and drop system until data is loaded
  if (loading || !deviceData || Object.keys(deviceData).length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-cyan-400 font-mono text-lg">
            LOADING DASHBOARD...
          </div>
        </div>
      </div>
    );
  }

  // Define section components
  const sectionComponents = {
    battery_status: (
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 via-emerald-500/10 to-teal-400/10 rounded-xl blur-xl"></div>
        <div className="relative bg-slate-800/90 backdrop-blur-sm border border-green-400/30 rounded-xl shadow-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 font-mono">
              BATTERY STATUS
            </h3>
            <div className="text-xs text-green-300 font-mono">REAL-TIME</div>
          </div>
          <StatusCard
            batteryPercentage={batteryPercentage}
            batteryVoltage={batteryVoltage}
            batteryCurrent={batteryCurrent}
            batteryCapacity={batteryCapacity}
            timeRemaining={timeRemaining}
            deviceName={deviceName}
          />
        </div>
      </div>
    ),
    power_flow: (
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-indigo-500/10 to-purple-400/10 rounded-xl blur-xl"></div>
        <div className="relative bg-slate-800/90 backdrop-blur-sm border border-blue-400/30 rounded-xl shadow-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 font-mono">
              POWER FLOW
            </h3>
            <div className="text-xs text-blue-300 font-mono">
              LIVE MONITORING
            </div>
          </div>
          <PowerFlow
            acInputPower={acInputPower}
            acOutputPower={acOutputPower}
            dcInputPower={dcInputPower}
            dcOutputPower={dcOutputPower}
            batteryPercentage={batteryPercentage}
            batteryCapacity={batteryCapacity}
            deviceName={deviceName}
          />
        </div>
      </div>
    ),
    activity_log: (
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 via-pink-500/10 to-rose-400/10 rounded-xl blur-xl"></div>
        <div className="relative bg-slate-800/90 backdrop-blur-sm border border-purple-400/30 rounded-xl shadow-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-mono">
              ACTIVITY LOG
            </h3>
            <div className="text-xs text-purple-300 font-mono">
              CHARGE SESSIONS
            </div>
          </div>
          <ActivityLog
            currentStatus={currentStatus}
            chargeSessions={chargeSessions}
            history={history}
            stats={stats}
          />
        </div>
      </div>
    ),
    discharge_analysis: (
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-400/10 via-red-500/10 to-yellow-400/10 rounded-xl blur-xl"></div>
        <div className="relative bg-slate-800/90 backdrop-blur-sm border border-orange-400/30 rounded-xl shadow-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400 font-mono">
              DISCHARGE ANALYSIS
            </h3>
            <div className="text-xs text-orange-300 font-mono">
              HOURLY PREDICTIONS
            </div>
          </div>
          <DischargeLog />
        </div>
      </div>
    ),
    raw_data: (
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-400/10 via-slate-500/10 to-zinc-400/10 rounded-xl blur-xl"></div>
        <div className="relative bg-slate-800/90 backdrop-blur-sm border border-gray-400/30 rounded-xl shadow-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-slate-400 font-mono">
              RAW DATA
            </h3>
            <div className="text-xs text-gray-300 font-mono">DEBUG INFO</div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2 font-mono">
                MQTT DATA
              </h4>
              <pre className="text-xs text-gray-400 overflow-auto bg-slate-900/50 p-3 rounded border border-gray-600/30 max-h-64 font-mono">
                {JSON.stringify(deviceData, null, 2)}
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
    ),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4">
      {/* Sci-Fi Header */}
      <div className="relative mb-6">
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
                <span className="text-green-400 text-sm font-mono">
                  {deviceStatus}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-cyan-300 text-sm font-mono">
                  CHARGING
                </span>
                <span className="text-yellow-400 text-sm font-mono">
                  {chargingStatus}
                </span>
              </div>
            </div>
            <div className="bg-slate-900/50 border border-cyan-400/20 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-cyan-300 text-sm font-mono">BATTERY</span>
                <span className="text-cyan-400 text-sm font-mono">
                  {batteryPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-cyan-300 text-sm font-mono">VOLTAGE</span>
                <span className="text-cyan-400 text-sm font-mono">
                  {formatVoltage(batteryVoltage)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Static Sections */}
      <div className="space-y-6">
        {sectionComponents.battery_status}
        {sectionComponents.power_flow}
        {sectionComponents.activity_log}
        {sectionComponents.discharge_analysis}
        {sectionComponents.raw_data}
      </div>
    </div>
  );
}
