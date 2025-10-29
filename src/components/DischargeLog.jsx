import { useState, useEffect, useRef } from "react";
import { useDischargeData } from "../hooks/useDischargeData";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

export default function DischargeLog() {
  const {
    currentDischarge,
    dischargeHistory,
    dischargeStats,
    loading,
    error,
    refreshAll,
  } = useDischargeData();
  const [showMore, setShowMore] = useState(false);
  const [timeInterval, setTimeInterval] = useState(() => {
    // Load from localStorage or default to "hourly"
    return localStorage.getItem("dischargeTimeInterval") || "hourly";
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const timeIntervalOptions = [
    { value: "10min", label: "10 MINUTES" },
    { value: "20min", label: "20 MINUTES" },
    { value: "30min", label: "30 MINUTES" },
    { value: "40min", label: "40 MINUTES" },
    { value: "50min", label: "50 MINUTES" },
    { value: "hourly", label: "HOURLY" },
    { value: "daily", label: "DAILY" },
  ];

  const getCurrentIntervalLabel = () => {
    return (
      timeIntervalOptions.find((opt) => opt.value === timeInterval)?.label ||
      "HOURLY"
    );
  };

  const handleTimeIntervalChange = async (newInterval) => {
    setTimeInterval(newInterval);
    localStorage.setItem("dischargeTimeInterval", newInterval);
    setIsDropdownOpen(false);
    
    // Convert interval to minutes and update database
    const intervalMinutes = getIntervalMinutes(newInterval);
    try {
      const response = await fetch(`${API_BASE}/api/discharge/interval`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interval_minutes: intervalMinutes,
        }),
      });
      
      if (!response.ok) {
        const errData = await response.json();
        console.error("Error updating discharge interval:", errData.error);
      }
    } catch (err) {
      console.error("Error updating discharge interval:", err);
    }
  };

  const getIntervalMinutes = (interval) => {
    switch (interval) {
      case "10min": return 10;
      case "20min": return 20;
      case "30min": return 30;
      case "40min": return 40;
      case "50min": return 50;
      case "hourly": return 60;
      case "daily": return 1440;
      default: return 10;
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "Unknown";
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    } else {
      // Show actual time instead of "Just now"
      return time.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const getDischargeRateColor = (rate) => {
    if (rate >= 5) return "text-red-400"; // High discharge
    if (rate >= 2) return "text-yellow-400"; // Medium discharge
    if (rate >= 0.5) return "text-green-400"; // Low discharge
    return "text-blue-400"; // Very low discharge
  };

  const getDischargeRateText = (rate) => {
    if (rate >= 5) return "HIGH";
    if (rate >= 2) return "MEDIUM";
    if (rate >= 0.5) return "LOW";
    return "MINIMAL";
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-cyan-300 font-mono">LOADING DISCHARGE DATA...</div>
      </div>
    );
  }

  // Don't show error state - just show no data message

  return (
    <div className="space-y-6">
      {/* Current Discharge Status - Sci-Fi Style */}
      {currentDischarge && currentDischarge.data_available && (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 via-red-500/20 to-yellow-400/20 rounded-lg blur-sm"></div>
          <div className="relative bg-slate-900/50 backdrop-blur-sm border border-orange-400/30 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400 font-mono">
                DISCHARGE ANALYSIS
              </h4>
              <div className="flex items-center space-x-3">
                {/* Time Interval Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="px-3 py-1 bg-slate-700/50 hover:bg-slate-600/50 text-orange-300 hover:text-white font-mono text-xs rounded-lg transition-colors duration-200 flex items-center"
                  >
                    {getCurrentIntervalLabel()}
                    <ChevronDownIcon className="h-3 w-3 ml-1" />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-orange-400/30 rounded-lg shadow-lg z-10 min-w-[120px]">
                      {timeIntervalOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleTimeIntervalChange(option.value)}
                          className={`w-full px-3 py-2 text-left text-xs font-mono transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg ${
                            timeInterval === option.value
                              ? "bg-orange-600/50 text-orange-300"
                              : "text-gray-300 hover:bg-slate-700/50 hover:text-white"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-slate-800/50 border border-orange-400/20 rounded-lg p-4">
                <div className="text-orange-300 text-sm font-mono mb-1">
                  ESTIMATED RUNTIME
                </div>
                <div className="text-white text-xl font-mono">
                  {currentDischarge.formatted_time_remaining ||
                    "Calculating..."}
                </div>
                <div className="text-orange-400 text-xs font-mono">
                  BASED ON HISTORY
                </div>
              </div>
              <div className="bg-slate-800/50 border border-orange-400/20 rounded-lg p-4">
                <div className="text-orange-300 text-sm font-mono mb-1">
                  DISCHARGE RATE
                </div>
                <div
                  className={`text-xl font-mono ${getDischargeRateColor(
                    currentDischarge.discharge_rate_percent_per_hour
                  )}`}
                >
                  {currentDischarge.discharge_rate_percent_per_hour?.toFixed(
                    2
                  ) || 0}
                  %/hr
                </div>
                <div className="text-orange-400 text-xs font-mono">
                  {getDischargeRateText(
                    currentDischarge.discharge_rate_percent_per_hour
                  )}
                </div>
              </div>
              <div className="bg-slate-800/50 border border-orange-400/20 rounded-lg p-4">
                <div className="text-orange-300 text-sm font-mono mb-1">
                  POWER CONSUMPTION
                </div>
                <div className="text-white text-xl font-mono">
                  {currentDischarge.avg_power_consumption?.toFixed(0) || 0}W
                </div>
                <div className="text-orange-400 text-xs font-mono">AVERAGE</div>
              </div>
              <div className="bg-slate-800/50 border border-orange-400/20 rounded-lg p-4">
                <div className="text-orange-300 text-sm font-mono mb-1">
                  LAST UPDATE
                </div>
                <div className="text-white text-xl font-mono">
                  {formatTimeAgo(currentDischarge.last_updated)}
                </div>
                <div className="text-orange-400 text-xs font-mono">
                  HOURLY LOG
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discharge History Timeline - Sci-Fi Style */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-cyan-500/10 to-teal-400/10 rounded-lg blur-sm"></div>
        <div className="relative bg-slate-900/50 backdrop-blur-sm border border-blue-400/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 font-mono">
              DISCHARGE SESSION LOG
            </h3>
            <div className="text-xs text-blue-300 font-mono">
              {dischargeHistory.length} SESSIONS
            </div>
          </div>

          {dischargeHistory.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-blue-400 text-4xl mb-4">📊</div>
              <p className="text-blue-300 font-mono">
                NO DISCHARGE DATA RECORDED
              </p>
              <p className="text-gray-400 text-sm font-mono mt-2">
                Hourly data will appear as the system collects information
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {(showMore ? dischargeHistory : dischargeHistory.slice(0, 8)).map(
                (session, index) => {
                  const rateColor = getDischargeRateColor(
                    session.discharge_rate_percent_per_hour
                  );
                  const rateText = getDischargeRateText(
                    session.discharge_rate_percent_per_hour
                  );

                  return (
                    <div
                      key={session.timestamp || index}
                      className="bg-slate-800/50 border border-blue-400/20 rounded-lg p-4 backdrop-blur-sm hover:border-blue-400/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-2xl">🔋</div>
                          <div>
                            <div className="text-white font-mono text-sm">
                              {session.battery_percent?.toFixed(1)}% •{" "}
                              {session.formatted_time_remaining} remaining
                            </div>
                            <div className="text-blue-300 font-mono text-xs">
                              Rate:{" "}
                              {session.discharge_rate_percent_per_hour?.toFixed(
                                2
                              )}
                              %/hr • Power:{" "}
                              {session.avg_power_consumption?.toFixed(0)}W avg
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-gray-400 font-mono text-xs">
                            {formatTimeAgo(session.timestamp)}
                          </div>
                          <div className={`text-xs font-mono ${rateColor}`}>
                            {rateText}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
              {dischargeHistory.length > 8 && (
                <button
                  onClick={() => setShowMore(!showMore)}
                  className="w-full py-3 text-sm text-blue-400 hover:text-blue-300 font-mono border border-blue-400/30 hover:border-blue-400/50 rounded-lg transition-colors"
                >
                  {showMore
                    ? "SHOW LESS"
                    : `SHOW ${dischargeHistory.length - 8} MORE SESSIONS`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Discharge Statistics - Sci-Fi Style */}
      {dischargeStats && dischargeStats.total_sessions > 0 && (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 via-pink-500/10 to-cyan-400/10 rounded-lg blur-sm"></div>
          <div className="relative bg-slate-900/50 backdrop-blur-sm border border-purple-400/30 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-mono">
                DISCHARGE STATISTICS
              </h3>
              <div className="text-xs text-purple-300 font-mono">
                {dischargeStats.period_days} DAYS
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800/50 border border-purple-400/20 rounded-lg p-4">
                <div className="text-purple-300 text-sm font-mono mb-2">
                  DISCHARGE RATE
                </div>
                <div className="text-white font-mono text-sm">
                  Avg:{" "}
                  {dischargeStats.discharge_rate?.avg_percent_per_hour?.toFixed(
                    2
                  )}
                  %/hr
                </div>
                <div className="text-white font-mono text-sm">
                  Range:{" "}
                  {dischargeStats.discharge_rate?.min_percent_per_hour?.toFixed(
                    2
                  )}{" "}
                  -{" "}
                  {dischargeStats.discharge_rate?.max_percent_per_hour?.toFixed(
                    2
                  )}
                  %/hr
                </div>
              </div>
              <div className="bg-slate-800/50 border border-purple-400/20 rounded-lg p-4">
                <div className="text-purple-300 text-sm font-mono mb-2">
                  POWER CONSUMPTION
                </div>
                <div className="text-white font-mono text-sm">
                  Avg: {dischargeStats.power_consumption?.avg_watts?.toFixed(0)}
                  W
                </div>
                <div className="text-white font-mono text-sm">
                  Range:{" "}
                  {dischargeStats.power_consumption?.min_watts?.toFixed(0)} -{" "}
                  {dischargeStats.power_consumption?.max_watts?.toFixed(0)}W
                </div>
              </div>
              <div className="bg-slate-800/50 border border-purple-400/20 rounded-lg p-4">
                <div className="text-purple-300 text-sm font-mono mb-2">
                  PREDICTIONS
                </div>
                <div className="text-white font-mono text-sm">
                  Avg Est:{" "}
                  {dischargeStats.predictions?.avg_estimated_days?.toFixed(1)}{" "}
                  days
                </div>
                <div className="text-white font-mono text-sm">
                  Sessions: {dischargeStats.total_sessions}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Discharge Data - Show Edit Button */}
      {(!currentDischarge || !currentDischarge.data_available) && (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 via-red-500/20 to-yellow-400/20 rounded-lg blur-sm"></div>
          <div className="relative bg-slate-900/50 backdrop-blur-sm border border-orange-400/30 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400 font-mono">
                DISCHARGE ANALYSIS
              </h4>
              <div className="flex items-center space-x-3">
                {/* Time Interval Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="px-3 py-1 bg-slate-700/50 hover:bg-slate-600/50 text-orange-300 hover:text-white font-mono text-xs rounded-lg transition-colors duration-200 flex items-center"
                  >
                    {getCurrentIntervalLabel()}
                    <ChevronDownIcon className="h-3 w-3 ml-1" />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-orange-400/30 rounded-lg shadow-lg z-10 min-w-[120px]">
                      {timeIntervalOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleTimeIntervalChange(option.value)}
                          className={`w-full px-3 py-2 text-left text-xs font-mono transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg ${
                            timeInterval === option.value
                              ? "bg-orange-600/50 text-orange-300"
                              : "text-gray-300 hover:bg-slate-700/50 hover:text-white"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="text-center py-8">
              <div className="text-orange-300 text-lg font-mono mb-2">
                NO DISCHARGE DATA YET
              </div>
              <div className="text-gray-400 text-sm font-mono mb-4">
                Discharge logs will appear after initial discharge.
                <br />
                Use the time interval dropdown to select your preferred logging frequency.
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
