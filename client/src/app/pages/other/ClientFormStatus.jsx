import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Tabs, Card, Text, Badge, Group, Button, SimpleGrid, Container, Title,
  Paper, Box, Stack, Avatar, Menu, ActionIcon, Select, TextInput, Textarea, Modal, Loader, Center,
  Grid, Divider, ScrollArea, Tooltip, Pagination, Popover, SegmentedControl, Slider, UnstyledButton, NumberInput,
} from '@mantine/core';
import ClientFormStatusCalendar from '@components/calendar/ClientFormCalendar';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { useNavigate, useLocation } from 'react-router-dom';
import ClientFormStatusSkeleton from '@/components/skeleton/ClientFormStatusSkeleton';
import { useAuth } from '@/context/authContext';
import {
  IconCalendarEvent, IconClock, IconCheck,
  IconMapPin, IconDots, IconScale,
  IconEdit, IconX, IconSearch, IconEye, IconCalendar,
  IconPlus, IconChevronRight, IconAddressBook, IconInfoCircle, IconFileText,
  IconTrash, IconArrowRight, IconRotateClockwise
} from '@tabler/icons-react';
import { IconRefresh, IconBrandGoogle } from '@tabler/icons-react';
import {
  PRIMARY_GOLD,
  PRIMARY_BROWN,
  MUTED_OLIVE,
  THEMED_LIGHT_BG,
  CHARCOAL,
  ACCENT_TAN,
  BG
} from '@utils/constants';

const EVENT_TIME_SLOTS = [
  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM',
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  '06:00 PM'
];

function TypeableTimePicker({ value, onChange }) {
  const parseTime = (timeStr) => {
    if (!timeStr) return { hour: 9, minute: 0, ampm: 'AM' };
    const ampmMatch = String(timeStr).match(/(AM|PM)/i);
    const ampm = ampmMatch ? ampmMatch[0].toUpperCase() : 'AM';
    const cleanStr = String(timeStr).replace(/(AM|PM)/gi, '').trim();
    const [hStr, mStr] = cleanStr.split(':');
    let hour = parseInt(hStr || '9', 10);
    let minute = parseInt(mStr || '0', 10);
    if (isNaN(hour) || hour < 1) hour = 9;
    if (hour > 12) hour = 12;
    if (isNaN(minute) || minute < 0) minute = 0;
    if (minute > 59) minute = 59;
    return { hour, minute, ampm };
  };

  const { hour, minute, ampm } = parseTime(value);

  const handleHourChange = (val) => {
    let num = typeof val === 'number' ? val : parseInt(val, 10);
    if (isNaN(num)) num = 12;
    if (num < 1) num = 1;
    if (num > 12) num = 12;
    updateTime(num, minute, ampm);
  };

  const handleMinuteChange = (val) => {
    let num = typeof val === 'number' ? val : parseInt(val, 10);
    if (isNaN(num)) num = 0;
    if (num < 0) num = 0;
    if (num > 59) num = 59;
    updateTime(hour, num, ampm);
  };

  const updateTime = (newHour, newMinute, newAmpm) => {
    const formattedHour = String(newHour).padStart(2, '0');
    const formattedMinute = String(newMinute).padStart(2, '0');
    onChange(`${formattedHour}:${formattedMinute} ${newAmpm}`);
  };

  return (
    <Stack gap={4}>
      <Text size="sm" fw={500} c={CHARCOAL}>Time</Text>
      <Group gap={4} align="center" wrap="nowrap">
        <NumberInput
          value={hour}
          onChange={handleHourChange}
          min={1}
          max={12}
          allowNegative={false}
          allowDecimal={false}
          clampBehavior="strict"
          hideControls
          w={44}
          radius="md"
          styles={{ input: { textAlign: 'center', fontWeight: 600, paddingLeft: 2, paddingRight: 2 } }}
        />
        <Text fw={700} size="sm" c={PRIMARY_BROWN}>:</Text>
        <NumberInput
          value={minute}
          onChange={handleMinuteChange}
          min={0}
          max={59}
          allowNegative={false}
          allowDecimal={false}
          clampBehavior="strict"
          hideControls
          w={44}
          radius="md"
          styles={{ input: { textAlign: 'center', fontWeight: 600, paddingLeft: 2, paddingRight: 2 } }}
        />
        <SegmentedControl
          size="xs"
          value={ampm}
          onChange={(val) => updateTime(hour, minute, val)}
          data={['AM', 'PM']}
          color={PRIMARY_BROWN}
          radius="md"
          style={{ flexShrink: 0 }}
        />
      </Group>
    </Stack>
  );
}

export default function StaffAppointmentManager() {
  const { userData, refreshUserData } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [calendarFilter, setCalendarFilter] = useState('All');
  const [selectedFilterDate, setSelectedFilterDate] = useState(null);
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [editEventModal, setEditEventModal] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
  const [viewEventModal, setViewEventModal] = useState(false);
  const [viewingEvent, setViewingEvent] = useState(null);

  // Pagination State
  const [pendingPage, setPendingPage] = useState(1);
  const [interviewPage, setInterviewPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [isUpdatingEvent, setIsUpdatingEvent] = useState(false);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const [deleteAppointmentModal, setDeleteAppointmentModal] = useState(false);
  const [isDeletingAppointment, setIsDeletingAppointment] = useState(false);
  const [eventEditForm, setEventEditForm] = useState({
    title: '',
    description: '',
    eventDate: null,
    appointmentTime: '',
    eventType: 'appointment',
    location: '',
    clientName: '',
    assignedTo: '',
    priority: 'Medium',
  });
  const [newDate, setNewDate] = useState(null);
  const [newTime, setNewTime] = useState('');
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [appointmentToApprove, setAppointmentToApprove] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [isGoogleConnected, setIsGoogleConnected] = useState(userData?.google?.connected || false);
  const [googleConnectedEmail, setGoogleConnectedEmail] = useState(userData?.google?.connectedEmail || '');
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Keep isGoogleConnected in sync with userData (async load / refresh)
  useEffect(() => {
    if (userData?.google?.connected !== undefined) {
      setIsGoogleConnected(userData.google.connected);
      setGoogleConnectedEmail(userData.google.connectedEmail || '');
    }
  }, [userData?.google?.connected, userData?.google?.connectedEmail]);

  // Handle ?google=connected redirect from OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('google') === 'connected') {
      // Remove the query param from URL
      params.delete('google');
      const newSearch = params.toString();
      navigate(location.pathname + (newSearch ? `?${newSearch}` : ''), { replace: true });
      // Refresh user data to pick up the new google.connected status
        refreshUserData().then((freshData) => {
          if (freshData?.google?.connected) {
            setIsGoogleConnected(true);
            setGoogleConnectedEmail(freshData?.google?.connectedEmail || '');
            notifications.show({
              title: 'Connected!',
              message: freshData?.google?.connectedEmail
                ? `Google Calendar is now connected for this profile as ${freshData.google.connectedEmail}.`
                : 'Google Calendar is now connected for this profile.',
              color: 'green',
              icon: <IconCheck size={18} />,
            });
          }
        }).catch(() => { /* ignore */ });
    }
  }, [location.search]);

  // ─── Google Calendar connection helpers ───
  const isGoogleReconnectError = (err) => {
    const errData = err?.response?.data;
    return errData?.error === 'google_reconnect_required' ||
           errData?.error === 'User has not connected Google Calendar' ||
           errData?.error === 'profile_google_not_connected';
  };

  const handleConnectGoogleCalendar = async () => {
    try {
      setIsConnectingGoogle(true);
      const wasConnected = !!isGoogleConnected;
      const previousConnectedEmail = String(googleConnectedEmail || '').trim().toLowerCase();
      const { default: apiClient } = await import('@config/api/apiClient');
      const { data } = await apiClient.post('/google/connect');
      if (data?.url) {
        const popup = window.open(data.url, '_blank', 'width=600,height=700');
        if (!popup) {
          window.location.assign(data.url);
          return;
        }

        notifications.show({
          title: 'Google Calendar',
          message: 'Complete authorization for this selected profile in the new window. Come back here when done.',
          color: 'blue',
          autoClose: 8000,
        });
        let finished = false;
        const finishConnectionFlow = async (completed) => {
          if (finished) return;
          finished = true;
          clearInterval(pollInterval);
          clearTimeout(timeoutId);

          try {
            const freshData = await refreshUserData();
            const connected = !!freshData?.google?.connected;
            const connectedEmail = freshData?.google?.connectedEmail || '';
            const normalizedConnectedEmail = connectedEmail.trim().toLowerCase();
            const switchedAccount =
              !!normalizedConnectedEmail &&
              normalizedConnectedEmail !== previousConnectedEmail;

            if ((completed && connected) || (!completed && connected && (!wasConnected || switchedAccount))) {
              setIsGoogleConnected(true);
              setGoogleConnectedEmail(connectedEmail);
              notifications.show({
                title: 'Connected!',
                message: connectedEmail
                  ? `This profile is now using ${connectedEmail} for Google Calendar.`
                  : 'Google Calendar is now connected for this profile.',
                color: 'green',
                icon: <IconCheck size={18} />,
              });
            } else if (!completed) {
              notifications.show({
                title: 'Connection Cancelled',
                message: 'Google Calendar connection was not completed for this profile.',
                color: 'yellow',
              });
            }
          } catch (_) {
            if (completed) {
              notifications.show({
                title: 'Connected',
                message: 'Google Calendar authorization finished. Refresh the page if the status does not update.',
                color: 'blue',
              });
            }
          } finally {
            setIsConnectingGoogle(false);
          }
        };

        const pollInterval = setInterval(async () => {
          if (popup.closed) {
            await finishConnectionFlow(false);
            return;
          }

          try {
            const popupUrl = popup.location?.href || '';
            if (!popupUrl || !popupUrl.startsWith(window.location.origin)) {
              return;
            }

            const popupLocation = new URL(popupUrl);
            if (popupLocation.searchParams.get('google') !== 'connected') {
              return;
            }

            try {
              popup.close();
            } catch (_) {
              // ignore popup close issues
            }

            await finishConnectionFlow(true);
          } catch (_) {
            // Cross-origin access is expected until Google redirects back to our app.
          }
        }, 1500);

        const timeoutId = setTimeout(async () => {
          if (finished) return;
          try {
            popup.close();
          } catch (_) {
            // ignore popup close issues
          }
          await finishConnectionFlow(false);
        }, 120000);
      } else {
        throw new Error('Missing Google OAuth URL');
      }
    } catch (err) {
      console.error('handleConnectGoogleCalendar error:', err);
      notifications.show({ title: 'Error', message: 'Failed to start Google Calendar connection.', color: 'red' });
      setIsConnectingGoogle(false);
    }
  };

  const handleDisconnectGoogleCalendar = async () => {
    try {
      setIsConnectingGoogle(true);
      const { default: apiClient } = await import('@config/api/apiClient');
      await apiClient.post('/google/disconnect');
      await refreshUserData();
      setIsGoogleConnected(false);
      setGoogleConnectedEmail('');
      notifications.show({
        title: 'Disconnected',
        message: 'Google Calendar was disconnected from this profile.',
        color: 'green',
        icon: <IconCheck size={18} />,
      });
    } catch (err) {
      console.error('handleDisconnectGoogleCalendar error:', err);
      notifications.show({
        title: 'Error',
        message: 'Failed to disconnect Google Calendar from this profile.',
        color: 'red',
      });
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const promptGoogleReconnect = () => {
    notifications.show({
      title: 'Google Calendar Not Connected',
      message: 'Use the Google Calendar control in the header to connect a calendar for this profile, then try again.',
      color: 'orange',
      autoClose: 8000,
    });
    setIsGoogleConnected(false);
    setGoogleConnectedEmail('');
  };

  // ─── Filtered lists ───
  const filteredPending = useMemo(() => {
    return pendingAppointments
      .filter(a => a.status === 'auto-scheduled' && !a.calendarRecorded)
      .filter(a => !selectedFilterDate || (a.rawAppointedDate && new Date(a.rawAppointedDate).toDateString() === selectedFilterDate.toDateString()))
      .filter(a => !searchQuery || a.clientName.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [pendingAppointments, selectedFilterDate, searchQuery]);

  const filteredInterview = useMemo(() => {
    return pendingAppointments
      .filter(a => a.calendarRecorded && a.status === 'auto-scheduled')
      .filter(a => !selectedFilterDate || (a.rawAppointedDate && new Date(a.rawAppointedDate).toDateString() === selectedFilterDate.toDateString()))
      .filter(a => !searchQuery || a.clientName.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [pendingAppointments, selectedFilterDate, searchQuery]);

  const allAppointmentsForCalendar = useMemo(() => {
    const linkedEventIds = new Set(
      pendingAppointments
        .filter(apt => apt.calendarRecorded && apt.fullData?.calendarEventId)
        .map(apt => apt.fullData.calendarEventId)
    );
    const list = [
      ...pendingAppointments.map(apt => ({
        ...apt,
        uniqueId: `apt-${apt.id}`,
        date: apt.rawAppointedDate ? new Date(apt.rawAppointedDate) : null,
        isEvent: false
      })),
      ...events
        .filter(evt => !linkedEventIds.has(evt.id))
        .map(evt => ({
          ...evt,
          uniqueId: `evt-${evt.id}`,
          date: evt.rawAppointedDate ? new Date(evt.rawAppointedDate) : null,
          isEvent: true
        }))
    ];
    if (calendarFilter === 'All') return list;
    return list.filter(item => item.type === calendarFilter);
  }, [pendingAppointments, events, calendarFilter]);

  const loadAllData = async (opts = {}) => {
    const silent = opts.silent === true;
    if (!silent) setLoading(true);
    try {
      const { default: apiClient } = await import('@config/api/apiClient');
      const pendingResp = await apiClient.get('/clientsinfo');
      const docs = pendingResp?.data || [];
      const mapped = (Array.isArray(docs) ? docs : [])
        .map((d, idx) => ({
          id: d._id || idx,
          clientName: d.fullName || d.personal?.fullName || `${d.personal?.firstName || ''} ${d.personal?.lastName || ''}`.trim() || '',
          type: 'Initial Interview',
          submittedDate: d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
          scheduledDate: d.appointedDate ? new Date(d.appointedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD',
          rawAppointedDate: d.appointedDate || null,
          appointmentTime: d.appointmentTime ? (() => {
            const [hours, minutes] = d.appointmentTime.split(':');
            const h = parseInt(hours);
            const ampm = h >= 12 ? 'PM' : 'AM';
            const displayH = h % 12 || 12;
            return `${displayH}:${minutes} ${ampm}`;
          })() : '',
          status: d.status || 'auto-scheduled',
          calendarRecorded: Boolean(d.calendarRecorded),
          contactNumber: d.personal?.contactNumber || d.contactNumber || '',
          email: d.personal?.email || d.email || '',
          assignedTo: d.assignedTo || '',
          location: d.caseDetails?.location || d.location || 'SOLA Office',
          purpose: d.caseDetails?.purpose || d.caseDescription || `Client interview`,
          priority: d.priority || 'Medium',
          fullData: d
        }))
        .sort((a, b) => {
          if (!a.rawAppointedDate) return 1;
          if (!b.rawAppointedDate) return -1;
          return new Date(a.rawAppointedDate) - new Date(b.rawAppointedDate);
        });
      setPendingAppointments(mapped);

      const eventsResp = await apiClient.get('/events');
      const eventsData = eventsResp?.data || [];
      const mappedEvents = (Array.isArray(eventsData) ? eventsData : []).map((e, idx) => ({
        id: e._id || idx,
        clientName: e.title || e.clientName || 'Event',
        title: e.title || e.clientName || 'Event',
        type: e.eventType || 'other',
        eventType: e.eventType || 'other',
        rawAppointedDate: e.eventDate,
        scheduledDate: e.eventDate ? new Date(e.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD',
        appointmentTime: e.appointmentTime || (e.eventDate ? (() => {
          const d = new Date(e.eventDate);
          const h = d.getHours();
          const m = d.getMinutes();
          if (h === 0 && m === 0) return '';
          const ampm = h >= 12 ? 'PM' : 'AM';
          const displayH = h % 12 || 12;
          return `${displayH}:${String(m).padStart(2, '0')} ${ampm}`;
        })() : ''),
        location: e.location || 'TBD',
        priority: e.priority || 'Medium',
        status: e.status || 'scheduled',
        description: e.description || '',
        assignedTo: e.assignedTo || '',
        purpose: e.title || e.description || 'Event',
        fullData: e
      }));
      setEvents(mappedEvents);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const confirmApprove = async () => {
    if (!appointmentToApprove) return;
    try {
      await handleRecordToCalendars(appointmentToApprove);
    } finally {
      setApproveModalOpen(false);
      setAppointmentToApprove(null);
    }
  };

  useEffect(() => {
    loadAllData();
    const interval = setInterval(() => loadAllData({ silent: true }), 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDateClick = (date) => {
    setSelectedFilterDate(date);
    setPendingPage(1);
    setInterviewPage(1);
  };

  const handleResetDateFilter = () => {
    setSelectedFilterDate(null);
    setPendingPage(1);
    setInterviewPage(1);
  };

  const openAppointmentModal = (appointmentId) => {
    navigate(`/admin/clientinfo/${appointmentId}`);
  };

  const handleOpenEditAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    if (appointment?.rawAppointedDate) {
      try { setNewDate(new Date(appointment.rawAppointedDate)); }
      catch (e) { setNewDate(null); }
    } else {
      setNewDate(null);
    }
    setNewTime(appointment?.appointmentTime || '');
    setRescheduleModal(true);
  };

  const handleUpdateAppointment = async () => {
    if (!newDate || !selectedAppointment?.id) {
      notifications.show({ title: 'Error', message: 'Please select a valid date and time.', color: 'red' });
      return;
    }
    setIsUpdating(true);
    try {
      const { default: apiClient } = await import('@config/api/apiClient');
      if (selectedAppointment.calendarRecorded) {
        const eventId = selectedAppointment.fullData?.calendarEventId || '';
        const dateWithTime = new Date(newDate);
        if (newTime) {
          const timeMatch = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(newTime);
          if (timeMatch) {
            let h = parseInt(timeMatch[1]);
            const ampm = timeMatch[3].toUpperCase();
            if (ampm === 'PM' && h !== 12) h += 12;
            if (ampm === 'AM' && h === 12) h = 0;
            dateWithTime.setHours(h, parseInt(timeMatch[2]), 0, 0);
          }
        }
        await apiClient.post('/google/events/reschedule', {
          eventId,
          appointmentId: selectedAppointment.id,
          newDate: dateWithTime.toISOString(),
          newTime: newTime || '',
        });
        notifications.show({ title: 'Success', message: 'Appointment rescheduled and Google Calendar updated.', color: 'green', icon: <IconCheck size={18} /> });
      } else {
        const iso = newDate.toISOString();
        const payload = { appointedDate: iso, appointmentTime: newTime || '' };
        await apiClient.put(`/clientsinfo/${selectedAppointment.id}`, payload);
        notifications.show({ title: 'Success', message: 'Appointment updated successfully', color: 'green', icon: <IconCheck size={18} /> });
      }
      setRescheduleModal(false);
      await loadAllData();
    } catch (error) {
      if (isGoogleReconnectError(error)) {
        promptGoogleReconnect();
      } else {
        notifications.show({ title: 'Error', message: 'Failed to update appointment.', color: 'red' });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAppointment = async () => {
    if (!appointmentToDelete) return;
    setIsDeletingAppointment(true);
    try {
      const { default: apiClient } = await import('@config/api/apiClient');
      await apiClient.delete(`/clientsinfo/${appointmentToDelete.id}`);
      notifications.show({ title: 'Deleted', message: 'Appointment removed successfully.', color: 'green', icon: <IconCheck size={18} /> });
      setDeleteAppointmentModal(false);
      setAppointmentToDelete(null);
      await loadAllData();
    } catch (error) {
      notifications.show({ title: 'Error', message: 'Failed to delete appointment.', color: 'red' });
    } finally {
      setIsDeletingAppointment(false);
    }
  };

  const handleRecordToCalendars = async (appointment) => {
    if (!appointment?.id) return;
    setIsUpdating(true);
    try {
      const { default: apiClient } = await import('@config/api/apiClient');
      const title = appointment.clientName ? `${appointment.clientName} - Interview` : 'Client Interview';
      const description = appointment.purpose || `Case ID: ${appointment.id}`;
      const dateObj = new Date(appointment.rawAppointedDate);
      // Get raw 24h time from the DB document (e.g. "16:30")
      let rawTime = appointment.fullData?.appointmentTime || '';
      // Fallback: parse the display-formatted time (e.g. "4:30 PM") back to 24h
      if (!rawTime && appointment.appointmentTime) {
        const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(appointment.appointmentTime.trim());
        if (m) {
          let h = parseInt(m[1], 10);
          const period = m[3].toUpperCase();
          if (period === 'PM' && h < 12) h += 12;
          if (period === 'AM' && h === 12) h = 0;
          rawTime = `${String(h).padStart(2, '0')}:${m[2]}`;
        }
      }
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      let startHour = 9, startMin = 0;
      if (rawTime) {
        const parts = rawTime.split(':');
        startHour = parseInt(parts[0], 10);
        startMin = parseInt(parts[1], 10) || 0;
        if (Number.isNaN(startHour)) startHour = 9;
      }
      const startDateTime = `${year}-${month}-${day}T${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}:00`;
      const endHour = startHour + 1;
      const endDateTime = `${year}-${month}-${day}T${String(endHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}:00`;
      const solaLocation = 'SOLA - Sebastinian Office of Legal Aid, San Sebastian College - Recoletos Manila';
      const googleEvent = {
        summary: title,
        description,
        location: solaLocation,
        start: { dateTime: startDateTime, timeZone: 'Asia/Manila' },
        end: { dateTime: endDateTime, timeZone: 'Asia/Manila' },
      };
      await apiClient.post('/google/events/atomic', {
        event: googleEvent,
        meta: {
          appointmentId: appointment.id,
          title,
          description,
          eventDate: appointment.rawAppointedDate,
          eventType: 'appointment',
          location: solaLocation,
          clientName: appointment.clientName,
          status: 'scheduled',
        }
      });
      notifications.show({ title: 'Success', message: 'Synced to calendar successfully.', color: 'green' });
      await loadAllData();
    } catch (err) {
      if (isGoogleReconnectError(err)) {
        promptGoogleReconnect();
      } else {
        notifications.show({ title: 'Error', message: 'Failed to sync to calendar.', color: 'red' });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateEvent = async () => {
    if (!eventEditForm.title || !eventEditForm.eventDate) {
      notifications.show({ title: 'Error', message: 'Title and date are required', color: 'red' });
      return;
    }
    setIsUpdatingEvent(true);
    try {
      const { default: apiClient } = await import('@config/api/apiClient');
      if (selectedEvent) {
        await apiClient.put(`/events/${selectedEvent.id}`, eventEditForm);
        notifications.show({ title: 'Success', message: 'Event updated successfully', color: 'green', icon: <IconCheck size={18} /> });
      } else {
        await apiClient.post('/events', eventEditForm);
        notifications.show({ title: 'Success', message: 'Event created successfully', color: 'green', icon: <IconCheck size={18} /> });
      }
      setEditEventModal(false);
      await loadAllData();
    } catch (error) {
      notifications.show({ title: 'Error', message: 'Failed to save event', color: 'red' });
    } finally {
      setIsUpdatingEvent(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;
    setIsDeletingEvent(true);
    try {
      const { default: apiClient } = await import('@config/api/apiClient');
      await apiClient.delete(`/events/${eventToDelete.id}`);
      notifications.show({ title: 'Success', message: 'Event deleted successfully', color: 'green', icon: <IconCheck size={18} /> });
      setDeleteConfirmModal(false);
      await loadAllData();
    } catch (error) {
      notifications.show({ title: 'Error', message: 'Failed to delete event', color: 'red' });
    } finally {
      setIsDeletingEvent(false);
    }
  };

  // ── Appointment Card (side panel) ─────────────────────────────────────────
  const SideAppointmentCard = ({ item }) => (
    <Card
      shadow="xs"
      padding="md"
      radius="lg"
      withBorder
      style={{ borderLeft: `5px solid ${item.calendarRecorded ? 'green' : PRIMARY_GOLD}` }}
    >
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Box style={{ minWidth: 0, flex: 1 }}>
            <Text fw={600} size="sm" c={CHARCOAL} truncate>{item.clientName}</Text>
            <Text size="xs" c={MUTED_OLIVE} fw={500}>{item.type}</Text>
          </Box>
          <Menu shadow="md" position="bottom-end" radius="md">
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray" size="sm" style={{ flexShrink: 0 }}>
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => handleOpenEditAppointment(item)}>Edit Schedule</Menu.Item>
              <Menu.Item leftSection={<IconEye size={14} />} onClick={() => openAppointmentModal(item.id)}>View Details</Menu.Item>
              <Menu.Divider />
              <Menu.Item leftSection={<IconTrash size={14} />} color="red" onClick={() => { setAppointmentToDelete(item); setDeleteAppointmentModal(true); }}>Delete</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>

        <Group gap="md" wrap="wrap">
          <Group gap={4}>
            <IconClock size={14} color={PRIMARY_BROWN} />
            <Text size="xs" fw={600} c={CHARCOAL}>{item.appointmentTime || 'TBD'}</Text>
          </Group>
          <Group gap={4}>
            <IconCalendarEvent size={14} color={MUTED_OLIVE} />
            <Text size="xs" fw={600} c={MUTED_OLIVE}>{item.scheduledDate}</Text>
          </Group>
        </Group>

        <Group grow gap="xs" mt={4}>
          {!item.calendarRecorded ? (
            <Button
              size="compact-xs"
              radius="md"
              fw={600}
              style={{ backgroundColor: PRIMARY_BROWN }}
              onClick={() => { setAppointmentToApprove(item); setApproveModalOpen(true); }}
              loading={isUpdating}
            >
              Approve
            </Button>
          ) : (
            !['director', 'supervising_lawyer'].includes(userData?.role) && (
              <Button
                size="compact-xs"
                variant="outline"
                radius="md"
                fw={600}
                style={{ color: PRIMARY_BROWN, borderColor: PRIMARY_BROWN }}
                onClick={() => navigate(`/admin/recommendation/${item.id}`, { state: { showClientInfo: true } })}
              >
                Interview
              </Button>
            )
          )}
          {item.calendarRecorded && (
            <Button
              size="compact-xs"
              variant="light"
              radius="md"
              fw={600}
              color="gray"
              onClick={() => openAppointmentModal(item.id)}
            >
              Details
            </Button>
          )}
        </Group>
      </Stack>
    </Card>
  );

  if (loading) return <ClientFormStatusSkeleton />;

  const pendingCount = pendingAppointments.filter(a => a.status === 'auto-scheduled' && !a.calendarRecorded).length;
  const interviewCount = pendingAppointments.filter(a => a.calendarRecorded && a.status === 'auto-scheduled').length;

  return (
    <Box bg={BG} mih="100vh">
      <Container size="xl" py={{ base: 'md', sm: 'xl' }} px={{ base: 'md', sm: 'xl' }}>

        {/* ── A. Header ── */}
        <Group justify="space-between" align="center" mb="xl" wrap="wrap" gap="sm">
          {/* Left: Brand */}
          <Group gap="sm" align="center" wrap="nowrap">
            <Box style={{
              width: 44, height: 44, flexShrink: 0,
              borderRadius: '12px',
              background: `linear-gradient(45deg, ${PRIMARY_BROWN}, ${PRIMARY_GOLD})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(107,68,35,0.15)',
            }}>
              <IconScale size={22} color="white" stroke={2} />
            </Box>
            <Stack gap={0}>
              <Title order={3} fw={700} c={CHARCOAL} style={{ fontSize: 'clamp(15px, 3.5vw, 20px)' }}>
                Staff Appointment Manager
              </Title>
              <Text size="xs" c={MUTED_OLIVE} fw={500} visibleFrom="sm">
                San Sebastian College - Recoletos Manila Legal Aid
              </Text>
            </Stack>
          </Group>

          {/* Right: Controls */}
          <Group gap="xs" align="center" wrap="wrap">

            {/* Google Calendar pill */}
            {isGoogleConnected ? (
              <Menu shadow="md" width={260} position="bottom-end">
                <Menu.Target>
                  <Paper
                    shadow="xs"
                    radius="xl"
                    withBorder
                    bg="white"
                    px="sm"
                    py={6}
                    style={{
                      cursor: isConnectingGoogle ? 'wait' : 'pointer',
                      opacity: isConnectingGoogle ? 0.7 : 1,
                      flexShrink: 0,
                    }}
                  >
                    <Group gap="xs" align="center" wrap="nowrap">
                      <IconBrandGoogle size={20} color="#34A853" />
                      <Stack gap={0} visibleFrom="xs" style={{ minWidth: 0 }}>
                        <Text size="xs" c={MUTED_OLIVE} fw={500} lh={1.2}>Profile Google Calendar</Text>
                        <Text size="xs" fw={700} c="green" lh={1.2}>
                          {isConnectingGoogle ? 'Updating...' : 'Connected'}
                        </Text>
                        {googleConnectedEmail ? (
                          <Text size="10px" c={MUTED_OLIVE} lh={1.2} truncate>
                            {googleConnectedEmail}
                          </Text>
                        ) : null}
                      </Stack>
                    </Group>
                  </Paper>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Label>Google Calendar for this profile</Menu.Label>
                  {googleConnectedEmail ? <Menu.Item disabled>{googleConnectedEmail}</Menu.Item> : null}
                  <Menu.Item
                    leftSection={<IconRefresh size={16} />}
                    onClick={handleConnectGoogleCalendar}
                    disabled={isConnectingGoogle}
                  >
                    Switch Google Account
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconX size={16} />}
                    color="red"
                    onClick={handleDisconnectGoogleCalendar}
                    disabled={isConnectingGoogle}
                  >
                    Disconnect From Profile
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            ) : (
            <Tooltip label="Connect a Google Calendar for this selected profile">
              <Paper
                shadow="xs"
                radius="xl"
                withBorder
                bg="white"
                px="sm"
                py={6}
                style={{
                  cursor: isConnectingGoogle ? 'wait' : 'pointer',
                  opacity: isConnectingGoogle ? 0.7 : 1,
                  flexShrink: 0,
                }}
                onClick={!isConnectingGoogle ? handleConnectGoogleCalendar : undefined}
              >
                <Group gap="xs" align="center" wrap="nowrap">
                  <IconBrandGoogle size={20} color="#EA4335" />
                  {/* Label: hidden on very small screens, visible on sm+ */}
                  <Stack gap={0} visibleFrom="xs">
                    <Text size="xs" c={MUTED_OLIVE} fw={500} lh={1.2}>Profile Google Calendar</Text>
                    <Text size="xs" fw={700} c="red" lh={1.2} style={{ display: 'none' }}>
                      {isConnectingGoogle ? 'Connecting…' : isGoogleConnected ? 'Connected' : 'Connect'}
                    </Text>
                    <Text size="xs" fw={700} c="red" lh={1.2}>
                      {isConnectingGoogle ? 'Connecting...' : 'Connect'}
                    </Text>
                  </Stack>
                </Group>
              </Paper>
            </Tooltip>
            )}

            {/* Stats pill */}
            <Paper shadow="xs" radius="xl" withBorder bg="white" px="sm" py={6}>
              <Group gap="sm" align="center" wrap="nowrap">
                <Stack gap={0} ta="center">
                  {/* Label hidden on mobile to save space */}
                  <Text size="xs" c={MUTED_OLIVE} fw={600} visibleFrom="sm">PENDING</Text>
                  <Group gap={4} align="center">
                    <IconClock size={12} color="orange" />
                    <Text fw={700} size="sm" c="orange">{pendingCount}</Text>
                  </Group>
                </Stack>
                <Divider orientation="vertical" />
                <Stack gap={0} ta="center">
                  <Text size="xs" c={MUTED_OLIVE} fw={600} visibleFrom="sm" style={{ whiteSpace: 'nowrap' }}>INTERVIEW</Text>
                  <Group gap={4} align="center">
                    <IconCheck size={12} color="green" />
                    <Text fw={700} size="sm" c="green">{interviewCount}</Text>
                  </Group>
                </Stack>
              </Group>
            </Paper>

            {/* Refresh */}
            <Tooltip label="Refresh data">
              <ActionIcon
                variant="filled"
                color="blue"
                onClick={() => loadAllData()}
                radius="xl"
                size="lg"
                style={{ flexShrink: 0 }}
              >
                <IconRefresh size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        {/* ── B. Main Content: Calendar + Appointment Records ── */}
        <Grid gutter={{ base: 'md', xl: 'xl' }}>

          {/* Calendar */}
          <Grid.Col span={{ base: 12, lg: 8 }}>
            <Paper
              shadow="xl"
              p={{ base: 'sm', sm: 'lg' }}
              radius="xl"
              withBorder
              style={{ border: '2px solid #E5E7EB', backgroundColor: 'white', height: '100%' }}
            >
              <ClientFormStatusCalendar
                appointments={allAppointmentsForCalendar}
                onEventCreated={loadAllData}
                onDateClick={handleDateClick}
                onEventClick={(eventItem) => {
                  setViewingEvent(eventItem);
                  setViewEventModal(true);
                }}
                filterValue={calendarFilter}
                onFilterChange={setCalendarFilter}
                onAddEvent={() => {
                  setEventEditForm({ title: '', description: '', eventDate: new Date(), appointmentTime: '', eventType: 'appointment', location: '', clientName: '', assignedTo: '', priority: 'Medium' });
                  setSelectedEvent(null);
                  setEditEventModal(true);
                }}
              />
            </Paper>
          </Grid.Col>

          {/* Appointment Records Panel */}
          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Paper
              shadow="xl"
              p={{ base: 'sm', sm: 'lg' }}
              radius="xl"
              withBorder
              bg="white"
            >
              <Stack gap="md">

                {/* Panel header */}
                <Group justify="space-between" align="center">
                  <Group gap="sm">
                    <Box style={{
                      width: 32, height: 32, borderRadius: '8px',
                      background: `${PRIMARY_BROWN}15`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <IconAddressBook size={18} color={PRIMARY_BROWN} />
                    </Box>
                    <Title order={4} c={CHARCOAL} fw={700}>Appointment Records</Title>
                  </Group>
                  {selectedFilterDate && (
                    <Tooltip label="Reset date filter">
                      <ActionIcon variant="light" color="red" radius="md" onClick={handleResetDateFilter}>
                        <IconRotateClockwise size={18} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </Group>

                {/* Search + date badge */}
                <Stack gap={8}>
                  <TextInput
                    placeholder="Search by client name..."
                    leftSection={<IconSearch size={16} />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="sm"
                    radius="md"
                    styles={{ input: { borderColor: '#E5E7EB' } }}
                  />
                  {selectedFilterDate && (
                    <Badge variant="light" color={PRIMARY_BROWN} radius="md" size="sm" fullWidth>
                      Date: {selectedFilterDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Badge>
                  )}
                </Stack>

                {/* Tabs */}
                <Tabs
                  value={activeTab}
                  onChange={(val) => { setActiveTab(val); setPendingPage(1); setInterviewPage(1); }}
                  variant="pills"
                  radius="md"
                  styles={{
                    tab: { fontWeight: 600, fontSize: '11px', padding: '6px 12px' },
                  }}
                >
                  <Tabs.List mb="md" grow>
                    <Tabs.Tab
                      value="pending"
                      leftSection={<IconClock size={14} />}
                      rightSection={filteredPending.length > 0 ? <Badge size="xs" circle color="orange" variant="filled">{filteredPending.length}</Badge> : null}
                    >
                      Pending
                    </Tabs.Tab>
                    <Tabs.Tab
                      value="forInterview"
                      leftSection={<IconFileText size={14} />}
                      rightSection={filteredInterview.length > 0 ? <Badge size="xs" circle color="green" variant="filled">{filteredInterview.length}</Badge> : null}
                    >
                      Interview
                    </Tabs.Tab>
                  </Tabs.List>

                  {/* Pending Panel */}
                  <Tabs.Panel value="pending">
                    <Stack gap="md">
                      <ScrollArea
                        h="clamp(300px, 50vh, 520px)"
                        offsetScrollbars
                        scrollbarSize={6}
                        styles={{ thumb: { backgroundColor: PRIMARY_BROWN } }}
                      >
                        <Stack gap="sm" pr="xs">
                          {filteredPending
                            .slice((pendingPage - 1) * itemsPerPage, pendingPage * itemsPerPage)
                            .map((item) => (
                              <SideAppointmentCard key={item.id} item={item} />
                            ))}
                          {filteredPending.length === 0 && (
                            <Center h={180}>
                              <Stack align="center" gap="xs">
                                <IconInfoCircle size={32} color="#D1D5DB" />
                                <Text c="dimmed" size="xs" fw={500}>No matches found.</Text>
                              </Stack>
                            </Center>
                          )}
                        </Stack>
                      </ScrollArea>
                      <Center>
                        <Pagination
                          total={Math.ceil(filteredPending.length / itemsPerPage) || 1}
                          value={pendingPage}
                          onChange={setPendingPage}
                          color={PRIMARY_BROWN}
                          size="xs"
                          radius="md"
                          withEdges={false}
                        />
                      </Center>
                    </Stack>
                  </Tabs.Panel>

                  {/* For Interview Panel */}
                  <Tabs.Panel value="forInterview">
                    <Stack gap="md">
                      <ScrollArea
                        h="clamp(300px, 50vh, 520px)"
                        offsetScrollbars
                        scrollbarSize={6}
                        styles={{ thumb: { backgroundColor: PRIMARY_BROWN } }}
                      >
                        <Stack gap="sm" pr="xs">
                          {filteredInterview
                            .slice((interviewPage - 1) * itemsPerPage, interviewPage * itemsPerPage)
                            .map((item) => (
                              <SideAppointmentCard key={item.id} item={item} />
                            ))}
                          {filteredInterview.length === 0 && (
                            <Center h={180}>
                              <Stack align="center" gap="xs">
                                <IconInfoCircle size={32} color="#D1D5DB" />
                                <Text c="dimmed" size="xs" fw={500}>No matches found.</Text>
                              </Stack>
                            </Center>
                          )}
                        </Stack>
                      </ScrollArea>
                      <Center>
                        <Pagination
                          total={Math.ceil(filteredInterview.length / itemsPerPage) || 1}
                          value={interviewPage}
                          onChange={setInterviewPage}
                          color={PRIMARY_BROWN}
                          size="xs"
                          radius="md"
                          withEdges={false}
                        />
                      </Center>
                    </Stack>
                  </Tabs.Panel>
                </Tabs>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>
      </Container>

      {/* ══ Approve Modal ══ */}
      <Modal
        opened={approveModalOpen}
        onClose={() => { setApproveModalOpen(false); setAppointmentToApprove(null); }}
        title={<Text fw={700} size="lg">Approve Appointment</Text>}
        centered
        radius="xl"
        size={{ base: '100%', sm: 'md' }}
        styles={{ inner: { padding: '8px' } }}
      >
        <Stack gap="md" align="center" ta="center">
          <Box p="lg" bg={THEMED_LIGHT_BG + '40'} style={{ borderRadius: '50%' }}>
            <IconCheck size={40} color={PRIMARY_BROWN} />
          </Box>
          <Box>
            <Text fw={700} size="lg">Approve this appointment?</Text>
            {appointmentToApprove && (
              <Text size="sm" c="dimmed" mt={4}>
                {appointmentToApprove.clientName} — {appointmentToApprove.scheduledDate}
              </Text>
            )}
            <Text size="sm" c="dimmed" mt={4}>
              This will schedule the appointment to Google Calendar and mark it for interview.
            </Text>
          </Box>
          <Group grow w="100%">
            <Button variant="outline" color="gray" radius="md" fw={600} onClick={() => { setApproveModalOpen(false); setAppointmentToApprove(null); }}>Cancel</Button>
            <Button color={PRIMARY_BROWN} radius="md" fw={600} onClick={confirmApprove} loading={isUpdating}>Approve</Button>
          </Group>
        </Stack>
      </Modal>

      {/* ══ Reschedule Modal ══ */}
      <Modal
        opened={rescheduleModal}
        onClose={() => setRescheduleModal(false)}
        title={<Text fw={700} size="lg">Reschedule Appointment</Text>}
        size={{ base: '100%', sm: 'md' }}
        radius="xl"
        styles={{ inner: { padding: '8px' } }}
      >
        <Stack gap="md">
          {selectedAppointment && (
            <Paper p="md" radius="lg" withBorder bg={THEMED_LIGHT_BG + '30'}>
              <Group gap="sm">
                <Avatar size={40} color={PRIMARY_BROWN}>{selectedAppointment.clientName[0]}</Avatar>
                <Box>
                  <Text fw={600} size="sm">{selectedAppointment.clientName}</Text>
                  <Text size="xs" c="dimmed">Current: {selectedAppointment.scheduledDate}</Text>
                </Box>
              </Group>
            </Paper>
          )}
          <DatePickerInput
            label="New Date"
            placeholder="Select date"
            value={newDate}
            onChange={setNewDate}
            radius="md"
            size="md"
          />
          <Select
            label="New Time"
            placeholder="Select time"
            data={['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM']}
            value={newTime}
            onChange={setNewTime}
            radius="md"
            size="md"
          />
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" color="gray" fw={600} onClick={() => setRescheduleModal(false)}>Cancel</Button>
            <Button color={PRIMARY_BROWN} radius="md" fw={600} onClick={handleUpdateAppointment} loading={isUpdating}>Save Schedule</Button>
          </Group>
        </Stack>
      </Modal>

      {/* ══ Edit / Add Event Modal ══ */}
      <Modal
        opened={editEventModal}
        onClose={() => setEditEventModal(false)}
        title={<Text fw={700} size="lg">{selectedEvent ? 'Edit Event' : 'Add New Event'}</Text>}
        size={620}
        radius="xl"
        styles={{ inner: { padding: '8px' } }}
      >
        <Stack gap="md">
          <TextInput
            label="Title"
            placeholder="Event title"
            value={eventEditForm.title}
            onChange={(e) => setEventEditForm({ ...eventEditForm, title: e.target.value })}
            radius="md"
          />
          <Textarea
            label="Description"
            placeholder="Notes..."
            value={eventEditForm.description}
            onChange={(e) => setEventEditForm({ ...eventEditForm, description: e.target.value })}
            radius="md"
          />
          <Grid gutter="sm" align="flex-end">
            <Grid.Col span={{ base: 12, sm: 3.8 }}>
              <DatePickerInput
                label="Date"
                placeholder="Select date"
                value={eventEditForm.eventDate}
                onChange={(d) => setEventEditForm({ ...eventEditForm, eventDate: d })}
                radius="md"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4.4 }}>
              <TypeableTimePicker
                value={eventEditForm.appointmentTime}
                onChange={(t) => setEventEditForm({ ...eventEditForm, appointmentTime: t })}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 3.8 }}>
              <Select
                label="Type"
                data={['appointment', 'hearing', 'consultation', 'deadline', 'other']}
                value={eventEditForm.eventType}
                onChange={(v) => setEventEditForm({ ...eventEditForm, eventType: v })}
                radius="md"
              />
            </Grid.Col>
          </Grid>
          <TextInput
            label="Location"
            leftSection={<IconMapPin size={16} />}
            value={eventEditForm.location}
            onChange={(e) => setEventEditForm({ ...eventEditForm, location: e.target.value })}
            radius="md"
          />
          <Group justify="flex-end" mt="lg">
            <Button variant="subtle" color="gray" fw={600} onClick={() => setEditEventModal(false)}>Cancel</Button>
            <Button color={PRIMARY_BROWN} radius="md" fw={600} onClick={handleUpdateEvent} loading={isUpdatingEvent}>
              {selectedEvent ? 'Update Event' : 'Create Event'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* ══ Delete Event Confirm Modal ══ */}
      <Modal
        opened={deleteConfirmModal}
        onClose={() => setDeleteConfirmModal(false)}
        title="Confirm Delete"
        centered
        radius="xl"
        size={{ base: '100%', sm: 'sm' }}
        styles={{ inner: { padding: '8px' } }}
      >
        <Stack gap="md" align="center" ta="center">
          <Box p="lg" bg="red.0" style={{ borderRadius: '50%' }}>
            <IconTrash size={40} color="red" />
          </Box>
          <Box>
            <Text fw={700} size="lg">Are you absolutely sure?</Text>
            <Text size="sm" c="dimmed">This will permanently delete this event from the calendar.</Text>
          </Box>
          <Group grow w="100%">
            <Button variant="outline" color="gray" radius="md" fw={600} onClick={() => setDeleteConfirmModal(false)}>Cancel</Button>
            <Button color="red" radius="md" fw={600} onClick={handleDeleteEvent} loading={isDeletingEvent}>Delete Forever</Button>
          </Group>
        </Stack>
      </Modal>

      {/* ══ Delete Appointment Confirm Modal ══ */}
      <Modal
        opened={deleteAppointmentModal}
        onClose={() => { setDeleteAppointmentModal(false); setAppointmentToDelete(null); }}
        title="Delete Appointment"
        centered
        radius="xl"
        size={{ base: '100%', sm: 'sm' }}
        styles={{ inner: { padding: '8px' } }}
      >
        <Stack gap="md" align="center" ta="center">
          <Box p="lg" bg="red.0" style={{ borderRadius: '50%' }}>
            <IconTrash size={40} color="red" />
          </Box>
          <Box>
            <Text fw={700} size="lg">Delete this appointment?</Text>
            {appointmentToDelete && (
              <Text size="sm" c="dimmed" mt={4}>
                {appointmentToDelete.clientName} — {appointmentToDelete.scheduledDate}
              </Text>
            )}
            <Text size="sm" c="dimmed" mt={4}>
              This will permanently remove the appointment
              {appointmentToDelete?.calendarRecorded ? ' and its linked calendar event' : ''}.
            </Text>
          </Box>
          <Group grow w="100%">
            <Button variant="outline" color="gray" radius="md" fw={600} onClick={() => { setDeleteAppointmentModal(false); setAppointmentToDelete(null); }}>Cancel</Button>
            <Button color="red" radius="md" fw={600} onClick={handleDeleteAppointment} loading={isDeletingAppointment}>Delete</Button>
          </Group>
        </Stack>
      </Modal>

      {/* ══ View Event Details Modal ══ */}
      <Modal
        opened={viewEventModal}
        onClose={() => setViewEventModal(false)}
        title={
          <Group gap="xs">
            <IconCalendarEvent size={22} color={PRIMARY_BROWN} />
            <Text fw={700} size="lg">{viewingEvent?.title || viewingEvent?.clientName || 'Event Details'}</Text>
          </Group>
        }
        size="md"
        radius="xl"
      >
        {viewingEvent && (
          <Stack gap="md">
            <Group justify="space-between" align="center">
              <Badge color={PRIMARY_BROWN} variant="light" size="md" radius="sm">
                {(viewingEvent.type || viewingEvent.eventType || 'other').toUpperCase()}
              </Badge>
              {viewingEvent.priority && (
                <Badge
                  color={viewingEvent.priority === 'High' ? 'red' : viewingEvent.priority === 'Medium' ? 'orange' : 'gray'}
                  variant="outline"
                  size="sm"
                >
                  {viewingEvent.priority} Priority
                </Badge>
              )}
            </Group>

            <Paper p="md" radius="md" bg="#FAF8F4" style={{ border: '1px solid #E5E7EB' }}>
              <Stack gap="xs">
                <Group gap="sm">
                  <IconCalendar size={18} color={PRIMARY_BROWN} />
                  <Box>
                    <Text size="xs" c="dimmed" fw={500}>Date & Time</Text>
                    <Text size="sm" fw={600} c={CHARCOAL}>
                      {viewingEvent.scheduledDate || 'TBD'}{viewingEvent.appointmentTime ? ` at ${viewingEvent.appointmentTime}` : ''}
                    </Text>
                  </Box>
                </Group>

                <Group gap="sm" mt={4}>
                  <IconMapPin size={18} color={PRIMARY_BROWN} />
                  <Box>
                    <Text size="xs" c="dimmed" fw={500}>Location</Text>
                    <Text size="sm" fw={600} c={CHARCOAL}>{viewingEvent.location || 'Not specified'}</Text>
                  </Box>
                </Group>

                {viewingEvent.assignedTo && (
                  <Group gap="sm" mt={4}>
                    <IconUser size={18} color={PRIMARY_BROWN} />
                    <Box>
                      <Text size="xs" c="dimmed" fw={500}>Assigned To / Client</Text>
                      <Text size="sm" fw={600} c={CHARCOAL}>{viewingEvent.assignedTo || viewingEvent.clientName}</Text>
                    </Box>
                  </Group>
                )}
              </Stack>
            </Paper>

            {viewingEvent.description && (
              <Box>
                <Text size="xs" fw={700} c={CHARCOAL} tt="uppercase" lts={1} mb={4}>Description / Notes</Text>
                <Paper p="sm" radius="md" withBorder style={{ backgroundColor: '#FFFFFF', whiteSpace: 'pre-wrap' }}>
                  <Text size="sm" c={CHARCOAL}>{viewingEvent.description}</Text>
                </Paper>
              </Box>
            )}

            <Group justify="space-between" mt="md">
              {viewingEvent.fullData?._id || viewingEvent.id ? (
                <Group gap="xs">
                  <Button
                    variant="outline"
                    color={PRIMARY_BROWN}
                    size="xs"
                    radius="md"
                    leftSection={<IconEdit size={14} />}
                    onClick={() => {
                      setViewEventModal(false);
                      if (viewingEvent.isEvent) {
                        // Event → open Edit Event modal
                        const e = viewingEvent.fullData || viewingEvent;
                        setSelectedEvent({ id: viewingEvent.id || e._id, ...e });
                        setEventEditForm({
                          title: e.title || e.clientName || '',
                          description: e.description || '',
                          eventDate: e.eventDate ? new Date(e.eventDate) : new Date(),
                          appointmentTime: e.appointmentTime || '',
                          eventType: e.eventType || 'appointment',
                          location: e.location || '',
                          clientName: e.clientName || '',
                          assignedTo: e.assignedTo || '',
                          priority: e.priority || 'Medium',
                        });
                        setEditEventModal(true);
                      } else {
                        // Appointment → open Reschedule Appointment modal
                        handleOpenEditAppointment(viewingEvent);
                      }
                    }}
                  >
                    {viewingEvent?.isEvent ? 'Edit' : 'Edit Appointment'}
                  </Button>
                  <Button
                    variant="light"
                    color="red"
                    size="xs"
                    radius="md"
                    leftSection={<IconTrash size={14} />}
                    onClick={() => {
                      setViewEventModal(false);
                      if (viewingEvent.isEvent) {
                        // Event → use event delete flow
                        setEventToDelete({ id: viewingEvent.id || viewingEvent.fullData?._id });
                        setDeleteConfirmModal(true);
                      } else {
                        // Appointment → use appointment delete flow
                        setAppointmentToDelete(viewingEvent);
                        setDeleteAppointmentModal(true);
                      }
                    }}
                  >
                    Delete
                  </Button>
                </Group>
              ) : <Box />}

              <Button variant="subtle" color="gray" size="xs" radius="md" onClick={() => setViewEventModal(false)}>
                Close
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Box>
  );
}
