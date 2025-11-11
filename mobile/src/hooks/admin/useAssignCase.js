import { useState, useEffect } from "react";
import apiClient from "../../api/apiClient";
import { Alert } from "react-native";

export const useAssignCase = () => {
  const [cases, setCases] = useState([]);
  const [attorneys, setAttorneys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/cases/admin/all-cases");
      
      if (response.data.success) {
        setCases(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching cases:", error);
      Alert.alert("Error", "Failed to load cases");
    } finally {
      setLoading(false);
    }
  };

  const fetchAttorneys = async () => {
    try {
      const response = await apiClient.get("/cases/admin/attorneys");
      
      if (response.data.success) {
        setAttorneys(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching attorneys:", error);
      Alert.alert("Error", "Failed to load attorneys");
    }
  };

  const assignAttorneyToCase = async (caseId, attorneyId) => {
    try {
      setAssigning(true);
      const response = await apiClient.put(`/cases/admin/assign/${caseId}`, {
        attorneyId,
      });
      
      if (response.data.success) {
        Alert.alert("Success", "Attorney assigned successfully");
        // Refresh cases list
        await fetchCases();
        return true;
      }
    } catch (error) {
      console.error("Error assigning attorney:", error);
      Alert.alert("Error", "Failed to assign attorney");
      return false;
    } finally {
      setAssigning(false);
    }
  };

  useEffect(() => {
    fetchCases();
    fetchAttorneys();
  }, []);

  return {
    cases,
    attorneys,
    loading,
    assigning,
    assignAttorneyToCase,
    refreshCases: fetchCases,
  };
};
