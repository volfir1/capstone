import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '@config/api/apiClient';
import notificationSound from '@assets/audio/notification.mp3';
import { getSocket } from '@/config/socket';

const POLL_INTERVAL = 10000; // 10 seconds

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);
  const prevUnreadRef = useRef(null);
  const audioRef = useRef(null);

  // Play notification sound when new unread notifications arrive
  const playNotificationSound = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(notificationSound);
        audioRef.current.volume = 0.5;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } catch {
      // silent — browser may block autoplay
    }
  }, []);

  // Always fetches the full notification list + count in one call
  const fetchNotifications = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/notifications?page=${page}&limit=20`);
      if (res.data.success && mountedRef.current) {
        const newUnread = res.data.unreadCount;

        // Play sound if unread count increased (skip initial fetch)
        if (prevUnreadRef.current !== null && newUnread > prevUnreadRef.current) {
          playNotificationSound();
        }
        prevUnreadRef.current = newUnread;

        setNotifications(res.data.data);
        setUnreadCount(newUnread);
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

  // Initial fetch + polling + real-time socket listener
  useEffect(() => {
    mountedRef.current = true;
    fetchNotifications();
    intervalRef.current = setInterval(() => fetchNotifications(), POLL_INTERVAL);

    // Listen for real-time notification pushes via Socket.IO
    const socket = getSocket();
    const handleNewNotification = () => {
      if (mountedRef.current) fetchNotifications();
    };
    socket.on('new-notification', handleNewNotification);

    return () => {
      mountedRef.current = false;
      clearInterval(intervalRef.current);
      socket.off('new-notification', handleNewNotification);
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
