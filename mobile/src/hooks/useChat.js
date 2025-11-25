import { useState, useEffect, useCallback } from "react";
import apiClient from "../api/apiClient";
import { Alert } from "react-native";

export const useChat = (caseId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!caseId) return;
    
    try {
      setLoading(true);
      const response = await apiClient.get(`/chat/case/${caseId}`);
      
      if (response.data.success) {
        setMessages(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      Alert.alert("Error", "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return;

    try {
      setSending(true);
      const response = await apiClient.post("/chat/send", {
        caseId,
        message: messageText.trim(),
      });

      if (response.data.success) {
        // Add the new message to the list
        setMessages((prev) => [...prev, response.data.data]);
        return true;
      }
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message");
      return false;
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async () => {
    if (!caseId) return;

    try {
      await apiClient.put(`/chat/read/${caseId}`);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  useEffect(() => {
    fetchMessages();
    
    // Auto-refresh messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000);
    
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Mark messages as read when component mounts
  useEffect(() => {
    if (caseId) {
      markAsRead();
    }
  }, [caseId]);

  return {
    messages,
    loading,
    sending,
    sendMessage,
    refreshMessages: fetchMessages,
  };
};
