import { useState, useEffect, useCallback, useRef, createElement } from 'react';
import apiClient from '@config/api/apiClient';
import notificationSound from '@assets/audio/notification.mp3';
import { getSocket } from '@/config/socket';
import { notifications as mantineNotifications } from '@mantine/notifications';

const POLL_INTERVAL = 60000; // 60 seconds (backup only — real-time updates via Socket.IO)

export function useNotifications(navigate) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);
  const prevUnreadRef = useRef(null);
  const audioRef = useRef(null);
  const shownToastIdsRef = useRef(new Set());

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
    // Polling is a fallback in case a socket event is missed; primary updates come from Socket.IO
    intervalRef.current = setInterval(() => fetchNotifications(), POLL_INTERVAL);

    // Listen for real-time notification pushes via Socket.IO
    const socket = getSocket();
    const handleNewNotification = (data) => {
      if (mountedRef.current) {
        fetchNotifications();
        // Show a toast popup so the user sees the notification immediately
        if (data && data.title) {
          // Prevent duplicate toasts for the same notification id within a short window
          const nid = data._id || data.id || null;
          if (nid && shownToastIdsRef.current.has(nid)) return;
          if (nid) {
            shownToastIdsRef.current.add(nid);
            // remove from recent set after the toast autoClose (plus small buffer)
            setTimeout(() => shownToastIdsRef.current.delete(nid), 10000);
          }
          const canNavigate = navigate && data.referenceId;
          const isCaseAssignment = data.type === 'case_assigned';
          const isAppointment = data.type === 'appointment_created' || data.type === 'appointment_updated';
          mantineNotifications.show({
            title: data.title,
            message: canNavigate
              ? createElement(
                  'div',
                  {
                    onClick: () => {
                      mantineNotifications.clean();
                      if (isCaseAssignment) {
                        navigate('/admin/assigned-cases');
                      } else if (isAppointment) {
                        navigate('/admin/clientformstatus');
                      } else {
                        navigate(`/admin/recommendation/${data.referenceId}`, {
                          state: { showClientInfo: true, isViewingExistingReview: true },
                        });
                      }
                    },
                    style: { cursor: 'pointer', margin: '-4px -8px', padding: '4px 8px' },
                  },
                  createElement('div', null, data.message || ''),
                  createElement(
                    'div',
                    { style: { fontSize: 11, color: '#886b30', fontWeight: 600, marginTop: 6 } },
                    isCaseAssignment ? 'Click to view assignments →' : isAppointment ? 'Click to view appointment →' : 'Click to view →'
                  )
                )
              : data.message || '',
            color: isCaseAssignment ? 'blue' : isAppointment ? 'green' : 'orange',
            autoClose: 6000,
            style: canNavigate ? { cursor: 'pointer' } : undefined,
          });
        }
      }
    };
    socket.on('new-notification', handleNewNotification);

    return () => {
      mountedRef.current = false;
      clearInterval(intervalRef.current);
      socket.off('new-notification', handleNewNotification);
    };
  }, [fetchNotifications]);

  const deleteAllNotifications = useCallback(async () => {
    try {
      await apiClient.delete('/notifications/clear-all');
      setNotifications([]);
      setUnreadCount(0);
      setTotal(0);
    } catch (err) {
      console.error('Delete all notifications error:', err);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    total,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    refresh: fetchNotifications,
  };
}
