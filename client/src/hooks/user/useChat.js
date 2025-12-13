import { useState, useEffect, useCallback, useRef } from "react";
import { notifications } from '@mantine/notifications';
import apiClient from "@config/api/apiClient";

export const useChat = (caseId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const isFetchingRef = useRef(false); // Prevent duplicate requests

  const fetchMessages = useCallback(async () => {
    if (!caseId || isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    try {
      setLoading(true);
      console.log('Fetching messages for case:', caseId);
      const response = await apiClient.get(`/chat/case/${caseId}`);
      
      if (response.data.success) {
        setMessages(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      // Don't show notification for rate limit errors during auto-refresh
      if (error.response?.status !== 429) {
        notifications.show({
          title: 'Error',
          message: 'Failed to load messages',
          color: 'red',
        });
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [caseId]);

  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return false;

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
      return false;
    } catch (error) {
      console.error("Error sending message:", error);
      notifications.show({
        title: 'Error',
        message: 'Failed to send message',
        color: 'red',
      });
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
    
    // Increased interval to 15 seconds to match mobile and avoid rate limiting
    const interval = setInterval(fetchMessages, 15000);
    
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