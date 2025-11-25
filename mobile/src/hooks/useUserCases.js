import { useState, useEffect } from "react";
import apiClient from "../api/apiClient";
import { Alert } from "react-native";

export const useUserCases = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assignedCase, setAssignedCase] = useState(null);

  const fetchUserCases = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/cases/user-cases");
      
      if (response.data.success) {
        setCases(response.data.data);
        
        // Find the first case with an assigned attorney
        const caseWithAttorney = response.data.data.find(c => c.attorneyId);
        setAssignedCase(caseWithAttorney || null);
      }
    } catch (error) {
      console.error("Error fetching cases:", error);
      if (error.response?.status !== 404) {
        Alert.alert("Error", "Failed to load your cases");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserCases();
  }, []);

  return {
    cases,
    assignedCase,
    loading,
    refreshCases: fetchUserCases,
  };
};
