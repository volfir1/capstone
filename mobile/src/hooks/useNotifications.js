import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification as deleteNotifApi, clearAllNotifications as clearAllApi } from '../api/userApi';

const POLL_INTERVAL = 10000; // 10 seconds

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  const fetchNotifs = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await fetchNotifications(page, 20);
      if (res.success && mountedRef.current) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount);
        setTotal(res.total);
      }
    } catch (err) {
      // silent — don't break UI
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => (n._id === id ? { ...n, read: true } : n)));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Mark as read error:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Mark all as read error:', err);
    }
  }, []);

  const deleteNotif = useCallback(async (id) => {
    try {
      await deleteNotifApi(id);
      setNotifications(prev => {
        const removed = prev.find(n => n._id === id);
        if (removed && !removed.read) {
          setUnreadCount(c => Math.max(0, c - 1));
        }
        return prev.filter(n => n._id !== id);
      });
      setTotal(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Delete notification error:', err);
    }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      await clearAllApi();
      setNotifications([]);
      setUnreadCount(0);
      setTotal(0);
    } catch (err) {
      console.error('Clear all notifications error:', err);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchNotifs();
    intervalRef.current = setInterval(() => fetchNotifs(), POLL_INTERVAL);
    return () => {
      mountedRef.current = false;
      clearInterval(intervalRef.current);
    };
  }, [fetchNotifs]);

  return {
    notifications,
    unreadCount,
    loading,
    total,
    fetchNotifications: fetchNotifs,
    markAsRead,
    markAllAsRead,
    deleteNotification: deleteNotif,
    clearAllNotifications: clearAll,
    refresh: fetchNotifs,
  };
}
