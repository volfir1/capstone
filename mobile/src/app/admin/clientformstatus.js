import React, { useState, useEffect } from 'react';
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
import apiClient from '../../api/apiClient';
import DateTimePicker from '@react-native-community/datetimepicker';

const PRIMARY_BROWN = '#7D5A3B';
const PRIMARY_GOLD = '#C4AB7D';
const CHARCOAL = '#2C2C2C';
const THEMED_LIGHT_BG = '#FAF8F3';

export default function ClientFormStatus() {
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('auto-scheduled'); // auto-scheduled, confirmed, legal-advice, court-case, rejected, documents
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [newDate, setNewDate] = useState(new Date());
  const [newTime, setNewTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [createEventModalVisible, setCreateEventModalVisible] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    eventDate: '',
    eventTime: '',
    eventType: 'appointment',
    location: 'SOLA Office',
    clientName: '',
    assignedTo: '',
    priority: 'Medium',
  });
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateDetailsModalVisible, setDateDetailsModalVisible] = useState(false);
  const [fullReceiptModalVisible, setFullReceiptModalVisible] = useState(false);
  const [fullReceiptData, setFullReceiptData] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const resp = await apiClient.get('/clientsinfo');
      const docs = resp?.data || [];
      const mapped = (Array.isArray(docs) ? docs : []).map((d, idx) => ({
        id: d._id || idx,
        clientName: d.fullName || d.personal?.fullName || 
          `${d.personal?.firstName || ''} ${d.personal?.lastName || ''}`.trim() || '',
        type: 'Initial Interview',
        submittedDate: d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-US', { 
          year: 'numeric', month: 'short', day: 'numeric' 
        }) : '',
        scheduledDate: d.appointedDate ? new Date(d.appointedDate).toLocaleDateString('en-US', { 
          year: 'numeric', month: 'short', day: 'numeric' 
        }) : 'TBD',
        rawAppointedDate: d.appointedDate || null,
        appointmentTime: d.appointmentTime || '',
        status: d.status || 'auto-scheduled',
        contactNumber: d.personal?.contactNumber || 'N/A',
        email: d.personal?.email || 'N/A',
        assignedTo: d.assignedTo || 'Staff',
        location: d.caseDetails?.location || 'SOLA Office',
        purpose: d.caseDetails?.purpose || `Initial interview for ${d.fullName}`,
        priority: d.priority || 'High',
      }));
      setAppointments(mapped);
    } catch (err) {
      console.error('Failed to load appointments:', err);
      Alert.alert('Error', 'Failed to load appointments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const handleReschedule = (appointment) => {
    setSelectedAppointment(appointment);
    // Set initial date and time from appointment or use current date/time
    if (appointment.rawAppointedDate) {
      setNewDate(new Date(appointment.rawAppointedDate));
    } else {
      setNewDate(new Date());
    }
    
    if (appointment.appointmentTime) {
      // Parse time string (e.g., "14:30") and set it on today's date
      const [hours, minutes] = appointment.appointmentTime.split(':');
      const timeDate = new Date();
      timeDate.setHours(parseInt(hours), parseInt(minutes));
      setNewTime(timeDate);
    } else {
      setNewTime(new Date());
    }
    
    setModalVisible(false);
    setRescheduleModalVisible(true);
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setNewDate(selectedDate);
    }
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setNewTime(selectedTime);
    }
  };

  const closeRescheduleModal = () => {
    setRescheduleModalVisible(false);
    setShowDatePicker(false);
    setShowTimePicker(false);
    setNewDate(new Date());
    setNewTime(new Date());
    setSelectedAppointment(null);
  };

  const handleRecommend = async (appointment) => {
    try {
      if (appointment.status === 'auto-scheduled') {
        // Update status to confirmed first
        await apiClient.put(`/clientsinfo/${appointment.id}`, { status: 'confirmed' });
        Alert.alert('Success', 'Status updated to Confirmed');
        await fetchAppointments();
      }
      // Navigate to recommendation page with caseId parameter
      router.push({
        pathname: '/admin/recommendation',
        params: { caseId: appointment.id }
      });
    } catch (error) {
      console.error('Failed to update status:', error);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleViewFullReceipt = async (appointmentId) => {
    try {
      const response = await apiClient.get(`/clientsinfo/${appointmentId}`);
      setFullReceiptData(response.data);
      setFullReceiptModalVisible(true);
    } catch (error) {
      console.error('Failed to load full details:', error);
      Alert.alert('Error', 'Failed to load appointment details');
    }
  };

  const handleUpdateAppointment = async () => {
    if (!newDate || !selectedAppointment?.id) {
      Alert.alert('Error', 'Please provide a valid date');
      return;
    }

    try {
      setUpdating(true);
      const iso = newDate.toISOString();
      
      // Format time as HH:MM
      const hours = newTime.getHours().toString().padStart(2, '0');
      const minutes = newTime.getMinutes().toString().padStart(2, '0');
      const formattedTime = `${hours}:${minutes}`;
      
      const payload = { 
        appointedDate: iso,
        appointmentTime: formattedTime
      };

      await apiClient.put(`/clientsinfo/${selectedAppointment.id}`, payload);
      
      Alert.alert('Success', 'Appointment updated successfully');
      closeRescheduleModal();
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      Alert.alert('Error', 'Failed to update appointment');
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!eventForm.title || !eventForm.eventDate) {
      Alert.alert('Error', 'Please provide at least a title and date');
      return;
    }

    try {
      setCreatingEvent(true);
      await apiClient.post('/events', {
        title: eventForm.title,
        description: eventForm.description,
        eventDate: eventForm.eventDate,
        eventTime: eventForm.eventTime,
        eventType: eventForm.eventType,
        location: eventForm.location,
        clientName: eventForm.clientName,
        assignedTo: eventForm.assignedTo,
        priority: eventForm.priority,
      });

      Alert.alert('Success', 'Event created successfully');
      setCreateEventModalVisible(false);
      setEventForm({
        title: '',
        description: '',
        eventDate: '',
        eventTime: '',
        eventType: 'appointment',
        location: 'SOLA Office',
        clientName: '',
        assignedTo: '',
        priority: 'Medium',
      });
      fetchAppointments(); // Refresh data
    } catch (err) {
      console.error('Failed to create event:', err);
      Alert.alert('Error', 'Failed to create event');
    } finally {
      setCreatingEvent(false);
    }
  };

  const autoScheduledAppointments = appointments.filter(a => a.status === 'auto-scheduled' || !a.status);
  const confirmedAppointments = appointments.filter(a => a.status === 'confirmed');
  const legalAdviceAppointments = appointments.filter(a => a.status === 'legal-advice');
  const courtCaseAppointments = appointments.filter(a => a.status === 'court-case');
  const rejectedAppointments = appointments.filter(a => a.status === 'rejected');
  const documentRequests = appointments.filter(a => a.type === 'document-request' || a.status === 'documents');

  // Calendar helper functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const getAppointmentsForDate = (date) => {
    return appointments.filter(apt => {
      if (!apt.rawAppointedDate) return false;
      const aptDate = new Date(apt.rawAppointedDate);
      return aptDate.toDateString() === date.toDateString();
    });
  };

  const handleDatePress = (day) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const date = new Date(year, month, day);
    const dayAppointments = getAppointmentsForDate(date);
    
    if (dayAppointments.length > 0) {
      setSelectedDate(date);
      setDateDetailsModalVisible(true);
    }
  };

  const changeMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
    const weeks = [];
    let days = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dayAppointments = getAppointmentsForDate(date);
      const isToday = new Date().toDateString() === date.toDateString();
      
      days.push(
        <TouchableOpacity
          key={day}
          style={[styles.calendarDay, isToday && styles.calendarDayToday]}
          onPress={() => handleDatePress(day)}
        >
          <Text style={[styles.calendarDayText, isToday && styles.calendarDayTextToday]}>
            {day}
          </Text>
          {dayAppointments.length > 0 && (
            <View style={styles.appointmentDot}>
              <Text style={styles.appointmentDotText}>{dayAppointments.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
      
      // Start a new week
      if (days.length === 7) {
        weeks.push(
          <View key={`week-${weeks.length}`} style={styles.calendarWeek}>
            {days}
          </View>
        );
        days = [];
      }
    }
    
    // Add remaining days if any
    if (days.length > 0) {
      while (days.length < 7) {
        days.push(<View key={`empty-end-${days.length}`} style={styles.calendarDay} />);
      }
      weeks.push(
        <View key={`week-${weeks.length}`} style={styles.calendarWeek}>
          {days}
        </View>
      );
    }
    
    return weeks;
  };

  const renderAppointmentCard = (appointment) => {
    const isPending = !appointment.rawAppointedDate || appointment.status === 'auto-scheduled';

    return (
      <TouchableOpacity
        key={appointment.id}
        style={styles.appointmentCard}
        onPress={() => {
          setSelectedAppointment(appointment);
          setModalVisible(true);
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons 
              name={isPending ? 'time-outline' : 'calendar'} 
              size={24} 
              color={isPending ? '#FF9800' : '#4CAF50'} 
            />
            <View style={styles.appointmentInfo}>
              <Text style={styles.clientName}>{appointment.clientName}</Text>
              <Text style={styles.appointmentType}>{appointment.type}</Text>
            </View>
          </View>
          <View style={[styles.priorityBadge, 
            appointment.priority === 'High' ? styles.highPriority :
            appointment.priority === 'Medium' ? styles.mediumPriority :
            styles.lowPriority
          ]}>
            <Text style={styles.priorityText}>{appointment.priority}</Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {appointment.scheduledDate} {appointment.appointmentTime && `at ${appointment.appointmentTime}`}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{appointment.location}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={16} color="#666" />
            <Text style={styles.detailText}>Assigned to: {appointment.assignedTo}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={[styles.statusBadge, isPending ? styles.pendingBadge : styles.scheduledBadge]}>
            <Text style={styles.statusText}>{isPending ? 'Pending' : 'Scheduled'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={PRIMARY_BROWN} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderTabContent = () => {
    let data = [];
    let emptyMessage = '';
    
    switch(activeTab) {
      case 'auto-scheduled':
        data = autoScheduledAppointments;
        emptyMessage = 'No auto-scheduled appointments';
        break;
      case 'confirmed':
        data = confirmedAppointments;
        emptyMessage = 'No confirmed appointments';
        break;
      case 'legal-advice':
        data = legalAdviceAppointments;
        emptyMessage = 'No legal advice cases';
        break;
      case 'court-case':
        data = courtCaseAppointments;
        emptyMessage = 'No court cases';
        break;
      case 'rejected':
        data = rejectedAppointments;
        emptyMessage = 'No rejected cases';
        break;
      case 'documents':
        data = documentRequests;
        emptyMessage = 'No document requests';
        break;
      default:
        data = autoScheduledAppointments;
        emptyMessage = 'No appointments';
    }

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_BROWN} />
        </View>
      );
    }

    if (data.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            {emptyMessage}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.appointmentList}
        contentContainerStyle={styles.appointmentListContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY_BROWN]} />
        }
      >
        {data.map(renderAppointmentCard)}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Client Appointment Status</Text>
        <TouchableOpacity onPress={fetchAppointments} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color={CHARCOAL} />
        </TouchableOpacity>
      </View>

      {/* Calendar Section */}
      <View style={styles.calendarSection}>
        <View style={styles.calendarHeader}>
          <View>
            <Text style={styles.calendarTitle}>Appointment Calendar</Text>
            <Text style={styles.calendarSubtitle}>Tap dates to view appointments</Text>
          </View>
          <TouchableOpacity 
            style={styles.addEventButton}
            onPress={() => setCreateEventModalVisible(true)}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Month Navigation */}
        <View style={styles.monthNavigation}>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthButton}>
            <Ionicons name="chevron-back" size={24} color={PRIMARY_BROWN} />
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthButton}>
            <Ionicons name="chevron-forward" size={24} color={PRIMARY_BROWN} />
          </TouchableOpacity>
        </View>

        {/* Day Headers */}
        <View style={styles.calendarWeek}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <View key={day} style={styles.calendarDay}>
              <Text style={styles.dayHeader}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        {renderCalendar()}
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        <TouchableOpacity
          style={[styles.tab, activeTab === 'auto-scheduled' && styles.activeTab]}
          onPress={() => setActiveTab('auto-scheduled')}
        >
          <Text style={[styles.tabText, activeTab === 'auto-scheduled' && styles.activeTabText]}>
            Auto-Scheduled ({autoScheduledAppointments.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'confirmed' && styles.activeTab]}
          onPress={() => setActiveTab('confirmed')}
        >
          <Text style={[styles.tabText, activeTab === 'confirmed' && styles.activeTabText]}>
            Confirmed ({confirmedAppointments.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'legal-advice' && styles.activeTab]}
          onPress={() => setActiveTab('legal-advice')}
        >
          <Text style={[styles.tabText, activeTab === 'legal-advice' && styles.activeTabText]}>
            Legal Advice ({legalAdviceAppointments.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'court-case' && styles.activeTab]}
          onPress={() => setActiveTab('court-case')}
        >
          <Text style={[styles.tabText, activeTab === 'court-case' && styles.activeTabText]}>
            Court Cases ({courtCaseAppointments.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'rejected' && styles.activeTab]}
          onPress={() => setActiveTab('rejected')}
        >
          <Text style={[styles.tabText, activeTab === 'rejected' && styles.activeTabText]}>
            Rejected ({rejectedAppointments.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'documents' && styles.activeTab]}
          onPress={() => setActiveTab('documents')}
        >
          <Text style={[styles.tabText, activeTab === 'documents' && styles.activeTabText]}>
            Documents ({documentRequests.length})
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {renderTabContent()}

      {/* Details Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Appointment Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={CHARCOAL} />
              </TouchableOpacity>
            </View>

            {selectedAppointment && (
              <ScrollView style={styles.modalBody}>
                <Text style={styles.modalLabel}>Client Name</Text>
                <Text style={styles.modalValue}>{selectedAppointment.clientName}</Text>

                <Text style={styles.modalLabel}>Contact</Text>
                <Text style={styles.modalValue}>{selectedAppointment.contactNumber}</Text>

                <Text style={styles.modalLabel}>Email</Text>
                <Text style={styles.modalValue}>{selectedAppointment.email}</Text>

                <Text style={styles.modalLabel}>Scheduled Date</Text>
                <Text style={styles.modalValue}>
                  {selectedAppointment.scheduledDate}
                  {selectedAppointment.appointmentTime && ` at ${selectedAppointment.appointmentTime}`}
                </Text>

                <Text style={styles.modalLabel}>Location</Text>
                <Text style={styles.modalValue}>{selectedAppointment.location}</Text>

                <Text style={styles.modalLabel}>Purpose</Text>
                <Text style={styles.modalValue}>{selectedAppointment.purpose}</Text>

                <Text style={styles.modalLabel}>Assigned To</Text>
                <Text style={styles.modalValue}>{selectedAppointment.assignedTo}</Text>

                {selectedAppointment.status === 'auto-scheduled' ? (
                  <View style={styles.buttonGroup}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.recommendButton]}
                      onPress={() => {
                        setModalVisible(false);
                        handleRecommend(selectedAppointment);
                      }}
                    >
                      <Ionicons name="document-text" size={20} color={PRIMARY_BROWN} />
                      <Text style={styles.recommendButtonText}>Recommend</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => handleReschedule(selectedAppointment)}
                    >
                      <Ionicons name="create-outline" size={20} color={PRIMARY_BROWN} />
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.viewRecommendationButton}
                    onPress={() => {
                      setModalVisible(false);
                      router.push({
                        pathname: '/admin/recommendation',
                        params: { caseId: selectedAppointment.id }
                      });
                    }}
                  >
                    <Ionicons name="document-text-outline" size={20} color={PRIMARY_BROWN} />
                    <Text style={styles.viewRecommendationButtonText}>View Recommendation</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity 
                  style={styles.fullReceiptButton}
                  onPress={() => {
                    setModalVisible(false);
                    handleViewFullReceipt(selectedAppointment.id);
                  }}
                >
                  <Ionicons name="eye-outline" size={20} color="white" />
                  <Text style={styles.fullReceiptButtonText}>View Full Receipt</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        visible={rescheduleModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeRescheduleModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reschedule Appointment</Text>
              <TouchableOpacity onPress={closeRescheduleModal}>
                <Ionicons name="close" size={24} color={CHARCOAL} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Date</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={PRIMARY_BROWN} />
                <Text style={styles.datePickerText}>
                  {newDate && newDate instanceof Date ? newDate.toLocaleDateString('en-US', { 
                    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
                  }) : 'Select Date'}
                </Text>
              </TouchableOpacity>
              
              {showDatePicker && newDate instanceof Date && (
                <DateTimePicker
                  value={newDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                />
              )}

              <Text style={styles.modalLabel}>Time</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time-outline" size={20} color={PRIMARY_BROWN} />
                <Text style={styles.datePickerText}>
                  {newTime && newTime instanceof Date ? newTime.toLocaleTimeString('en-US', { 
                    hour: '2-digit', minute: '2-digit' 
                  }) : 'Select Time'}
                </Text>
              </TouchableOpacity>
              
              {showTimePicker && newTime instanceof Date && (
                <DateTimePicker
                  value={newTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onTimeChange}
                />
              )}

              <TouchableOpacity 
                style={[styles.saveButton, updating && styles.saveButtonDisabled]}
                onPress={handleUpdateAppointment}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>Update Appointment</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Details Modal */}
      <Modal
        visible={dateDetailsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDateDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDate && selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
                })}
              </Text>
              <TouchableOpacity onPress={() => setDateDetailsModalVisible(false)}>
                <Ionicons name="close" size={24} color={CHARCOAL} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedDate && getAppointmentsForDate(selectedDate).map((apt) => (
                <View key={apt.id} style={styles.dateAppointmentCard}>
                  <View style={styles.dateAppointmentHeader}>
                    <Text style={styles.dateAppointmentClient}>{apt.clientName}</Text>
                    <View style={styles.dateAppointmentBadge}>
                      <Text style={styles.dateAppointmentBadgeText}>{apt.type}</Text>
                    </View>
                  </View>
                  {apt.appointmentTime && (
                    <View style={styles.dateAppointmentDetail}>
                      <Ionicons name="time" size={14} color="#666" />
                      <Text style={styles.dateAppointmentDetailText}>{apt.appointmentTime}</Text>
                    </View>
                  )}
                  <View style={styles.dateAppointmentDetail}>
                    <Ionicons name="location" size={14} color="#666" />
                    <Text style={styles.dateAppointmentDetailText}>{apt.location}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.viewDetailsButton}
                    onPress={() => {
                      setDateDetailsModalVisible(false);
                      setSelectedAppointment(apt);
                      setModalVisible(true);
                    }}
                  >
                    <Text style={styles.viewDetailsButtonText}>View Details</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Full Receipt Modal */}
      <Modal
        visible={fullReceiptModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFullReceiptModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Full Receipt Details</Text>
              <TouchableOpacity onPress={() => setFullReceiptModalVisible(false)}>
                <Ionicons name="close" size={24} color={CHARCOAL} />
              </TouchableOpacity>
            </View>

            {fullReceiptData && (
              <ScrollView style={styles.modalBody}>
                {/* Header Badge */}
                <View style={styles.receiptHeader}>
                  <Text style={styles.receiptTitle}>
                    {fullReceiptData.caseDetails?.appointmentType || fullReceiptData.personal?.legalMatter || 'Appointment'}
                  </Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>{fullReceiptData.status || 'For Appointment'}</Text>
                  </View>
                  <Text style={styles.caseNumber}>Case #{fullReceiptData.caseNumber || 'N/A'}</Text>
                </View>

                {/* Personal Details */}
                <View style={styles.receiptSection}>
                  <Text style={styles.sectionTitle}>Personal Details</Text>
                  <View style={styles.sectionDivider} />
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>NAME</Text>
                    <Text style={styles.detailValue}>{fullReceiptData.fullName || fullReceiptData.name || 'N/A'}</Text>
                  </View>
                  
                  <View style={styles.detailGrid}>
                    <View style={styles.detailGridItem}>
                      <Text style={styles.detailLabel}>AGE</Text>
                      <Text style={styles.detailValue}>{fullReceiptData.age || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailGridItem}>
                      <Text style={styles.detailLabel}>SEX</Text>
                      <Text style={styles.detailValue}>{fullReceiptData.sex || 'N/A'}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>BIRTHDAY</Text>
                    <Text style={styles.detailValue}>{fullReceiptData.birthday || 'N/A'}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>CIVIL STATUS</Text>
                    <Text style={styles.detailValue}>{fullReceiptData.civilStatus || 'N/A'}</Text>
                  </View>
                  
                  <View style={styles.detailGrid}>
                    <View style={styles.detailGridItem}>
                      <Text style={styles.detailLabel}>CONTACT NUMBER</Text>
                      <Text style={styles.detailValue}>{fullReceiptData.contactNumber || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailGridItem}>
                      <Text style={styles.detailLabel}>EMAIL</Text>
                      <Text style={styles.detailValue}>{fullReceiptData.email || 'N/A'}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>PRESENT ADDRESS</Text>
                    <Text style={styles.detailValue}>{fullReceiptData.presentAddress || 'N/A'}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>PERMANENT ADDRESS</Text>
                    <Text style={styles.detailValue}>{fullReceiptData.permanentAddress || 'N/A'}</Text>
                  </View>
                </View>

                {/* Schedule Details */}
                <View style={styles.receiptSection}>
                  <Text style={styles.sectionTitle}>Schedule Details</Text>
                  <View style={styles.sectionDivider} />
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>APPOINTMENT DATE</Text>
                    <Text style={styles.detailValue}>
                      {fullReceiptData.appointedDate 
                        ? new Date(fullReceiptData.appointedDate).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })
                        : 'N/A'}
                    </Text>
                  </View>
                </View>

                {/* Financial Details */}
                <View style={styles.receiptSection}>
                  <Text style={styles.sectionTitle}>Financial Details</Text>
                  <View style={styles.sectionDivider} />
                  
                  <View style={styles.detailGrid}>
                    <View style={styles.detailGridItem}>
                      <Text style={styles.detailLabel}>INCOME SOURCE</Text>
                      <Text style={styles.detailValue}>{fullReceiptData.currentSourceOfIncome || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailGridItem}>
                      <Text style={styles.detailLabel}>MONTHLY INCOME</Text>
                      <Text style={styles.detailValue}>
                        {fullReceiptData.monthlyIncome ? `₱${Number(fullReceiptData.monthlyIncome).toLocaleString()}` : 'N/A'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.detailGrid}>
                    <View style={styles.detailGridItem}>
                      <Text style={styles.detailLabel}>NATURE OF WORK</Text>
                      <Text style={styles.detailValue}>{fullReceiptData.natureOfWork || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailGridItem}>
                      <Text style={styles.detailLabel}>EMPLOYER</Text>
                      <Text style={styles.detailValue}>{fullReceiptData.employerName || 'N/A'}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>EMPLOYER ADDRESS</Text>
                    <Text style={styles.detailValue}>{fullReceiptData.employerAddress || 'N/A'}</Text>
                  </View>
                </View>

                {/* Case Details */}
                <View style={styles.receiptSection}>
                  <Text style={styles.sectionTitle}>Case Details</Text>
                  <View style={styles.sectionDivider} />
                  
                  <View style={styles.detailGrid}>
                    <View style={styles.detailGridItem}>
                      <Text style={styles.detailLabel}>PARTY REPRESENTED</Text>
                      <Text style={styles.detailValue}>{fullReceiptData.partyRepresented || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailGridItem}>
                      <Text style={styles.detailLabel}>CASE NUMBER</Text>
                      <Text style={styles.detailValue}>{fullReceiptData.caseNumber || 'N/A'}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.detailGrid}>
                    <View style={styles.detailGridItem}>
                      <Text style={styles.detailLabel}>VENUE</Text>
                      <Text style={styles.detailValue}>{fullReceiptData.venue || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailGridItem}>
                      <Text style={styles.detailLabel}>PRESENT STAGE</Text>
                      <Text style={styles.detailValue}>{fullReceiptData.presentStage || 'N/A'}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>COURT DIVISION</Text>
                    <Text style={styles.detailValue}>{fullReceiptData.courtDivision || 'N/A'}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>COURT ADDRESS</Text>
                    <Text style={styles.detailValue}>{fullReceiptData.courtAddress || 'N/A'}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>PRESIDING OFFICER</Text>
                    <Text style={styles.detailValue}>{fullReceiptData.presidingOfficer || 'N/A'}</Text>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Create Event Modal */}
      <Modal
        visible={createEventModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCreateEventModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Event</Text>
              <TouchableOpacity onPress={() => setCreateEventModalVisible(false)}>
                <Ionicons name="close" size={24} color={CHARCOAL} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalLabel}>Event Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Client Meeting, Court Hearing"
                placeholderTextColor="#999"
                value={eventForm.title}
                onChangeText={(text) => setEventForm({ ...eventForm, title: text })}
              />

              <Text style={styles.modalLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Event details..."
                placeholderTextColor="#999"
                value={eventForm.description}
                onChangeText={(text) => setEventForm({ ...eventForm, description: text })}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.modalLabel}>Event Date (YYYY-MM-DD) *</Text>
              <TextInput
                style={styles.input}
                placeholder="2024-12-31"
                placeholderTextColor="#999"
                value={eventForm.eventDate}
                onChangeText={(text) => setEventForm({ ...eventForm, eventDate: text })}
              />

              <Text style={styles.modalLabel}>Time (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="10:00 AM"
                placeholderTextColor="#999"
                value={eventForm.eventTime}
                onChangeText={(text) => setEventForm({ ...eventForm, eventTime: text })}
              />

              <Text style={styles.modalLabel}>Client Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Client name"
                placeholderTextColor="#999"
                value={eventForm.clientName}
                onChangeText={(text) => setEventForm({ ...eventForm, clientName: text })}
              />

              <Text style={styles.modalLabel}>Location</Text>
              <TextInput
                style={styles.input}
                placeholder="SOLA Office"
                placeholderTextColor="#999"
                value={eventForm.location}
                onChangeText={(text) => setEventForm({ ...eventForm, location: text })}
              />

              <Text style={styles.modalLabel}>Assigned To</Text>
              <TextInput
                style={styles.input}
                placeholder="Attorney name"
                placeholderTextColor="#999"
                value={eventForm.assignedTo}
                onChangeText={(text) => setEventForm({ ...eventForm, assignedTo: text })}
              />

              <Text style={styles.modalLabel}>Priority</Text>
              <View style={styles.priorityButtons}>
                {['High', 'Medium', 'Low'].map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityButton,
                      eventForm.priority === priority && styles.priorityButtonActive
                    ]}
                    onPress={() => setEventForm({ ...eventForm, priority })}
                  >
                    <Text style={[
                      styles.priorityButtonText,
                      eventForm.priority === priority && styles.priorityButtonTextActive
                    ]}>
                      {priority}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity 
                style={[styles.saveButton, creatingEvent && styles.saveButtonDisabled]}
                onPress={handleCreateEvent}
                disabled={creatingEvent}
              >
                {creatingEvent ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="add-circle" size={20} color="white" />
                    <Text style={styles.saveButtonText}>Create Event</Text>
                  </>
                )}
              </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  refreshButton: {
    padding: 8,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CHARCOAL,
    flex: 1,
  },
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
  calendarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: CHARCOAL,
    marginBottom: 4,
  },
  calendarSubtitle: {
    fontSize: 13,
    color: '#666',
  },
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
  calendarPlaceholder: {
    backgroundColor: THEMED_LIGHT_BG,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: PRIMARY_GOLD,
    borderStyle: 'dashed',
  },
  calendarPlaceholderText: {
    marginTop: 12,
    fontSize: 14,
    color: PRIMARY_BROWN,
    fontWeight: '600',
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  monthButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '700',
    color: CHARCOAL,
  },
  calendarWeek: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  calendarDayToday: {
    backgroundColor: PRIMARY_GOLD,
    borderRadius: 8,
  },
  calendarDayText: {
    fontSize: 14,
    color: CHARCOAL,
    fontWeight: '500',
  },
  calendarDayTextToday: {
    color: 'white',
    fontWeight: '700',
  },
  dayHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
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
  appointmentDotText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  dateAppointmentCard: {
    backgroundColor: THEMED_LIGHT_BG,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: PRIMARY_GOLD,
  },
  dateAppointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateAppointmentClient: {
    fontSize: 16,
    fontWeight: '700',
    color: CHARCOAL,
    flex: 1,
  },
  dateAppointmentBadge: {
    backgroundColor: PRIMARY_BROWN,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dateAppointmentBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  dateAppointmentDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  dateAppointmentDetailText: {
    fontSize: 13,
    color: '#666',
  },
  viewDetailsButton: {
    marginTop: 8,
    backgroundColor: PRIMARY_BROWN,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewDetailsButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: 'white',
    maxHeight: 50,
  },
  tabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    height: 44,
    justifyContent: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: PRIMARY_BROWN,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    lineHeight: 20,
  },
  activeTabText: {
    color: PRIMARY_BROWN,
    fontWeight: '600',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  appointmentList: {
    flex: 1,
    paddingHorizontal: 0,
  },
  appointmentListContent: {
    paddingBottom: 20,
  },
  appointmentCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appointmentInfo: {
    marginLeft: 12,
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: CHARCOAL,
  },
  appointmentType: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  highPriority: {
    backgroundColor: '#FFEBEE',
  },
  mediumPriority: {
    backgroundColor: '#FFF3E0',
  },
  lowPriority: {
    backgroundColor: '#E8F5E9',
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pendingBadge: {
    backgroundColor: '#FFF3E0',
  },
  scheduledBadge: {
    backgroundColor: '#E8F5E9',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
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
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CHARCOAL,
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 16,
    marginBottom: 4,
    fontWeight: '600',
  },
  modalValue: {
    fontSize: 16,
    color: CHARCOAL,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: CHARCOAL,
    marginBottom: 16,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#F9F9F9',
  },
  datePickerText: {
    fontSize: 16,
    color: CHARCOAL,
    marginLeft: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 6,
  },
  recommendButton: {
    backgroundColor: PRIMARY_GOLD,
  },
  recommendButtonText: {
    color: PRIMARY_BROWN,
    fontSize: 15,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: THEMED_LIGHT_BG,
    borderWidth: 1,
    borderColor: PRIMARY_BROWN,
  },
  editButtonText: {
    color: PRIMARY_BROWN,
    fontSize: 15,
    fontWeight: '600',
  },
  viewRecommendationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: PRIMARY_GOLD,
    padding: 14,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 12,
    gap: 8,
  },
  viewRecommendationButtonText: {
    color: PRIMARY_BROWN,
    fontSize: 15,
    fontWeight: '600',
  },
  fullReceiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_BROWN,
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  fullReceiptButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY_BROWN,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginBottom: 16,
  },
  receiptHeader: {
    backgroundColor: `${PRIMARY_GOLD}26`,
    borderWidth: 1,
    borderColor: PRIMARY_GOLD,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  receiptTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PRIMARY_BROWN,
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: PRIMARY_GOLD,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 8,
  },
  statusBadgeText: {
    color: CHARCOAL,
    fontSize: 13,
    fontWeight: '600',
  },
  caseNumber: {
    fontSize: 13,
    color: '#666',
  },
  receiptSection: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  detailGridItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: CHARCOAL,
    fontWeight: '500',
  },
  rescheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_BROWN,
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
  },
  rescheduleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: PRIMARY_BROWN,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  priorityButtonActive: {
    backgroundColor: PRIMARY_BROWN,
    borderColor: PRIMARY_BROWN,
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  priorityButtonTextActive: {
    color: 'white',
  },
});
