import { useState, useEffect } from "react";
import apiClient from "../api/apiClient";
import { Alert } from "react-native";

export const useAssignedAttorney = (caseId) => {
  const [attorney, setAttorney] = useState(null);
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAttorney = async () => {
    if (!caseId) return;
    
    try {
      setLoading(true);
      const response = await apiClient.get(`/chat/attorney/${caseId}`);
      
      if (response.data.success) {
        setAttorney(response.data.data.attorney);
        setCaseData(response.data.data.case);
      }
    } catch (error) {
      console.error("Error fetching attorney:", error);
      // Don't show alert for 404 - just means no attorney assigned yet
      if (error.response?.status !== 404) {
        Alert.alert("Error", "Failed to load attorney information");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttorney();
  }, [caseId]);

  return {
    attorney,
    caseData,
    loading,
    refreshAttorney: fetchAttorney,
  };
};
