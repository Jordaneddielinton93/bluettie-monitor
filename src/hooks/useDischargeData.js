import { useState, useEffect, useCallback } from "react";

const API_BASE =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_BASE || "http://localhost:8083"
    : "http://localhost:8083";

export function useDischargeData() {
  const [currentDischarge, setCurrentDischarge] = useState(null);
  const [dischargeHistory, setDischargeHistory] = useState([]);
  const [dischargeStats, setDischargeStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCurrentDischarge = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/discharge/current`);
      if (!response.ok) throw new Error("Failed to fetch current discharge");
      const data = await response.json();
      setCurrentDischarge(data);
      return data;
    } catch (err) {
      console.error("Error fetching current discharge:", err);
      setError(err.message);
      return null;
    }
  }, []);

  const fetchDischargeHistory = useCallback(async (hours = 24, limit = 50) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/discharge/history?hours=${hours}&limit=${limit}`
      );
      if (!response.ok) throw new Error("Failed to fetch discharge history");
      const data = await response.json();
      setDischargeHistory(data.sessions || []);
      return data;
    } catch (err) {
      console.error("Error fetching discharge history:", err);
      setError(err.message);
      return null;
    }
  }, []);

  const fetchDischargeStats = useCallback(async (days = 7) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/discharge/stats?days=${days}`
      );
      if (!response.ok) throw new Error("Failed to fetch discharge stats");
      const data = await response.json();
      setDischargeStats(data);
      return data;
    } catch (err) {
      console.error("Error fetching discharge stats:", err);
      // Don't set error for stats as it's optional
      return null;
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchCurrentDischarge(),
        fetchDischargeHistory(),
        fetchDischargeStats(),
      ]);
    } catch (err) {
      console.error("Error refreshing discharge data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchCurrentDischarge, fetchDischargeHistory, fetchDischargeStats]);

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [refreshAll]);

  return {
    currentDischarge,
    dischargeHistory,
    dischargeStats,
    loading,
    error,
    refreshAll,
    fetchCurrentDischarge,
    fetchDischargeHistory,
    fetchDischargeStats,
  };
}
