import React, { memo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const PRIMARY_BROWN = '#8B4513';
const PRIMARY_GOLD = '#C4AB7D';
const CHARCOAL = '#2C2C2C';
const MUTED_OLIVE = '#6B6B5A';

const StepCard = memo(({ stepNumber, icon, title, description }) => (
  <View style={s.stepCard}>
    <View style={s.stepBadge}>
      <Text style={s.stepNumber}>Step {stepNumber}</Text>
    </View>
    <View style={s.stepIconContainer}>
      <Ionicons name={icon} size={28} color={PRIMARY_GOLD} />
    </View>
    <Text style={s.stepTitle}>{title}</Text>
    <Text style={s.stepDescription}>{description}</Text>
  </View>
));

const WorkflowItem = memo(({ icon, title, description, role }) => (
  <View style={s.workflowCard}>
    <View style={s.workflowIconContainer}>
      <Ionicons name={icon} size={24} color={PRIMARY_GOLD} />
    </View>
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={s.workflowTitle}>{title}</Text>
        {role && (
          <View style={s.roleBadge}>
            <Text style={s.roleBadgeText}>{role}</Text>
          </View>
        )}
      </View>
      <Text style={s.workflowDescription}>{description}</Text>
    </View>
  </View>
));

const UserTypeCard = memo(({ icon, title, description, capabilities }) => (
  <View style={s.userTypeCard}>
    <View style={s.userTypeHeader}>
      <Ionicons name={icon} size={28} color={PRIMARY_GOLD} />
      <Text style={s.userTypeTitle}>{title}</Text>
    </View>
    <Text style={s.userTypeDescription}>{description}</Text>
    {capabilities.map((cap, i) => (
      <View key={i} style={s.capabilityRow}>
        <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
        <Text style={s.capabilityText}>{cap}</Text>
      </View>
    ))}
  </View>
));

export default function HowItWorksPage() {
  const router = useRouter();

  const mainSteps = [
    { icon: 'calendar-outline', title: 'Book an Appointment', description: 'Walk-in clients or online users can book a legal consultation appointment through our scheduling system.' },
    { icon: 'person-outline', title: 'Client Intake', description: 'Complete the multi-step form with personal, financial, and case details for proper assessment.' },
    { icon: 'document-text-outline', title: 'Case Review', description: 'Legal interns review your case, which then goes through supervising lawyer and director approval.' },
    { icon: 'checkmark-done-outline', title: 'Case Resolution', description: 'Once approved, your case is finalized with proper documentation, legal advice, or court representation.' },
  ];

  const workflowSteps = [
    { icon: 'create-outline', title: 'Intern Creates Review', description: 'Conducts interview, documents evidence, and classifies the case type.', role: 'Intern' },
    { icon: 'eye-outline', title: 'Supervising Lawyer Review', description: 'Reviews the intern\'s work, approves or returns with feedback.', role: 'Supervising Lawyer' },
    { icon: 'shield-checkmark-outline', title: 'Director Approval', description: 'Final approval or return of the case review.', role: 'Director' },
    { icon: 'checkmark-circle-outline', title: 'Case Finalization', description: 'Case is finalized as accepted (legal advice, document drafting, or court representation) or rejected.', role: 'System' },
  ];

  const userTypes = [
    {
      icon: 'person-outline', title: 'Clients',
      description: 'Individuals seeking legal assistance.',
      capabilities: ['Book appointments online or walk-in', 'Submit intake forms', 'Receive legal advice or representation'],
    },
    {
      icon: 'school-outline', title: 'Legal Interns',
      description: 'Law students conducting initial case reviews.',
      capabilities: ['Conduct client interviews', 'Document case evidence', 'Create and submit case reviews'],
    },
    {
      icon: 'briefcase-outline', title: 'Supervising Lawyers',
      description: 'Licensed attorneys overseeing case reviews.',
      capabilities: ['Review intern submissions', 'Approve or return cases', 'Provide legal guidance'],
    },
    {
      icon: 'ribbon-outline', title: 'Director',
      description: 'Head of the legal aid office.',
      capabilities: ['Final case approval authority', 'Review analytics and reports', 'Manage organizational operations'],
    },
  ];

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={CHARCOAL} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>How It Works</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Hero */}
      <View style={s.heroSection}>
        <View style={s.badge}>
          <Text style={s.badgeText}>How It Works</Text>
        </View>
        <Text style={s.heroTitle}>Simple Steps to Access Legal Assistance</Text>
        <Text style={s.heroDesc}>
          Our streamlined process makes it easy to get the legal help you need, 
          from booking an appointment to case resolution.
        </Text>
      </View>

      {/* Main Steps */}
      <View style={s.section}>
        <View style={s.badge}>
          <Text style={s.badgeText}>Getting Started</Text>
        </View>
        <Text style={s.sectionTitle}>4 Simple Steps</Text>
        {mainSteps.map((step, index) => (
          <StepCard key={index} stepNumber={index + 1} {...step} />
        ))}
      </View>

      {/* Detailed Workflow */}
      <View style={s.section}>
        <View style={s.badge}>
          <Text style={s.badgeText}>Review Process</Text>
        </View>
        <Text style={s.sectionTitle}>Case Review Workflow</Text>
        <Text style={s.sectionDescription}>Every case goes through a thorough multi-level review process.</Text>
        {workflowSteps.map((step, index) => (
          <WorkflowItem key={index} {...step} />
        ))}
      </View>

      {/* User Types */}
      <View style={s.section}>
        <View style={s.badge}>
          <Text style={s.badgeText}>User Roles</Text>
        </View>
        <Text style={s.sectionTitle}>Who Uses JustReach?</Text>
        {userTypes.map((type, index) => (
          <UserTypeCard key={index} {...type} />
        ))}
      </View>

      {/* CTA */}
      <View style={s.ctaSection}>
        <Text style={s.ctaTitle}>Ready to Begin?</Text>
        <Text style={s.ctaText}>Book an appointment or sign in to get started.</Text>
        <TouchableOpacity style={s.ctaBtn} onPress={() => router.push('/appointment')}>
          <Text style={s.ctaBtnText}>Book Appointment</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: CHARCOAL },
  heroSection: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 28, alignItems: 'center' },
  badge: { backgroundColor: `${PRIMARY_BROWN}15`, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginBottom: 14, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '600', color: PRIMARY_BROWN },
  heroTitle: { fontSize: 22, fontWeight: '700', color: CHARCOAL, textAlign: 'center', lineHeight: 30, marginBottom: 12 },
  heroDesc: { fontSize: 14, color: MUTED_OLIVE, textAlign: 'center', lineHeight: 22 },
  section: { paddingHorizontal: 16, paddingVertical: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: CHARCOAL, marginBottom: 8 },
  sectionDescription: { fontSize: 13, color: MUTED_OLIVE, lineHeight: 20, marginBottom: 12 },
  stepCard: { backgroundColor: '#fff', borderRadius: 14, padding: 18, marginBottom: 10, position: 'relative' },
  stepBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: `${PRIMARY_GOLD}20`, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  stepNumber: { fontSize: 11, fontWeight: '600', color: PRIMARY_BROWN },
  stepIconContainer: { width: 48, height: 48, borderRadius: 12, backgroundColor: `${PRIMARY_GOLD}15`, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  stepTitle: { fontSize: 15, fontWeight: '600', color: CHARCOAL, marginBottom: 6 },
  stepDescription: { fontSize: 13, color: MUTED_OLIVE, lineHeight: 20 },
  workflowCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, alignItems: 'flex-start', gap: 12 },
  workflowIconContainer: { width: 40, height: 40, borderRadius: 10, backgroundColor: `${PRIMARY_GOLD}15`, justifyContent: 'center', alignItems: 'center' },
  workflowTitle: { fontSize: 14, fontWeight: '600', color: CHARCOAL },
  workflowDescription: { fontSize: 12, color: MUTED_OLIVE, marginTop: 4, lineHeight: 18 },
  roleBadge: { backgroundColor: `${PRIMARY_BROWN}15`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  roleBadgeText: { fontSize: 10, fontWeight: '600', color: PRIMARY_BROWN },
  userTypeCard: { backgroundColor: '#fff', borderRadius: 14, padding: 18, marginBottom: 10 },
  userTypeHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  userTypeTitle: { fontSize: 16, fontWeight: '600', color: CHARCOAL },
  userTypeDescription: { fontSize: 13, color: MUTED_OLIVE, marginBottom: 10, lineHeight: 18 },
  capabilityRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  capabilityText: { fontSize: 12, color: CHARCOAL, flex: 1 },
  ctaSection: { backgroundColor: PRIMARY_BROWN, marginHorizontal: 16, borderRadius: 16, padding: 24, alignItems: 'center' },
  ctaTitle: { fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center' },
  ctaText: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  ctaBtn: { backgroundColor: PRIMARY_GOLD, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 24, marginTop: 16 },
  ctaBtnText: { fontSize: 14, fontWeight: '600', color: CHARCOAL },
});
