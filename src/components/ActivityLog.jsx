import { useState } from "react";
import { useBatteryActivity } from "../hooks/useBatteryActivity";

export default function ActivityLog() {
  const { currentStatus, chargeSessions, history, loading, error, refreshAll } =
    useBatteryActivity();
  const [showMore, setShowMore] = useState(false);

  const formatDuration = (minutes) => {
    if (!minutes) return "0m";
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
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

  const getChargeTypeIcon = (type) => {
    switch (type) {
      case "AC":
        return "⚡";
      case "DC":
        return "🔋";
      case "Solar":
        return "☀️";
      default:
        return "🔌";
    }
  };

  const getChargeSpeed = (avgPower) => {
    if (avgPower > 1000) return { text: "FAST", color: "text-red-400" };
    if (avgPower > 500) return { text: "NORMAL", color: "text-yellow-400" };
    return { text: "SLOW", color: "text-blue-400" };
  };

  const getBatteryColor = (percent) => {
    if (percent >= 80) return "text-green-400";
    if (percent >= 50) return "text-yellow-400";
    if (percent >= 20) return "text-orange-400";
    return "text-red-400";
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-cyan-300 font-mono">LOADING ACTIVITY DATA...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-400/30 p-4 rounded-lg">
        <div className="flex items-center">
          <div className="text-red-400 text-xl mr-3">⚠</div>
          <div>
            <div className="text-red-300 font-mono text-sm">SYSTEM ERROR</div>
            <div className="text-gray-400 text-xs font-mono">{error}</div>
          </div>
        </div>
        <button
          onClick={refreshAll}
          className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-mono rounded transition-colors"
        >
          RETRY
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Status - Sci-Fi Style */}
      {currentStatus && (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 via-emerald-500/20 to-cyan-400/20 rounded-lg blur-sm"></div>
          <div className="relative bg-slate-900/50 backdrop-blur-sm border border-green-400/30 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="relative group" 
                   onMouseEnter={(e) => {
                     const tooltip = e.currentTarget.querySelector('.core-status-tooltip');
                     if (tooltip) tooltip.style.opacity = '1';
                   }}
                   onMouseLeave={(e) => {
                     const tooltip = e.currentTarget.querySelector('.core-status-tooltip');
                     if (tooltip) tooltip.style.opacity = '0';
                   }}>
                <h4 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 font-mono">
                  CORE STATUS
                </h4>
                <div className="core-status-tooltip absolute bottom-full left-0 mb-2 px-3 py-2 bg-slate-900 border border-green-400/30 rounded-lg shadow-lg opacity-0 transition-opacity duration-200 pointer-events-none z-10 w-64">
                  <div className="text-green-300 text-sm font-mono mb-1">
                    CORE STATUS
                  </div>
                  <div className="text-gray-300 text-xs font-mono">
                    Real-time battery status showing current level, time
                    remaining, power draw, and active charging sessions with
                    progress tracking.
                  </div>
                </div>
              </div>
              <div className="text-xs text-green-300 font-mono">REAL-TIME</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-slate-800/50 border border-green-400/20 rounded-lg p-4">
                <div className="text-green-300 text-sm font-mono mb-1">
                  TIME REMAINING
                </div>
                <div className="text-white text-xl font-mono">
                  {currentStatus.time_remaining?.formatted || "Calculating..."}
                </div>
                <div className="text-green-400 text-xs font-mono">
                  ESTIMATED
                </div>
              </div>
              <div className="bg-slate-800/50 border border-green-400/20 rounded-lg p-4">
                <div className="text-green-300 text-sm font-mono mb-1">
                  CURRENT DRAW
                </div>
                <div className="text-white text-xl font-mono">
                  {currentStatus.current_output_watts?.toFixed(0) || 0}W
                </div>
                <div className="text-green-400 text-xs font-mono">
                  POWER USAGE
                </div>
              </div>
              <div className="bg-slate-800/50 border border-green-400/20 rounded-lg p-4">
                <div className="text-green-300 text-sm font-mono mb-1">
                  CORE LEVEL
                </div>
                <div className="text-white text-xl font-mono">
                  {currentStatus.battery_percent?.toFixed(1) || 0}%
                </div>
                <div className="text-green-400 text-xs font-mono">CAPACITY</div>
              </div>
            </div>

            {/* Charging Banner */}
            {currentStatus.is_charging && currentStatus.current_session && (
              <div className="bg-yellow-900/20 border border-yellow-400/30 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse mr-3"></div>
                  <div className="text-yellow-300 font-mono text-sm">
                    CHARGING IN PROGRESS:{" "}
                    {currentStatus.current_session.start_percent}% → 100% (
                    {formatDuration(
                      currentStatus.current_session.duration_minutes
                    )}{" "}
                    elapsed)
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Charge Sessions Timeline - Sci-Fi Style */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 via-pink-500/10 to-cyan-400/10 rounded-lg blur-sm"></div>
        <div className="relative bg-slate-900/50 backdrop-blur-sm border border-purple-400/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="relative group"
                 onMouseEnter={(e) => {
                   const tooltip = e.currentTarget.querySelector('.charge-session-tooltip');
                   if (tooltip) tooltip.style.opacity = '1';
                 }}
                 onMouseLeave={(e) => {
                   const tooltip = e.currentTarget.querySelector('.charge-session-tooltip');
                   if (tooltip) tooltip.style.opacity = '0';
                 }}>
              <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-mono">
                CHARGE SESSION LOG
              </h3>
              <div className="charge-session-tooltip absolute bottom-full left-0 mb-2 px-3 py-2 bg-slate-900 border border-purple-400/30 rounded-lg shadow-lg opacity-0 transition-opacity duration-200 pointer-events-none z-10 w-64">
                <div className="text-purple-300 text-sm font-mono mb-1">
                  CHARGE SESSION LOG
                </div>
                <div className="text-gray-300 text-xs font-mono">
                  Complete history of all charging sessions with duration,
                  efficiency, power consumption, and charging speed analysis
                  over time.
                </div>
              </div>
            </div>
            <div className="text-xs text-purple-300 font-mono">
              {chargeSessions.length} SESSIONS
            </div>
          </div>

          {chargeSessions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-purple-400 text-4xl mb-4">🔌</div>
              <p className="text-purple-300 font-mono">
                NO CHARGE SESSIONS RECORDED
              </p>
              <p className="text-gray-400 text-sm font-mono mt-2">
                Sessions will appear when charging begins
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {(showMore ? chargeSessions : chargeSessions.slice(0, 5)).map(
                (session, index) => {
                  const speed = getChargeSpeed(session.avg_input_power);
                  return (
                    <div
                      key={session.id || index}
                      className="bg-slate-800/50 border border-purple-400/20 rounded-lg p-4 backdrop-blur-sm hover:border-purple-400/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">
                            {getChargeTypeIcon(session.charge_type)}
                          </div>
                          <div>
                            <div className="text-white font-mono text-sm">
                              {session.charge_type} CHARGE:{" "}
                              {session.start_percent}% → {session.end_percent}%
                            </div>
                            <div className="text-purple-300 font-mono text-xs">
                              {formatDuration(session.duration_minutes)} •{" "}
                              {speed.text} •{" "}
                              {session.avg_input_power?.toFixed(0)}W avg
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-gray-400 font-mono text-xs">
                            {formatTimeAgo(session.end_time)}
                          </div>
                          <div className={`text-xs font-mono ${speed.color}`}>
                            {speed.text}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
              {chargeSessions.length > 5 && (
                <button
                  onClick={() => setShowMore(!showMore)}
                  className="w-full py-3 text-sm text-purple-400 hover:text-purple-300 font-mono border border-purple-400/30 hover:border-purple-400/50 rounded-lg transition-colors"
                >
                  {showMore
                    ? "SHOW LESS"
                    : `SHOW ${chargeSessions.length - 5} MORE SESSIONS`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Battery Level Trend - Sci-Fi Style */}
      {history.length > 0 && (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-cyan-500/10 to-teal-400/10 rounded-lg blur-sm"></div>
          <div className="relative bg-slate-900/50 backdrop-blur-sm border border-blue-400/30 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="relative group"
                   onMouseEnter={(e) => {
                     const tooltip = e.currentTarget.querySelector('.core-level-trend-tooltip');
                     if (tooltip) tooltip.style.opacity = '1';
                   }}
                   onMouseLeave={(e) => {
                     const tooltip = e.currentTarget.querySelector('.core-level-trend-tooltip');
                     if (tooltip) tooltip.style.opacity = '0';
                   }}>
                <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 font-mono">
                  CORE LEVEL TREND
                </h3>
                <div className="core-level-trend-tooltip absolute bottom-full left-0 mb-2 px-3 py-2 bg-slate-900 border border-blue-400/30 rounded-lg shadow-lg opacity-0 transition-opacity duration-200 pointer-events-none z-10 w-64">
                  <div className="text-blue-300 text-sm font-mono mb-1">
                    CORE LEVEL TREND
                  </div>
                  <div className="text-gray-300 text-xs font-mono">
                    Visual chart showing battery level changes over the last 24
                    hours. Each bar represents an hourly snapshot with
                    color-coded levels.
                  </div>
                </div>
              </div>
              <div className="text-xs text-blue-300 font-mono">
                LAST 24H • {history.length} POINTS
              </div>
            </div>
            <div className="h-32 flex items-end space-x-1 bg-slate-800/30 rounded-lg p-2">
              {history.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm font-mono">
                  NO DATA YET
                </div>
              ) : (
                history
                  .slice(0, 24)
                  .reverse()
                  .map((point, index) => {
                    const height = (point.battery_percent / 100) * 100;
                    const color =
                      point.battery_percent >= 80
                        ? "bg-green-400"
                        : point.battery_percent >= 50
                        ? "bg-yellow-400"
                        : point.battery_percent >= 20
                        ? "bg-orange-400"
                        : "bg-red-400";
                    return (
                      <div
                        key={index}
                        className={`flex-1 ${color} rounded-sm opacity-80 hover:opacity-100 transition-opacity`}
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`${point.battery_percent?.toFixed(
                          1
                        )}% at ${new Date(
                          point.timestamp
                        ).toLocaleTimeString()}`}
                      ></div>
                    );
                  })
              )}
            </div>
            <div className="mt-2 text-xs text-blue-300 font-mono text-center">
              LAST 24 HOURS (HOURLY SNAPSHOTS)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
