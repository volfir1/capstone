import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/authContext';
import apiClient from '../../api/apiClient';
import DateTimePicker from '@react-native-community/datetimepicker';

const PRIMARY_BROWN = '#7D5A3B';
const PRIMARY_GOLD = '#C4AB7D';
const CHARCOAL = '#2C2C2C';
const THEMED_LIGHT_BG = '#FAF8F3';
const MUTED_OLIVE = '#8B8B6F';

const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
];

export default function ClientFormStatus() {
  const router = useRouter();
  const { currentUser, userData } = useAuth();

  // Data
  const [appointments, setAppointments] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterDate, setSelectedFilterDate] = useState(null);

  // Calendar
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Approve modal
  const [approveModal, setApproveModal] = useState(false);
  const [appointmentToApprove, setAppointmentToApprove] = useState(null);

  // Reschedule modal
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [newDate, setNewDate] = useState(new Date());
  const [newTime, setNewTime] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Delete modal
  const [deleteModal, setDeleteModal] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Create event modal
  const [createEventModal, setCreateEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '', description: '', eventDate: '',
    eventType: 'appointment', location: '', clientName: '',
  });
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [showEventDatePicker, setShowEventDatePicker] = useState(false);

  // Context menu
  const [contextMenuId, setContextMenuId] = useState(null);

  // Date details modal (when clicking a calendar date)
  const [dateDetailsModal, setDateDetailsModal] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);

  // ─── Google Calendar reconnect helper ───
  const isGoogleReconnectError = (err) => {
    const errData = err?.response?.data;
    return errData?.error === 'google_reconnect_required' ||
           errData?.error === 'User has not connected Google Calendar';
  };

  const promptGoogleReconnect = () => {
    Alert.alert(
      'Google Calendar Not Connected',
      'Google Calendar must be connected from the website.\n\nPlease go to the website → Staff Appointment Manager, click the "Connect Google Calendar" option, authorize access, then come back to the app and try again.',
      [{ text: 'OK' }]
    );
  };

  // ─── Filtered lists (matching website logic exactly) ───
  const filteredPending = useMemo(() => {
    return appointments
      .filter(a => a.status === 'auto-scheduled' && !a.calendarRecorded)
      .filter(a => !selectedFilterDate ||
        (a.rawAppointedDate && new Date(a.rawAppointedDate).toDateString() === selectedFilterDate.toDateString()))
      .filter(a => !searchQuery || a.clientName.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [appointments, selectedFilterDate, searchQuery]);

  const filteredInterview = useMemo(() => {
    return appointments
      .filter(a => a.calendarRecorded && a.status === 'auto-scheduled')
      .filter(a => !selectedFilterDate ||
        (a.rawAppointedDate && new Date(a.rawAppointedDate).toDateString() === selectedFilterDate.toDateString()))
      .filter(a => !searchQuery || a.clientName.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [appointments, selectedFilterDate, searchQuery]);

  // Calendar items (appointments + custom events, deduped)
  const calendarItems = useMemo(() => {
    const linkedEventIds = new Set(
      appointments
        .filter(apt => apt.calendarRecorded && apt.fullData?.calendarEventId)
        .map(apt => apt.fullData.calendarEventId)
    );
    return [
      ...appointments.map(apt => ({
        ...apt,
        uniqueId: `apt-${apt.id}`,
        date: apt.rawAppointedDate ? new Date(apt.rawAppointedDate) : null,
        isEvent: false,
      })),
      ...events
        .filter(evt => !linkedEventIds.has(evt.id))
        .map(evt => ({
          ...evt,
          uniqueId: `evt-${evt.id}`,
          date: evt.rawAppointedDate ? new Date(evt.rawAppointedDate) : null,
          isEvent: true,
        })),
    ];
  }, [appointments, events]);

  // ─── Data loading (matching website's loadAllData) ───
  const loadAllData = async (opts = {}) => {
    const silent = opts.silent === true;
    if (!silent) setLoading(true);
    try {
      const pendingResp = await apiClient.get('/clientsinfo');
      const docs = pendingResp?.data || [];
      const mapped = (Array.isArray(docs) ? docs : [])
        .map((d, idx) => ({
          id: d._id || idx,
          clientName: d.fullName || d.personal?.fullName ||
            `${d.personal?.firstName || ''} ${d.personal?.lastName || ''}`.trim() || '',
          type: 'Initial Interview',
          submittedDate: d.createdAt
            ? new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : '',
          scheduledDate: d.appointedDate
            ? new Date(d.appointedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'TBD',
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
          purpose: d.caseDetails?.purpose || d.caseDescription || 'Client interview',
          priority: d.priority || 'Medium',
          fullData: d,
        }))
        .sort((a, b) => {
          if (!a.rawAppointedDate) return 1;
          if (!b.rawAppointedDate) return -1;
          return new Date(a.rawAppointedDate) - new Date(b.rawAppointedDate);
        });
      setAppointments(mapped);

      const eventsResp = await apiClient.get('/events');
      const eventsData = eventsResp?.data || [];
      const mappedEvents = (Array.isArray(eventsData) ? eventsData : []).map((e, idx) => ({
        id: e._id || idx,
        clientName: e.clientName || 'Event',
        type: e.eventType || 'other',
        rawAppointedDate: e.eventDate,
        scheduledDate: e.eventDate
          ? new Date(e.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : 'TBD',
        appointmentTime: e.eventDate ? (() => {
          const d = new Date(e.eventDate);
          const h = d.getHours();
          const m = d.getMinutes();
          if (h === 0 && m === 0) return '';
          const ampm = h >= 12 ? 'PM' : 'AM';
          const displayH = h % 12 || 12;
          return `${displayH}:${String(m).padStart(2, '0')} ${ampm}`;
        })() : '',
        location: e.location || 'TBD',
        priority: e.priority || 'Medium',
        status: e.status || 'scheduled',
        description: e.description || '',
        assignedTo: e.assignedTo || '',
        purpose: e.title || '',
      }));
      setEvents(mappedEvents);
    } catch (err) {
      console.error('Failed to load data:', err);
      if (!silent) Alert.alert('Error', 'Failed to load data');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    const interval = setInterval(() => loadAllData({ silent: true }), 10000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  // ─── Approve handler → Google Calendar sync (matching website) ───
  const handleApprove = async () => {
    const appointment = appointmentToApprove;
    if (!appointment?.id) return;
    setUpdating(true);
    try {
      const title = appointment.clientName
        ? `${appointment.clientName} - Interview`
        : 'Client Interview';
      const description = appointment.purpose || `Case ID: ${appointment.id}`;

      const dateObj = new Date(appointment.rawAppointedDate);
      const rawTime = appointment.fullData?.appointmentTime || '';
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');

      let startHour = 9, startMin = 0;
      if (rawTime) {
        const parts = rawTime.split(':');
        startHour = parseInt(parts[0]) || 9;
        startMin = parseInt(parts[1]) || 0;
      }

      const startDateTime = `${year}-${month}-${day}T${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}:00`;
      const endHour = startHour + 1;
      const endDateTime = `${year}-${month}-${day}T${String(endHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}:00`;

      const googleEvent = {
        summary: title,
        description,
        start: { dateTime: startDateTime, timeZone: 'Asia/Manila' },
        end: { dateTime: endDateTime, timeZone: 'Asia/Manila' },
      };

      await apiClient.post('/google/events/atomic', {
        firebaseUid: currentUser.uid,
        event: googleEvent,
        meta: {
          appointmentId: appointment.id,
          title,
          description,
          eventDate: appointment.rawAppointedDate,
          eventType: 'appointment',
          location: appointment.location,
          clientName: appointment.clientName,
          status: 'scheduled',
        },
      });

      Alert.alert('Success', 'Appointment approved and synced to Google Calendar.');
      setApproveModal(false);
      setAppointmentToApprove(null);
      await loadAllData();
    } catch (err) {
      console.error('Failed to approve:', err);
      if (isGoogleReconnectError(err)) {
        setApproveModal(false);
        setAppointmentToApprove(null);
        promptGoogleReconnect();
      } else {
        Alert.alert('Error', err?.response?.data?.message || 'Failed to approve appointment.');
      }
    } finally {
      setUpdating(false);
    }
  };

  // ─── Reschedule handler (matching website logic) ───
  const handleRescheduleSubmit = async () => {
    if (!newDate || !selectedAppointment?.id) {
      Alert.alert('Error', 'Please select a valid date and time.');
      return;
    }
    setUpdating(true);
    try {
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
          firebaseUid: currentUser.uid,
          eventId,
          appointmentId: selectedAppointment.id,
          newDate: dateWithTime.toISOString(),
          newTime: newTime || '',
        });
        Alert.alert('Success', 'Appointment rescheduled and Google Calendar updated.');
      } else {
        const iso = newDate.toISOString();
        await apiClient.put(`/clientsinfo/${selectedAppointment.id}`, {
          appointedDate: iso,
          appointmentTime: newTime || '',
        });
        Alert.alert('Success', 'Appointment updated successfully.');
      }
      setRescheduleModal(false);
      await loadAllData();
    } catch (err) {
      console.error('Failed to reschedule:', err);
      if (isGoogleReconnectError(err)) {
        setRescheduleModal(false);
        promptGoogleReconnect();
      } else {
        Alert.alert('Error', err?.response?.data?.message || 'Failed to update appointment.');
      }
    } finally {
      setUpdating(false);
    }
  };

  // ─── Delete handler (matching website logic with firebaseUid) ───
  const handleDelete = async () => {
    if (!appointmentToDelete) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/clientsinfo/${appointmentToDelete.id}`, {
        data: { firebaseUid: currentUser?.uid },
      });
      Alert.alert('Deleted', 'Appointment removed successfully.');
      setDeleteModal(false);
      setAppointmentToDelete(null);
      await loadAllData();
    } catch (err) {
      console.error('Failed to delete:', err);
      Alert.alert('Error', 'Failed to delete appointment.');
    } finally {
      setDeleting(false);
    }
  };

  // ─── Create event with Google Calendar sync ───
  const handleCreateEvent = async () => {
    if (!eventForm.title || !eventForm.eventDate) {
      Alert.alert('Error', 'Title and date are required.');
      return;
    }
    setCreatingEvent(true);
    try {
      const eventDate = new Date(eventForm.eventDate);
      const year = eventDate.getFullYear();
      const month = String(eventDate.getMonth() + 1).padStart(2, '0');
      const day = String(eventDate.getDate()).padStart(2, '0');
      const hours = String(eventDate.getHours()).padStart(2, '0');
      const mins = String(eventDate.getMinutes()).padStart(2, '0');

      const startDateTime = `${year}-${month}-${day}T${hours}:${mins}:00`;
      const endHour = eventDate.getHours() + 1;
      const endDateTime = `${year}-${month}-${day}T${String(endHour).padStart(2, '0')}:${mins}:00`;

      const googleEvent = {
        summary: eventForm.title,
        description: eventForm.description,
        start: { dateTime: startDateTime, timeZone: 'Asia/Manila' },
        end: { dateTime: endDateTime, timeZone: 'Asia/Manila' },
      };

      await apiClient.post('/google/events/atomic', {
        firebaseUid: currentUser.uid,
        event: googleEvent,
        meta: {
          title: eventForm.title,
          description: eventForm.description,
          eventDate: eventForm.eventDate,
          eventType: eventForm.eventType,
          location: eventForm.location,
          clientName: eventForm.clientName,
          status: 'scheduled',
        },
      });

      Alert.alert('Success', 'Event created and synced to Google Calendar.');
      setCreateEventModal(false);
      setEventForm({ title: '', description: '', eventDate: '', eventType: 'appointment', location: '', clientName: '' });
      await loadAllData();
    } catch (err) {
      console.error('Failed to create event:', err);
      if (isGoogleReconnectError(err)) {
        setCreateEventModal(false);
        promptGoogleReconnect();
      } else {
        Alert.alert('Error', err?.response?.data?.message || 'Failed to create event.');
      }
    } finally {
      setCreatingEvent(false);
    }
  };

  // ─── Helper: open reschedule modal ───
  const openRescheduleModal = (appointment) => {
    setSelectedAppointment(appointment);
    if (appointment?.rawAppointedDate) {
      try { setNewDate(new Date(appointment.rawAppointedDate)); }
      catch { setNewDate(new Date()); }
    } else {
      setNewDate(new Date());
    }
    setNewTime(appointment?.appointmentTime || '');
    setRescheduleModal(true);
    setContextMenuId(null);
  };

  // ─── Calendar helpers ───
  const getItemsForDate = (date) => {
    return calendarItems.filter(item => {
      if (!item.date) return false;
      return item.date.toDateString() === date.toDateString();
    });
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weeks = [];
    let week = new Array(firstDay).fill(null);

    for (let day = 1; day <= daysInMonth; day++) {
      week.push(day);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }
    return weeks;
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // ─── Render: Calendar ───
  const renderCalendar = () => {
    const weeks = generateCalendarDays();
    const today = new Date();
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <View style={styles.calendarSection}>
        <View style={styles.calendarHeader}>
          <View>
            <Text style={styles.calendarTitle}>Calendar</Text>
            <Text style={styles.calendarSubtitle}>
              {appointments.filter(a => a.status === 'auto-scheduled' && !a.calendarRecorded).length} pending ·{' '}
              {appointments.filter(a => a.calendarRecorded && a.status === 'auto-scheduled').length} for interview
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addEventButton}
            onPress={() => {
              setEventForm({ title: '', description: '', eventDate: '', eventType: 'appointment', location: '', clientName: '' });
              setCreateEventModal(true);
            }}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.monthNavigation}>
          <TouchableOpacity onPress={prevMonth} style={styles.monthButton}>
            <Ionicons name="chevron-back" size={22} color={CHARCOAL} />
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={styles.monthButton}>
            <Ionicons name="chevron-forward" size={22} color={CHARCOAL} />
          </TouchableOpacity>
        </View>

        <View style={styles.calendarWeek}>
          {dayHeaders.map(d => (
            <View key={d} style={styles.calendarDay}>
              <Text style={styles.dayHeader}>{d}</Text>
            </View>
          ))}
        </View>

        {weeks.map((week, wi) => (
          <View key={wi} style={styles.calendarWeek}>
            {week.map((day, di) => {
              if (!day) return <View key={di} style={styles.calendarDay} />;
              const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
              const isToday = date.toDateString() === today.toDateString();
              const isSelected = selectedFilterDate && date.toDateString() === selectedFilterDate.toDateString();
              const itemsOnDate = getItemsForDate(date);
              const count = itemsOnDate.length;

              return (
                <TouchableOpacity
                  key={di}
                  style={[
                    styles.calendarDay,
                    isToday && styles.calendarDayToday,
                    isSelected && styles.calendarDaySelected,
                  ]}
                  onPress={() => {
                    if (count > 0) {
                      setSelectedCalendarDate(date);
                      setDateDetailsModal(true);
                    }
                    setSelectedFilterDate(date);
                  }}
                >
                  <Text style={[
                    styles.calendarDayText,
                    isToday && styles.calendarDayTextToday,
                    isSelected && styles.calendarDayTextSelected,
                  ]}>
                    {day}
                  </Text>
                  {count > 0 && (
                    <View style={styles.appointmentDot}>
                      <Text style={styles.appointmentDotText}>{count}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  // ─── Render: Appointment Card (matching website's SideAppointmentCard) ───
  const renderAppointmentCard = (item) => (
    <View key={item.id} style={[styles.card, { borderLeftColor: item.calendarRecorded ? 'green' : PRIMARY_GOLD }]}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName} numberOfLines={1}>{item.clientName}</Text>
          <Text style={styles.cardType}>{item.type}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setContextMenuId(contextMenuId === item.id ? null : item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="ellipsis-horizontal" size={18} color="#999" />
        </TouchableOpacity>
      </View>

      {contextMenuId === item.id && (
        <View style={styles.contextMenu}>
          <TouchableOpacity
            style={styles.contextMenuItem}
            onPress={() => openRescheduleModal(item)}
          >
            <Ionicons name="create-outline" size={16} color={CHARCOAL} />
            <Text style={styles.contextMenuText}>Edit Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.contextMenuItem}
            onPress={() => {
              setContextMenuId(null);
              router.push({ pathname: '/admin/clientinfo', params: { id: item.id } });
            }}
          >
            <Ionicons name="eye-outline" size={16} color={CHARCOAL} />
            <Text style={styles.contextMenuText}>View Details</Text>
          </TouchableOpacity>
          <View style={styles.contextMenuDivider} />
          <TouchableOpacity
            style={styles.contextMenuItem}
            onPress={() => {
              setContextMenuId(null);
              setAppointmentToDelete(item);
              setDeleteModal(true);
            }}
          >
            <Ionicons name="trash-outline" size={16} color="red" />
            <Text style={[styles.contextMenuText, { color: 'red' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.cardDetails}>
        <View style={styles.cardDetailRow}>
          <Ionicons name="time-outline" size={14} color={PRIMARY_BROWN} />
          <Text style={styles.cardDetailText}>{item.appointmentTime || 'TBD'}</Text>
        </View>
        <View style={styles.cardDetailRow}>
          <Ionicons name="calendar-outline" size={14} color={MUTED_OLIVE} />
          <Text style={[styles.cardDetailText, { color: MUTED_OLIVE }]}>{item.scheduledDate}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        {!item.calendarRecorded ? (
          <TouchableOpacity
            style={styles.approveButton}
            onPress={() => {
              setContextMenuId(null);
              setAppointmentToApprove(item);
              setApproveModal(true);
            }}
            disabled={updating}
          >
            {updating && appointmentToApprove?.id === item.id ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.approveButtonText}>Approve</Text>
            )}
          </TouchableOpacity>
        ) : (
          <>
            {!['director', 'supervising_lawyer'].includes(userData?.role) && (
              <TouchableOpacity
                style={styles.interviewButton}
                onPress={() => {
                  setContextMenuId(null);
                  router.push({
                    pathname: '/admin/recommendation',
                    params: { caseId: item.id },
                  });
                }}
              >
                <Text style={styles.interviewButtonText}>Interview</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.detailsButton}
              onPress={() => {
                setContextMenuId(null);
                router.push({ pathname: '/admin/clientinfo', params: { id: item.id } });
              }}
            >
              <Text style={styles.detailsButtonText}>Details</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  // ─── Render: Tab content ───
  const renderTabContent = () => {
    const items = activeTab === 'pending' ? filteredPending : filteredInterview;

    if (items.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="information-circle-outline" size={32} color="#D1D5DB" />
          <Text style={styles.emptyText}>No matches found.</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.cardList} nestedScrollEnabled>
        {items.map(renderAppointmentCard)}
      </ScrollView>
    );
  };

  // ─── Loading state ───
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_BROWN} />
          <Text style={{ marginTop: 12, color: '#999' }}>Loading appointments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Main render ───
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={CHARCOAL} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Staff Appointment Manager</Text>
        <TouchableOpacity onPress={() => loadAllData()} style={styles.refreshButton}>
          <Ionicons name="refresh" size={22} color={PRIMARY_BROWN} />
        </TouchableOpacity>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>PENDING</Text>
          <Text style={[styles.statValue, { color: 'orange' }]}>
            {appointments.filter(a => a.status === 'auto-scheduled' && !a.calendarRecorded).length}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>FOR INTERVIEW</Text>
          <Text style={[styles.statValue, { color: 'green' }]}>
            {appointments.filter(a => a.calendarRecorded && a.status === 'auto-scheduled').length}
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY_BROWN} />}
      >
        {/* Calendar */}
        {renderCalendar()}

        {/* Appointment Records Section */}
        <View style={styles.recordsSection}>
          <View style={styles.recordsHeader}>
            <View style={styles.recordsHeaderLeft}>
              <Ionicons name="people-outline" size={18} color={PRIMARY_BROWN} />
              <Text style={styles.recordsTitle}>Appointment Records</Text>
            </View>
            {selectedFilterDate && (
              <TouchableOpacity onPress={() => setSelectedFilterDate(null)}>
                <Ionicons name="close-circle" size={22} color="red" />
              </TouchableOpacity>
            )}
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={16} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by client name..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {selectedFilterDate && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                Date: {selectedFilterDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </View>
          )}

          {/* Tabs: Pending & Interview only (matching website) */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.pillTab, activeTab === 'pending' && styles.pillTabActive]}
              onPress={() => setActiveTab('pending')}
            >
              <Ionicons name="time-outline" size={14} color={activeTab === 'pending' ? 'white' : '#666'} />
              <Text style={[styles.pillTabText, activeTab === 'pending' && styles.pillTabTextActive]}>
                Pending
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pillTab, activeTab === 'forInterview' && styles.pillTabActive]}
              onPress={() => setActiveTab('forInterview')}
            >
              <Ionicons name="document-text-outline" size={14} color={activeTab === 'forInterview' ? 'white' : '#666'} />
              <Text style={[styles.pillTabText, activeTab === 'forInterview' && styles.pillTabTextActive]}>
                Interview
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {renderTabContent()}
        </View>
      </ScrollView>

      {/* ═══ MODALS ═══ */}

      {/* Approve Modal */}
      <Modal visible={approveModal} animationType="fade" transparent onRequestClose={() => { setApproveModal(false); setAppointmentToApprove(null); }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalCenterContent}>
              <View style={styles.modalIconCircle}>
                <Ionicons name="checkmark" size={40} color={PRIMARY_BROWN} />
              </View>
              <Text style={styles.modalCenterTitle}>Approve this appointment?</Text>
              {appointmentToApprove && (
                <Text style={styles.modalCenterSubtext}>
                  {appointmentToApprove.clientName} — {appointmentToApprove.scheduledDate}
                </Text>
              )}
              <Text style={styles.modalCenterSubtext}>
                This will schedule the appointment to Google Calendar and mark it for interview.
              </Text>
              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => { setApproveModal(false); setAppointmentToApprove(null); }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalConfirmButton}
                  onPress={handleApprove}
                  disabled={updating}
                >
                  {updating ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.modalConfirmText}>Approve</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reschedule Modal */}
      <Modal visible={rescheduleModal} animationType="slide" transparent onRequestClose={() => setRescheduleModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reschedule Appointment</Text>
              <TouchableOpacity onPress={() => setRescheduleModal(false)}>
                <Ionicons name="close" size={24} color={CHARCOAL} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedAppointment && (
                <View style={styles.rescheduleInfo}>
                  <View style={styles.rescheduleAvatar}>
                    <Text style={styles.rescheduleAvatarText}>
                      {selectedAppointment.clientName?.[0] || '?'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.rescheduleClientName}>{selectedAppointment.clientName}</Text>
                    <Text style={styles.rescheduleCurrentDate}>Current: {selectedAppointment.scheduledDate}</Text>
                  </View>
                </View>
              )}

              <Text style={styles.inputLabel}>New Date</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={PRIMARY_BROWN} />
                <Text style={styles.datePickerText}>
                  {newDate instanceof Date
                    ? newDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Select Date'}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={newDate instanceof Date ? newDate : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (date) setNewDate(date);
                  }}
                />
              )}

              <Text style={styles.inputLabel}>New Time</Text>
              <View style={styles.timeSlots}>
                {TIME_SLOTS.map(slot => (
                  <TouchableOpacity
                    key={slot}
                    style={[styles.timeSlot, newTime === slot && styles.timeSlotActive]}
                    onPress={() => setNewTime(slot)}
                  >
                    <Text style={[styles.timeSlotText, newTime === slot && styles.timeSlotTextActive]}>
                      {slot}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.rescheduleActions}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setRescheduleModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalConfirmButton}
                  onPress={handleRescheduleSubmit}
                  disabled={updating}
                >
                  {updating ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.modalConfirmText}>Save Schedule</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Delete Modal */}
      <Modal visible={deleteModal} animationType="fade" transparent onRequestClose={() => { setDeleteModal(false); setAppointmentToDelete(null); }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalCenterContent}>
              <View style={[styles.modalIconCircle, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="trash" size={40} color="red" />
              </View>
              <Text style={styles.modalCenterTitle}>Delete this appointment?</Text>
              {appointmentToDelete && (
                <Text style={styles.modalCenterSubtext}>
                  {appointmentToDelete.clientName} — {appointmentToDelete.scheduledDate}
                </Text>
              )}
              <Text style={styles.modalCenterSubtext}>
                This will permanently remove the appointment{appointmentToDelete?.calendarRecorded ? ' and its linked calendar event' : ''}.
              </Text>
              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => { setDeleteModal(false); setAppointmentToDelete(null); }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalConfirmButton, { backgroundColor: 'red' }]}
                  onPress={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.modalConfirmText}>Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Event Modal */}
      <Modal visible={createEventModal} animationType="slide" transparent onRequestClose={() => setCreateEventModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Event</Text>
              <TouchableOpacity onPress={() => setCreateEventModal(false)}>
                <Ionicons name="close" size={24} color={CHARCOAL} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Event title"
                placeholderTextColor="#999"
                value={eventForm.title}
                onChangeText={text => setEventForm({ ...eventForm, title: text })}
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Notes..."
                placeholderTextColor="#999"
                value={eventForm.description}
                onChangeText={text => setEventForm({ ...eventForm, description: text })}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Date *</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowEventDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={PRIMARY_BROWN} />
                <Text style={styles.datePickerText}>
                  {eventForm.eventDate
                    ? new Date(eventForm.eventDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Select Date'}
                </Text>
              </TouchableOpacity>

              {showEventDatePicker && (
                <DateTimePicker
                  value={eventForm.eventDate ? new Date(eventForm.eventDate) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    setShowEventDatePicker(Platform.OS === 'ios');
                    if (date) setEventForm({ ...eventForm, eventDate: date.toISOString() });
                  }}
                />
              )}

              <Text style={styles.inputLabel}>Type</Text>
              <View style={styles.typeButtons}>
                {['appointment', 'hearing', 'consultation', 'deadline', 'other'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeButton, eventForm.eventType === type && styles.typeButtonActive]}
                    onPress={() => setEventForm({ ...eventForm, eventType: type })}
                  >
                    <Text style={[styles.typeButtonText, eventForm.eventType === type && styles.typeButtonTextActive]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Location</Text>
              <TextInput
                style={styles.input}
                placeholder="Location"
                placeholderTextColor="#999"
                value={eventForm.location}
                onChangeText={text => setEventForm({ ...eventForm, location: text })}
              />

              <Text style={styles.inputLabel}>Client Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Client name"
                placeholderTextColor="#999"
                value={eventForm.clientName}
                onChangeText={text => setEventForm({ ...eventForm, clientName: text })}
              />

              <View style={styles.rescheduleActions}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setCreateEventModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalConfirmButton}
                  onPress={handleCreateEvent}
                  disabled={creatingEvent}
                >
                  {creatingEvent ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.modalConfirmText}>Create Event</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date Details Modal (calendar date tap) */}
      <Modal visible={dateDetailsModal} animationType="slide" transparent onRequestClose={() => setDateDetailsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedCalendarDate
                  ? selectedCalendarDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                  : ''}
              </Text>
              <TouchableOpacity onPress={() => setDateDetailsModal(false)}>
                <Ionicons name="close" size={24} color={CHARCOAL} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedCalendarDate && getItemsForDate(selectedCalendarDate).map(item => (
                <View key={item.uniqueId} style={styles.dateDetailCard}>
                  <View style={styles.dateDetailHeader}>
                    <Text style={styles.dateDetailClient}>{item.clientName}</Text>
                    <View style={styles.dateDetailBadge}>
                      <Text style={styles.dateDetailBadgeText}>{item.type}</Text>
                    </View>
                  </View>
                  {item.appointmentTime ? (
                    <View style={styles.dateDetailRow}>
                      <Ionicons name="time" size={14} color="#666" />
                      <Text style={styles.dateDetailText}>{item.appointmentTime}</Text>
                    </View>
                  ) : null}
                  <View style={styles.dateDetailRow}>
                    <Ionicons name="location" size={14} color="#666" />
                    <Text style={styles.dateDetailText}>{item.location || 'TBD'}</Text>
                  </View>
                  {!item.isEvent && (
                    <TouchableOpacity
                      style={styles.dateDetailViewButton}
                      onPress={() => {
                        setDateDetailsModal(false);
                        router.push({ pathname: '/admin/clientinfo', params: { id: item.id } });
                      }}
                    >
                      <Text style={styles.dateDetailViewText}>View Details</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              {selectedCalendarDate && getItemsForDate(selectedCalendarDate).length === 0 && (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No appointments on this date.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: { marginRight: 12 },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CHARCOAL,
    flex: 1,
  },
  refreshButton: { padding: 8 },

  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statItem: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 11, fontWeight: '600', color: MUTED_OLIVE },
  statValue: { fontSize: 20, fontWeight: '700' },
  statDivider: { width: 1, height: 36, backgroundColor: '#E5E7EB' },

  // Calendar
  calendarSection: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  calendarTitle: { fontSize: 16, fontWeight: '700', color: CHARCOAL, marginBottom: 4 },
  calendarSubtitle: { fontSize: 13, color: '#666' },
  addEventButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PRIMARY_BROWN,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  monthButton: { padding: 8 },
  monthText: { fontSize: 16, fontWeight: '700', color: CHARCOAL },
  calendarWeek: { flexDirection: 'row', justifyContent: 'space-around' },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  calendarDayToday: { backgroundColor: PRIMARY_GOLD, borderRadius: 8 },
  calendarDaySelected: { backgroundColor: `${PRIMARY_BROWN}20`, borderRadius: 8 },
  calendarDayText: { fontSize: 14, color: CHARCOAL, fontWeight: '500' },
  calendarDayTextToday: { color: 'white', fontWeight: '700' },
  calendarDayTextSelected: { color: PRIMARY_BROWN, fontWeight: '700' },
  dayHeader: { fontSize: 12, fontWeight: '600', color: '#666' },
  appointmentDot: {
    position: 'absolute',
    bottom: 4,
    backgroundColor: PRIMARY_BROWN,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  appointmentDotText: { color: 'white', fontSize: 10, fontWeight: '700' },

  // Records Section
  recordsSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  recordsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordsHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recordsTitle: { fontSize: 17, fontWeight: '700', color: CHARCOAL },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    backgroundColor: '#FAFAFA',
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: CHARCOAL },

  // Filter badge
  filterBadge: {
    backgroundColor: `${PRIMARY_BROWN}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  filterBadgeText: { fontSize: 12, fontWeight: '600', color: PRIMARY_BROWN },

  // Pill Tabs (matching website's pill variant)
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  pillTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  pillTabActive: {
    backgroundColor: PRIMARY_BROWN,
  },
  pillTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  pillTabTextActive: {
    color: 'white',
  },

  // Card List
  cardList: { maxHeight: 500 },

  // Appointment Card (matching website's SideAppointmentCard)
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardName: { fontSize: 14, fontWeight: '600', color: CHARCOAL },
  cardType: { fontSize: 12, fontWeight: '500', color: MUTED_OLIVE, marginTop: 2 },
  cardDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  cardDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardDetailText: { fontSize: 12, fontWeight: '600', color: CHARCOAL },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },

  // Context Menu
  contextMenu: {
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 4,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  contextMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  contextMenuText: { fontSize: 14, color: CHARCOAL },
  contextMenuDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 2 },

  // Action Buttons
  approveButton: {
    flex: 1,
    backgroundColor: PRIMARY_BROWN,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButtonText: { color: 'white', fontSize: 13, fontWeight: '600' },
  interviewButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: PRIMARY_BROWN,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  interviewButtonText: { color: PRIMARY_BROWN, fontSize: 13, fontWeight: '600' },
  detailsButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailsButtonText: { color: '#666', fontSize: 13, fontWeight: '600' },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: { fontSize: 13, color: '#999', fontWeight: '500', marginTop: 8 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: CHARCOAL, flex: 1 },
  modalBody: { padding: 20 },
  modalCenterContent: {
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  modalIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEMED_LIGHT_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCenterTitle: { fontSize: 18, fontWeight: '700', color: CHARCOAL, textAlign: 'center' },
  modalCenterSubtext: { fontSize: 14, color: '#666', textAlign: 'center' },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: '#666' },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: PRIMARY_BROWN,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalConfirmText: { color: 'white', fontSize: 15, fontWeight: '600' },

  // Reschedule Info
  rescheduleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: THEMED_LIGHT_BG,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  rescheduleAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY_BROWN,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rescheduleAvatarText: { color: 'white', fontSize: 18, fontWeight: '700' },
  rescheduleClientName: { fontSize: 14, fontWeight: '600', color: CHARCOAL },
  rescheduleCurrentDate: { fontSize: 12, color: '#666' },
  rescheduleActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 8,
  },

  // Date & Time Pickers
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 6, marginTop: 12 },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#F9F9F9',
  },
  datePickerText: { fontSize: 15, color: CHARCOAL, marginLeft: 8 },
  timeSlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  timeSlot: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: 'white',
  },
  timeSlotActive: {
    backgroundColor: PRIMARY_BROWN,
    borderColor: PRIMARY_BROWN,
  },
  timeSlotText: { fontSize: 13, fontWeight: '600', color: '#666' },
  timeSlotTextActive: { color: 'white' },

  // Input
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: CHARCOAL,
  },
  textArea: { height: 80, textAlignVertical: 'top' },

  // Type Buttons
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: 'white',
  },
  typeButtonActive: {
    backgroundColor: PRIMARY_BROWN,
    borderColor: PRIMARY_BROWN,
  },
  typeButtonText: { fontSize: 12, fontWeight: '600', color: '#666' },
  typeButtonTextActive: { color: 'white' },

  // Date Detail Modal
  dateDetailCard: {
    backgroundColor: THEMED_LIGHT_BG,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: PRIMARY_GOLD,
  },
  dateDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateDetailClient: { fontSize: 16, fontWeight: '700', color: CHARCOAL, flex: 1 },
  dateDetailBadge: {
    backgroundColor: PRIMARY_BROWN,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dateDetailBadgeText: { color: 'white', fontSize: 11, fontWeight: '600' },
  dateDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  dateDetailText: { fontSize: 13, color: '#666' },
  dateDetailViewButton: {
    marginTop: 8,
    backgroundColor: PRIMARY_BROWN,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  dateDetailViewText: { color: 'white', fontSize: 14, fontWeight: '600' },
});