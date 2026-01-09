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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import apiClient from '../../api/apiClient';

const PRIMARY_BROWN = '#7D5A3B';
const PRIMARY_GOLD = '#C4AB7D';
const CHARCOAL = '#2C2C2C';
const THEMED_LIGHT_BG = '#FAF8F3';

export default function ClientFormStatus() {
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending'); // pending, scheduled
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [updating, setUpdating] = useState(false);

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
    setNewDate(appointment.rawAppointedDate ? 
      new Date(appointment.rawAppointedDate).toISOString().split('T')[0] : '');
    setNewTime(appointment.appointmentTime || '');
    setModalVisible(false);
    setRescheduleModalVisible(true);
  };

  const handleUpdateAppointment = async () => {
    if (!newDate || !selectedAppointment?.id) {
      Alert.alert('Error', 'Please provide a valid date');
      return;
    }

    try {
      setUpdating(true);
      const dateObj = new Date(newDate);
      const iso = dateObj.toISOString();
      const payload = { 
        appointedDate: iso,
        appointmentTime: newTime || ''
      };

      await apiClient.put(`/clientsinfo/${selectedAppointment.id}`, payload);
      
      Alert.alert('Success', 'Appointment updated successfully');
      setRescheduleModalVisible(false);
      setNewDate('');
      setNewTime('');
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      Alert.alert('Error', 'Failed to update appointment');
    } finally {
      setUpdating(false);
    }
  };

  const pendingAppointments = appointments.filter(apt => 
    apt.status === 'auto-scheduled' || !apt.rawAppointedDate
  );
  const scheduledAppointments = appointments.filter(apt => 
    apt.status !== 'auto-scheduled' && apt.rawAppointedDate
  );

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
    const data = activeTab === 'pending' ? pendingAppointments : scheduledAppointments;

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
            No {activeTab} appointments
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.appointmentList}
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={CHARCOAL} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Client Appointments</Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Pending ({pendingAppointments.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'scheduled' && styles.activeTab]}
          onPress={() => setActiveTab('scheduled')}
        >
          <Text style={[styles.tabText, activeTab === 'scheduled' && styles.activeTabText]}>
            Scheduled ({scheduledAppointments.length})
          </Text>
        </TouchableOpacity>
      </View>

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

                <TouchableOpacity 
                  style={styles.rescheduleButton}
                  onPress={() => handleReschedule(selectedAppointment)}
                >
                  <Ionicons name="calendar" size={20} color="white" />
                  <Text style={styles.rescheduleButtonText}>Reschedule Appointment</Text>
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
        onRequestClose={() => setRescheduleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reschedule Appointment</Text>
              <TouchableOpacity onPress={() => setRescheduleModalVisible(false)}>
                <Ionicons name="close" size={24} color={CHARCOAL} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                placeholder="2024-12-31"
                placeholderTextColor="#999"
                value={newDate}
                onChangeText={setNewDate}
              />

              <Text style={styles.modalLabel}>Time (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="10:00 AM"
                placeholderTextColor="#999"
                value={newTime}
                onChangeText={setNewTime}
              />

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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CHARCOAL,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: PRIMARY_BROWN,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: PRIMARY_BROWN,
    fontWeight: '600',
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
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
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
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
