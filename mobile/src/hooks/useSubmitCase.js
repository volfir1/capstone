import { useState } from "react";
import { Alert } from "react-native";
import apiClient from "../api/apiClient";

export const useSubmitCase = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submitCase = async (caseData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiClient.post("/cases/submit", {
        caseTitle: caseData.title,
        caseType: caseData.type,
        shortDescription: caseData.shortDescription,
        detailedDescription: caseData.detailedDescription,
      });

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message,
        };
      } else {
        throw new Error(response.data.message || "Failed to submit case");
      }
    } catch (err) {
      console.error("Submit case error:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "An error occurred while submitting the case";
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUserCases = async () => {
    try {
      const response = await apiClient.get("/cases/user-cases");
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      } else {
        throw new Error(response.data.message || "Failed to fetch cases");
      }
    } catch (err) {
      console.error("Get cases error:", err);
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Failed to fetch cases",
      };
    }
  };

  const getCaseById = async (caseId) => {
    try {
      const response = await apiClient.get(`/cases/${caseId}`);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      } else {
        throw new Error(response.data.message || "Failed to fetch case");
      }
    } catch (err) {
      console.error("Get case error:", err);
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Failed to fetch case",
      };
    }
  };

  return {
    isSubmitting,
    error,
    submitCase,
    getUserCases,
    getCaseById,
  };
};
