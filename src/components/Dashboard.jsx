import StatusCard from "./StatusCard";
import PowerFlow from "./PowerFlow";
import {
  formatPower,
  formatVoltage,
  formatCurrent,
  formatEnergy,
  getBatteryColor,
} from "../utils/formatters";

export default function Dashboard({ data }) {
  const deviceName = Object.keys(data)[0];
  const deviceData = data[deviceName] || {};

  // Extract key metrics (property names may vary based on your Bluetti model)
  const batteryPercentage = parseFloat(deviceData["battery_percentage"]) || 0;
  const batteryCapacity = parseFloat(deviceData["battery_capacity"]) || 0;
  const batteryVoltage = parseFloat(deviceData["battery_voltage"]) || 0;
  const batteryCurrent = parseFloat(deviceData["battery_current"]) || 0;

  const acInputPower = parseFloat(deviceData["ac_input_power"]) || 0;
  const acOutputPower = parseFloat(deviceData["ac_output_power"]) || 0;
  const acInputVoltage = parseFloat(deviceData["ac_input_voltage"]) || 0;
  const acOutputVoltage = parseFloat(deviceData["ac_output_voltage"]) || 0;

  const dcInputPower = parseFloat(deviceData["dc_input_power"]) || 0;
  const dcOutputPower = parseFloat(deviceData["dc_output_power"]) || 0;

  const chargingStatus = deviceData["charging_status"] || "Unknown";
  const deviceStatus = deviceData["device_status"] || "Unknown";

  const batteryIcon = (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.666.804 4.322A1 1 0 0113 21H7a1 1 0 01-.985-1.012l.804-4.322L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z"
        clipRule="evenodd"
      />
    </svg>
  );

  const powerIcon = (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
        clipRule="evenodd"
      />
    </svg>
  );

  const voltageIcon = (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z"
        clipRule="evenodd"
      />
    </svg>
  );

  const statusIcon = (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );

  return (
    <div className="space-y-6">
      {/* Device Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Device: {deviceName || "Unknown"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatusCard
            title="Device Status"
            value={deviceStatus}
            status={deviceStatus}
            icon={statusIcon}
            color="blue"
          />
          <StatusCard
            title="Charging Status"
            value={chargingStatus}
            status={chargingStatus}
            icon={statusIcon}
            color="green"
          />
        </div>
      </div>

      {/* Battery Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Battery Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatusCard
            title="Battery Level"
            value={batteryPercentage.toFixed(1)}
            unit="%"
            icon={batteryIcon}
            color={
              batteryPercentage >= 50
                ? "green"
                : batteryPercentage >= 20
                ? "yellow"
                : "red"
            }
          />
          <StatusCard
            title="Battery Capacity"
            value={formatEnergy(batteryCapacity)}
            icon={batteryIcon}
            color="blue"
          />
          <StatusCard
            title="Battery Voltage"
            value={formatVoltage(batteryVoltage)}
            icon={voltageIcon}
            color="blue"
          />
          <StatusCard
            title="Battery Current"
            value={formatCurrent(batteryCurrent)}
            icon={powerIcon}
            color="blue"
          />
        </div>
      </div>

      {/* Power Flow */}
      <PowerFlow data={data} />

      {/* AC Power Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">AC Power</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatusCard
            title="AC Input Power"
            value={formatPower(acInputPower)}
            icon={powerIcon}
            color="green"
          />
          <StatusCard
            title="AC Output Power"
            value={formatPower(acOutputPower)}
            icon={powerIcon}
            color="orange"
          />
          <StatusCard
            title="AC Input Voltage"
            value={formatVoltage(acInputVoltage)}
            icon={voltageIcon}
            color="blue"
          />
          <StatusCard
            title="AC Output Voltage"
            value={formatVoltage(acOutputVoltage)}
            icon={voltageIcon}
            color="blue"
          />
        </div>
      </div>

      {/* DC Power Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">DC Power</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatusCard
            title="DC Input Power"
            value={formatPower(dcInputPower)}
            icon={powerIcon}
            color="green"
          />
          <StatusCard
            title="DC Output Power"
            value={formatPower(dcOutputPower)}
            icon={powerIcon}
            color="purple"
          />
        </div>
      </div>

      {/* Raw Data (for debugging) */}
      {process.env.NODE_ENV === "development" && (
        <div className="bg-gray-50 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Raw Data (Debug)
          </h3>
          <pre className="text-xs text-gray-600 overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
