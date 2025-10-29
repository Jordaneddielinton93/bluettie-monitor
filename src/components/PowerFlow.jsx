import { formatPower } from "../utils/formatters";

export default function PowerFlow({ data }) {
  // API returns data directly, not wrapped in device name
  const deviceData = data;

  // Extract power values (these property names may vary based on your Bluetti model)
  const acInputPower = parseFloat(deviceData["ac_input_power"]) || 0;
  const acOutputPower = parseFloat(deviceData["ac_output_power"]) || 0;
  const dcInputPower = parseFloat(deviceData["dc_input_power"]) || 0;
  const dcOutputPower = parseFloat(deviceData["dc_output_power"]) || 0;

  const batteryPercentage =
    parseFloat(deviceData["total_battery_percent"]) || 0;
  const batteryCapacity = 6144; // Total capacity: AC200MAX (2048) + 2x B230 (2048 each)

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 via-blue-500/10 to-purple-500/10 rounded-xl blur-xl"></div>
      <div className="relative bg-slate-800/90 backdrop-blur-sm border border-cyan-400/30 rounded-xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 font-mono">
            POWER FLOW MATRIX
          </h3>
          <div className="text-xs text-cyan-300 font-mono">
            ENERGY DISTRIBUTION
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Input Sources */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-cyan-300 text-center font-mono">
              INPUT SOURCES
            </h4>
            <div className="bg-slate-900/50 border border-cyan-400/20 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-cyan-300 text-sm font-mono mb-1">
                AC INPUT
              </div>
              <div className="text-white text-lg font-mono">
                {formatPower(acInputPower)}
              </div>
              <div className="text-cyan-400 text-xs font-mono">ALTERNATING</div>
            </div>
            <div className="bg-slate-900/50 border border-green-400/20 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-green-300 text-sm font-mono mb-1">
                DC INPUT
              </div>
              <div className="text-white text-lg font-mono">
                {formatPower(dcInputPower)}
              </div>
              <div className="text-green-400 text-xs font-mono">DIRECT</div>
            </div>
          </div>

          {/* Central Battery Display */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              {/* Battery Circle */}
              <div className="w-32 h-32 rounded-full border-4 border-cyan-400/30 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center relative overflow-hidden">
                {/* Animated background */}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-green-400/20 to-cyan-400/20 rounded-full"
                  style={{
                    clipPath: `polygon(0 ${100 - batteryPercentage}%, 100% ${
                      100 - batteryPercentage
                    }%, 100% 100%, 0% 100%)`,
                  }}
                ></div>
                {/* Percentage text */}
                <div className="relative z-10 text-center">
                  <div className="text-white text-2xl font-mono font-bold">
                    {batteryPercentage.toFixed(0)}%
                  </div>
                  <div className="text-cyan-300 text-xs font-mono">CORE</div>
                </div>
                {/* Animated ring */}
                <div className="absolute inset-0 rounded-full border-2 border-cyan-400/50 animate-pulse"></div>
              </div>
            </div>

            {/* Power Flow Arrows */}
            <div className="flex flex-col items-center space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-cyan-400/20 rounded flex items-center justify-center">
                  <div className="w-0 h-0 border-l-2 border-r-2 border-b-4 border-transparent border-b-cyan-400"></div>
                </div>
                <span className="text-cyan-300 text-xs font-mono">INPUT</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-green-400/20 rounded flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-green-400 rounded"></div>
                </div>
                <span className="text-green-300 text-xs font-mono">CORE</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-orange-400/20 rounded flex items-center justify-center">
                  <div className="w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-orange-400"></div>
                </div>
                <span className="text-orange-300 text-xs font-mono">
                  OUTPUT
                </span>
              </div>
            </div>
          </div>

          {/* Output Loads */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-orange-300 text-center font-mono">
              OUTPUT LOADS
            </h4>
            <div className="bg-slate-900/50 border border-orange-400/20 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-orange-300 text-sm font-mono mb-1">
                AC OUTPUT
              </div>
              <div className="text-white text-lg font-mono">
                {formatPower(acOutputPower)}
              </div>
              <div className="text-orange-400 text-xs font-mono">
                ALTERNATING
              </div>
            </div>
            <div className="bg-slate-900/50 border border-purple-400/20 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-purple-300 text-sm font-mono mb-1">
                DC OUTPUT
              </div>
              <div className="text-white text-lg font-mono">
                {formatPower(dcOutputPower)}
              </div>
              <div className="text-purple-400 text-xs font-mono">DIRECT</div>
            </div>
          </div>
        </div>

        {/* Power Flow Visualization */}
        <div className="mt-6 p-4 bg-slate-900/30 rounded-lg border border-cyan-400/20">
          <div className="text-cyan-300 text-sm font-mono mb-2 text-center">
            ENERGY FLOW STATUS
          </div>
          <div className="flex justify-between items-center text-xs font-mono">
            <div className="text-cyan-400">
              IN: {formatPower(acInputPower + dcInputPower)}
            </div>
            <div className="text-green-400">
              STORED: {formatPower((batteryPercentage / 100) * batteryCapacity)}
            </div>
            <div className="text-orange-400">
              OUT: {formatPower(acOutputPower + dcOutputPower)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
