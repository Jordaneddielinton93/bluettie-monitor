import { useState } from "react";
import { XMarkIcon, TrashIcon, PencilIcon } from "@heroicons/react/24/outline";

const API_BASE = "http://192.168.1.145:8083";

export default function DischargeEditDrawer({ isOpen, onClose, onDataUpdate }) {
  const [dischargeRate, setDischargeRate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Convert hours to minutes for API
      const minutes = parseFloat(estimatedHours) * 60;
      
      const response = await fetch(`${API_BASE}/api/discharge/edit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          discharge_rate_percent_per_hour: parseFloat(dischargeRate),
          estimated_hours_remaining: parseFloat(estimatedHours),
          estimated_minutes_remaining: minutes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update discharge data");
      }

      // Refresh data
      if (onDataUpdate) {
        await onDataUpdate();
      }

      onClose();
    } catch (err) {
      console.error("Error updating discharge data:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear ALL discharge data? This cannot be undone.")) {
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/discharge/clear`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to clear discharge data");
      }

      // Refresh data
      if (onDataUpdate) {
        await onDataUpdate();
      }

      onClose();
    } catch (err) {
      console.error("Error clearing discharge data:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-96 bg-slate-800 border-l border-orange-400/30 shadow-2xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-orange-400/20">
            <h2 className="text-xl font-bold text-orange-300 font-mono">
              EDIT DISCHARGE DATA
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-700/50 text-gray-400 hover:bg-red-500/50 hover:text-white transition-colors duration-200"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 space-y-6">
            {error && (
              <div className="bg-red-900/50 border border-red-400/30 rounded-lg p-4">
                <div className="text-red-400 text-sm font-mono">{error}</div>
              </div>
            )}

            {/* Discharge Rate Input */}
            <div className="space-y-3">
              <label className="block text-orange-300 text-sm font-mono">
                DISCHARGE RATE (%/hour)
              </label>
              <input
                type="number"
                step="0.1"
                value={dischargeRate}
                onChange={(e) => setDischargeRate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-orange-400/30 rounded-lg text-white font-mono focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 focus:outline-none"
                placeholder="e.g., 2.5"
              />
              <div className="text-gray-400 text-xs font-mono">
                Current discharge rate in percentage per hour
              </div>
            </div>

            {/* Estimated Hours Input */}
            <div className="space-y-3">
              <label className="block text-orange-300 text-sm font-mono">
                ESTIMATED HOURS REMAINING
              </label>
              <input
                type="number"
                step="0.1"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-orange-400/30 rounded-lg text-white font-mono focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 focus:outline-none"
                placeholder="e.g., 24.5"
              />
              <div className="text-gray-400 text-xs font-mono">
                Estimated hours until battery is empty
              </div>
            </div>

            {/* Auto-calculate button */}
            <button
              onClick={() => {
                if (dischargeRate && estimatedHours) {
                  const calculatedRate = (100 / parseFloat(estimatedHours)).toFixed(2);
                  setDischargeRate(calculatedRate);
                }
              }}
              className="w-full px-4 py-2 bg-blue-600/50 hover:bg-blue-600 text-blue-300 hover:text-white font-mono rounded-lg transition-colors duration-200"
            >
              AUTO-CALCULATE RATE
            </button>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-orange-400/20 space-y-3">
            <div className="flex space-x-3">
              <button
                onClick={handleSave}
                disabled={isLoading || !dischargeRate || !estimatedHours}
                className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-mono rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                {isLoading ? "SAVING..." : "SAVE CHANGES"}
              </button>
            </div>
            
            <button
              onClick={handleClearAll}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-red-600/50 hover:bg-red-600 text-red-300 hover:text-white font-mono rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              {isLoading ? "CLEARING..." : "CLEAR ALL DISCHARGE DATA"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
