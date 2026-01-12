import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, CHARCOAL, THEMED_LIGHT_BG, ACCENT_TAN } from 'utils/constants';

export default function TrackAppointment() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('appointment');

  // Sample data
  const forAppointmentData = [
    {
      id: 1,
      type: "Initial Interview",
      submittedDate: "Nov 10, 2025",
      status: "Scheduled",
      appointmentDate: "Nov 18, 2025",
      appointmentTime: "10:00 AM",
      location: "SOLA (Sebastian Office Legal Aid)",
      purpose: "Client information gathering and case assessment"
    },
    {
      id: 2,
      type: "Follow-up Interview",
      submittedDate: "Oct 28, 2025",
      status: "Rescheduled",
      originalDate: "Nov 05, 2025",
      appointmentDate: "Nov 12, 2025",
      appointmentTime: "2:30 PM",
      location: "SOLA (Sebastian Office Legal Aid)",
      purpose: "Additional document review and clarification"
    },
    {
      id: 3,
      type: "Case Evaluation",
      submittedDate: "Nov 02, 2025",
      status: "Canceled",
      originalDate: "Nov 08, 2025",
      cancelReason: "Client request - documentation incomplete",
      location: "SOLA (Sebastian Office Legal Aid)"
    },
    {
      id: 4,
      type: "Initial Consultation",
      submittedDate: "Nov 14, 2025",
      status: "Pending",
      location: "SOLA (Sebastian Office Legal Aid)",
      purpose: "Awaiting attorney availability for scheduling"
    }
  ];

  const legalAdviceData = [
    {
      id: 1,
      topic: "Land Dispute Inquiry",
      date: "Oct 24, 2025",
      status: "Scheduled",
      description: "Face-to-face consultation regarding neighbor encroaching on property line.",
      appointment: {
        date: "Nov 12, 2025",
        time: "2:00 PM",
        handler: "Atty. Maria Cruz",
        role: "Senior Attorney",
        location: "SOLA (Sebastian Office Legal Aid)"
      }
    },
    {
      id: 2,
      topic: "Labor Law Question",
      date: "Oct 10, 2025",
      status: "Completed",
      description: "Unfair termination validation inquiry.",
      completedDate: "Oct 28, 2025"
    },
    {
      id: 3,
      topic: "Small Claims",
      date: "Nov 01, 2025",
      status: "Pending Review",
      description: "Collection of unpaid loans amounting to 50k.",
    }
  ];

  const representationData = [
    {
      id: 1,
      caseTitle: "People of the PH vs. Santos",
      caseNumber: "CR-2025-001",
      stage: "Pre-Trial",
      nextDate: "Nov 15, 2025",
      location: "Parañaque RTC Branch 10",
      attorney: "Atty. Rodriguez"
    },
    {
      id: 2,
      caseTitle: "Civil Case: Land Title",
      caseNumber: "CV-2024-882",
      stage: "Presentation of Evidence",
      nextDate: "Dec 02, 2025",
      location: "Muntinlupa RTC",
      attorney: "Atty. Santos"
    },
    {
      id: 3,
      caseTitle: "Custody Hearing",
      caseNumber: "SP-2025-112",
      stage: "Mediation",
      nextDate: "Nov 20, 2025",
      location: "Pasay City Family Court",
      attorney: "Atty. Reyes"
    }
  ];

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return MUTED_OLIVE;
      case 'rescheduled':
        return PRIMARY_GOLD;
      case 'canceled':
      case 'cancelled':
        return '#E74C3C';
      case 'pending':
      case 'pending review':
        return ACCENT_TAN;
      case 'completed':
        return PRIMARY_BROWN;
      default:
        return '#999';
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'checkmark-circle';
      case 'rescheduled':
        return 'sync-circle';
      case 'canceled':
      case 'cancelled':
        return 'close-circle';
      case 'pending':
      case 'pending review':
        return 'time';
      case 'completed':
        return 'checkmark-done-circle';
      default:
        return 'help-circle';
    }
  };

  const blockedStatuses = new Set(['pending review', 'submitted for review', 'for-review', 'review', 'finalized', 'finalised']);
  const filteredForAppointmentData = forAppointmentData.filter((item) => !blockedStatuses.has(item.status?.toLowerCase?.() || ''));
  const filteredLegalAdviceData = legalAdviceData.filter((item) => !blockedStatuses.has(item.status?.toLowerCase?.() || ''));
  const filteredRepresentationData = representationData.filter((item) => !blockedStatuses.has(item.status?.toLowerCase?.() || ''));

  const renderAppointmentCard = (item) => (
    <View key={item.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Ionicons name="calendar" size={20} color={PRIMARY_BROWN} />
          <Text style={styles.cardType}>{item.type}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
          <Ionicons name={getStatusIcon(item.status)} size={14} color={getStatusColor(item.status)} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color={MUTED_OLIVE} />
          <Text style={styles.infoLabel}>Submitted:</Text>
          <Text style={styles.infoValue}>{item.submittedDate}</Text>
        </View>

        {item.appointmentDate && (
          <>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color={PRIMARY_BROWN} />
              <Text style={styles.infoLabel}>Date:</Text>
              <Text style={[styles.infoValue, styles.highlightedText]}>{item.appointmentDate}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="alarm-outline" size={16} color={PRIMARY_BROWN} />
              <Text style={styles.infoLabel}>Time:</Text>
              <Text style={[styles.infoValue, styles.highlightedText]}>{item.appointmentTime}</Text>
            </View>
          </>
        )}

        {item.originalDate && (
          <View style={styles.infoRow}>
            <Ionicons name="sync-outline" size={16} color={PRIMARY_GOLD} />
            <Text style={styles.infoLabel}>Original:</Text>
            <Text style={styles.infoValue}>{item.originalDate}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color={MUTED_OLIVE} />
          <Text style={styles.infoLabel}>Location:</Text>
          <Text style={styles.infoValue}>{item.location}</Text>
        </View>

        {item.purpose && (
          <View style={styles.purposeContainer}>
            <Text style={styles.purposeLabel}>Purpose:</Text>
            <Text style={styles.purposeText}>{item.purpose}</Text>
          </View>
        )}

        {item.cancelReason && (
          <View style={styles.cancelReasonContainer}>
            <Ionicons name="alert-circle" size={16} color="#E74C3C" />
            <Text style={styles.cancelReasonText}>{item.cancelReason}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderLegalAdviceCard = (item) => (
    <View key={item.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Ionicons name="document-text" size={20} color={PRIMARY_BROWN} />
          <Text style={styles.cardType}>{item.topic}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
          <Ionicons name={getStatusIcon(item.status)} size={14} color={getStatusColor(item.status)} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color={MUTED_OLIVE} />
          <Text style={styles.infoLabel}>Submitted:</Text>
          <Text style={styles.infoValue}>{item.date}</Text>
        </View>

        <Text style={styles.descriptionText}>{item.description}</Text>

        {item.appointment && (
          <View style={styles.appointmentBox}>
            <View style={styles.appointmentHeader}>
              <Ionicons name="calendar" size={18} color={PRIMARY_BROWN} />
              <Text style={styles.appointmentHeaderText}>Scheduled Appointment</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color={PRIMARY_BROWN} />
              <Text style={styles.infoLabel}>Date:</Text>
              <Text style={[styles.infoValue, styles.highlightedText]}>
                {item.appointment.date} at {item.appointment.time}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={16} color={PRIMARY_BROWN} />
              <Text style={styles.infoLabel}>Handler:</Text>
              <Text style={styles.infoValue}>
                {item.appointment.handler} ({item.appointment.role})
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color={MUTED_OLIVE} />
              <Text style={styles.infoLabel}>Location:</Text>
              <Text style={styles.infoValue}>{item.appointment.location}</Text>
            </View>
          </View>
        )}

        {item.completedDate && (
          <View style={styles.completedBox}>
            <Ionicons name="checkmark-circle" size={18} color={PRIMARY_BROWN} />
            <Text style={styles.completedText}>
              Completed on {item.completedDate}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderRepresentationCard = (item) => (
    <View key={item.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Ionicons name="briefcase" size={20} color={PRIMARY_BROWN} />
          <View>
            <Text style={styles.cardType}>{item.caseTitle}</Text>
            <Text style={styles.caseNumber}>{item.caseNumber}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.stageContainer}>
          <Text style={styles.stageLabel}>Stage:</Text>
          <View style={styles.stageBadge}>
            <Text style={styles.stageText}>{item.stage}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color={PRIMARY_BROWN} />
          <Text style={styles.infoLabel}>Next Hearing:</Text>
          <Text style={[styles.infoValue, styles.highlightedText]}>{item.nextDate}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color={MUTED_OLIVE} />
          <Text style={styles.infoLabel}>Venue:</Text>
          <Text style={styles.infoValue}>{item.location}</Text>
        </View>

        <View style={styles.attorneyBox}>
          <Ionicons name="person" size={18} color={PRIMARY_BROWN} />
          <Text style={styles.attorneyBoxText}>{item.attorney}</Text>
        </View>
      </View>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'appointment':
        return filteredForAppointmentData.length > 0 ? (
          filteredForAppointmentData.map(renderAppointmentCard)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#CCC" />
            <Text style={styles.emptyStateText}>No appointments yet</Text>
          </View>
        );
      case 'advice':
        return filteredLegalAdviceData.length > 0 ? (
          filteredLegalAdviceData.map(renderLegalAdviceCard)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#CCC" />
            <Text style={styles.emptyStateText}>No legal advice requests</Text>
          </View>
        );
      case 'representation':
        return filteredRepresentationData.length > 0 ? (
          filteredRepresentationData.map(renderRepresentationCard)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="briefcase-outline" size={64} color="#CCC" />
            <Text style={styles.emptyStateText}>No active representations</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Appointment</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'appointment' && styles.tabActive]}
          onPress={() => setActiveTab('appointment')}
        >
          <Ionicons
            name="calendar"
            size={20}
            color={activeTab === 'appointment' ? PRIMARY_BROWN : '#999'}
          />
          <Text style={[styles.tabText, activeTab === 'appointment' && styles.tabTextActive]}>
            For Appointment
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'advice' && styles.tabActive]}
          onPress={() => setActiveTab('advice')}
        >
          <Ionicons
            name="document-text"
            size={20}
            color={activeTab === 'advice' ? PRIMARY_BROWN : '#999'}
          />
          <Text style={[styles.tabText, activeTab === 'advice' && styles.tabTextActive]}>
            Legal Advice
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'representation' && styles.tabActive]}
          onPress={() => setActiveTab('representation')}
        >
          <Ionicons
            name="briefcase"
            size={20}
            color={activeTab === 'representation' ? PRIMARY_BROWN : '#999'}
          />
          <Text style={[styles.tabText, activeTab === 'representation' && styles.tabTextActive]}>
            Representation
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEMED_LIGHT_BG,
  },
  header: {
    backgroundColor: PRIMARY_BROWN,
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: PRIMARY_BROWN,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  tabTextActive: {
    color: PRIMARY_BROWN,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: THEMED_LIGHT_BG,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  cardType: {
    fontSize: 16,
    fontWeight: '700',
    color: CHARCOAL,
    flex: 1,
  },
  caseNumber: {
    fontSize: 12,
    color: MUTED_OLIVE,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardBody: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    width: 80,
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    color: CHARCOAL,
  },
  highlightedText: {
    fontWeight: '600',
    color: PRIMARY_BROWN,
  },
  purposeContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: `${PRIMARY_BROWN}10`,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: PRIMARY_BROWN,
  },
  purposeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: PRIMARY_BROWN,
    marginBottom: 4,
  },
  purposeText: {
    fontSize: 12,
    color: CHARCOAL,
    lineHeight: 18,
  },
  cancelReasonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 12,
    backgroundColor: '#FEE',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#E74C3C',
    gap: 8,
  },
  cancelReasonText: {
    flex: 1,
    fontSize: 12,
    color: '#E74C3C',
  },
  descriptionText: {
    fontSize: 13,
    color: CHARCOAL,
    lineHeight: 20,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  appointmentBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: `${MUTED_OLIVE}10`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: MUTED_OLIVE,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  appointmentHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: PRIMARY_BROWN,
  },
  completedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: `${PRIMARY_BROWN}10`,
    borderRadius: 8,
    gap: 8,
  },
  completedText: {
    fontSize: 13,
    fontWeight: '600',
    color: PRIMARY_BROWN,
  },
  stageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  stageLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  stageBadge: {
    backgroundColor: `${PRIMARY_GOLD}20`,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stageText: {
    fontSize: 12,
    fontWeight: '600',
    color: PRIMARY_GOLD,
  },
  attorneyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: `${PRIMARY_BROWN}10`,
    borderRadius: 8,
    gap: 8,
  },
  attorneyBoxText: {
    fontSize: 13,
    fontWeight: '600',
    color: PRIMARY_BROWN,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
});
