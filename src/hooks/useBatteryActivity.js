import { useState, useEffect, useCallback } from "react";

const API_BASE = "http://192.168.1.145:8083";

export function useBatteryActivity() {
  const [currentStatus, setCurrentStatus] = useState(null);
  const [chargeSessions, setChargeSessions] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCurrentStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/activity/current`);
      if (!response.ok) throw new Error("Failed to fetch current status");
      const data = await response.json();
      setCurrentStatus(data);
      return data;
    } catch (err) {
      console.error("Error fetching current status:", err);
      setError(err.message);
      return null;
    }
  }, []);

  const fetchChargeSessions = useCallback(async (limit = 10) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/activity/charge-sessions?limit=${limit}`
      );
      if (!response.ok) throw new Error("Failed to fetch charge sessions");
      const data = await response.json();
      setChargeSessions(data.sessions || []);
      return data.sessions || [];
    } catch (err) {
      console.error("Error fetching charge sessions:", err);
      setError(err.message);
      return [];
    }
  }, []);

  const fetchHistory = useCallback(async (hours = 24, limit = 100) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/activity/history?hours=${hours}&limit=${limit}`
      );
      if (!response.ok) throw new Error("Failed to fetch history");
      const data = await response.json();
      setHistory(data.history || []);
      return data.history || [];
    } catch (err) {
      console.error("Error fetching history:", err);
      setError(err.message);
      return [];
    }
  }, []);

  const fetchStats = useCallback(async (days = 7) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/activity/stats?days=${days}`
      );
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      setStats(data);
      return data;
    } catch (err) {
      console.error("Error fetching stats:", err);
      // Don't set error for stats as it's optional
      return null;
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchCurrentStatus(),
        fetchChargeSessions(),
        fetchHistory(),
        fetchStats(),
      ]);
    } catch (err) {
      console.error("Error refreshing data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchCurrentStatus, fetchChargeSessions, fetchHistory, fetchStats]);

  // Initial load
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Auto-refresh current status every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchCurrentStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchCurrentStatus]);

  // Auto-refresh other data every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchChargeSessions();
      fetchHistory();
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchChargeSessions, fetchHistory]);

  return {
    currentStatus,
    chargeSessions,
    history,
    stats,
    loading,
    error,
    refreshAll,
    fetchCurrentStatus,
    fetchChargeSessions,
    fetchHistory,
    fetchStats,
  };
}
