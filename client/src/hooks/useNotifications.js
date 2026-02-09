import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '@config/api/apiClient';

const POLL_INTERVAL = 10000; // 10 seconds

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  // Always fetches the full notification list + count in one call
  const fetchNotifications = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/notifications?page=${page}&limit=20`);
      if (res.data.success && mountedRef.current) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.unreadCount);
        setTotal(res.data.total);
      }
    } catch (err) {
      // silent — don't break UI
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Mark as read error:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await apiClient.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Mark all as read error:', err);
    }
  }, []);

  const deleteNotification = useCallback(async (id) => {
    try {
      await apiClient.delete(`/notifications/${id}`);
      setNotifications((prev) => {
        const removed = prev.find((n) => n._id === id);
        if (removed && !removed.read) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n._id !== id);
      });
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Delete notification error:', err);
    }
  }, []);

  // Initial fetch + polling (always fetches full list)
  useEffect(() => {
    mountedRef.current = true;
    fetchNotifications();
    intervalRef.current = setInterval(() => fetchNotifications(), POLL_INTERVAL);
    return () => {
      mountedRef.current = false;
      clearInterval(intervalRef.current);
    };
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    total,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  };
}
