import { formatPower } from "../utils/formatters";

export default function PowerFlow({ data }) {
  const deviceName = Object.keys(data)[0];
  const deviceData = data[deviceName] || {};

  // Extract power values (these property names may vary based on your Bluetti model)
  const acInputPower = parseFloat(deviceData["ac_input_power"]) || 0;
  const acOutputPower = parseFloat(deviceData["ac_output_power"]) || 0;
  const dcInputPower = parseFloat(deviceData["dc_input_power"]) || 0;
  const dcOutputPower = parseFloat(deviceData["dc_output_power"]) || 0;

  const batteryPercentage = parseFloat(deviceData["battery_percentage"]) || 0;
  const batteryCapacity = parseFloat(deviceData["battery_capacity"]) || 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">Power Flow</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Input Sources */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700 text-center">
            Input Sources
          </h4>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-sm text-blue-700 mb-1">AC Input</div>
            <div className="text-xl font-bold text-blue-900">
              {formatPower(acInputPower)}
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-sm text-green-700 mb-1">DC Input</div>
            <div className="text-xl font-bold text-green-900">
              {formatPower(dcInputPower)}
            </div>
          </div>
        </div>

        {/* Battery */}
        <div className="flex flex-col items-center justify-center">
          <div className="bg-gray-50 border border-gray-200 rounded-full p-6 mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {batteryPercentage.toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">Battery</div>
            </div>
          </div>

          {/* Battery visual indicator */}
          <div className="w-24 h-12 border-2 border-gray-300 rounded-sm relative overflow-hidden">
            <div
              className="absolute bottom-0 left-0 h-full bg-green-500 transition-all duration-300"
              style={{
                width: `${Math.max(0, Math.min(100, batteryPercentage))}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Output Loads */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700 text-center">
            Output Loads
          </h4>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
            <div className="text-sm text-orange-700 mb-1">AC Output</div>
            <div className="text-xl font-bold text-orange-900">
              {formatPower(acOutputPower)}
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <div className="text-sm text-purple-700 mb-1">DC Output</div>
            <div className="text-xl font-bold text-purple-900">
              {formatPower(dcOutputPower)}
            </div>
          </div>
        </div>
      </div>

      {/* Power Flow Arrows (visual representation) */}
      <div className="mt-6 flex justify-center">
        <div className="flex items-center space-x-4 text-gray-400">
          <div className="text-center">
            <div className="text-sm">Input</div>
            <div className="text-2xl">↓</div>
          </div>
          <div className="text-center">
            <div className="text-sm">Battery</div>
            <div className="text-2xl">↕</div>
          </div>
          <div className="text-center">
            <div className="text-sm">Output</div>
            <div className="text-2xl">↓</div>
          </div>
        </div>
      </div>
    </div>
  );
}
