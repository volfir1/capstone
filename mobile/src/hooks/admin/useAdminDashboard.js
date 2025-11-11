import { useState, useEffect } from "react";
import apiClient from "../../api/apiClient";
import { Alert } from "react-native";

export const useAdminDashboard = () => {
  const [stats, setStats] = useState({
    totalCases: 0,
    totalUsers: 0,
    totalAttorneys: 0,
    unassignedCases: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/cases/admin/stats");
      
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      Alert.alert("Error", "Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    refreshStats: fetchStats,
  };
};
