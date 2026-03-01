import React, { memo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const PRIMARY_BROWN = '#8B4513';
const PRIMARY_GOLD = '#C4AB7D';
const CHARCOAL = '#2C2C2C';
const MUTED_OLIVE = '#6B6B5A';

const FeatureCard = memo(({ icon, title, description }) => (
  <View style={s.featureCard}>
    <View style={s.featureIconContainer}>
      <Ionicons name={icon} size={28} color={PRIMARY_GOLD} />
    </View>
    <Text style={s.featureTitle}>{title}</Text>
    <Text style={s.featureDescription}>{description}</Text>
  </View>
));

const SectionHeader = memo(({ badge, title, description }) => (
  <View style={s.sectionHeader}>
    <View style={s.badge}>
      <Text style={s.badgeText}>{badge}</Text>
    </View>
    <Text style={s.sectionTitle}>{title}</Text>
    {description && <Text style={s.sectionDescription}>{description}</Text>}
  </View>
));

export default function FeaturesPage() {
  const router = useRouter();

  const coreFeatures = [
    { icon: 'document-text-outline', title: 'Smart Case Management', description: 'Comprehensive case tracking from intake to resolution with automated workflow and status updates.' },
    { icon: 'people-outline', title: 'Client Intake System', description: 'Streamlined multi-step client information gathering with appointment scheduling and calendar integration.' },
    { icon: 'git-branch-outline', title: 'Review Workflow', description: 'Multi-level case review process with intern, supervising lawyer, and director approval stages.' },
    { icon: 'analytics-outline', title: 'Analytics Dashboard', description: 'Real-time analytics with personnel leaderboards, case trends, and decision breakdown charts.' },
    { icon: 'notifications-outline', title: 'Real-time Notifications', description: 'Instant push notifications for case updates, appointment changes, and review status changes.' },
    { icon: 'calendar-outline', title: 'Appointment Management', description: 'Calendar-based appointment scheduling with approval workflows and Google Calendar integration.' },
  ];

  const securityFeatures = [
    { icon: 'shield-checkmark-outline', title: 'Firebase Authentication', description: 'Secure email/password and Google OAuth authentication with email verification.' },
    { icon: 'lock-closed-outline', title: 'Role-Based Access Control', description: 'Granular permissions for secretaries, interns, supervising lawyers, directors, and attorneys.' },
    { icon: 'key-outline', title: 'Token-Based Security', description: 'JWT token authentication with automatic refresh and secure session management.' },
    { icon: 'finger-print-outline', title: 'Data Encryption', description: 'End-to-end encryption for sensitive legal documents and client communications.' },
  ];

  const workflowFeatures = [
    { icon: 'create-outline', title: 'Digital Signatures', description: 'Canvas-based signature capture for legal document authentication.' },
    { icon: 'cloud-upload-outline', title: 'Document Upload', description: 'Support for Word documents and PDF files with in-app document viewer.' },
    { icon: 'people-circle-outline', title: 'Case Assignment', description: 'Assign attorneys to cases with tracking for assignments made and received.' },
    { icon: 'clipboard-outline', title: 'Case Records', description: 'Detailed case record management with version history and appointment receipts.' },
  ];

  const technicalFeatures = [
    { icon: 'logo-react', title: 'React & React Native', description: 'Modern cross-platform development with shared backend API.' },
    { icon: 'server-outline', title: 'Node.js Backend', description: 'Express.js server with MongoDB database and Socket.IO real-time events.' },
    { icon: 'cloud-outline', title: 'Cloudinary Integration', description: 'Cloud-based image upload and storage for profile pictures and documents.' },
    { icon: 'logo-google', title: 'Google Calendar', description: 'Seamless Google Calendar integration for appointment scheduling.' },
  ];

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={CHARCOAL} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Features</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Hero */}
      <View style={s.heroSection}>
        <View style={s.badge}>
          <Text style={s.badgeText}>Platform Features</Text>
        </View>
        <Text style={s.heroTitle}>Everything You Need for Legal Case Management</Text>
        <Text style={s.heroDesc}>
          JustReach provides a comprehensive suite of tools designed to streamline 
          legal aid operations, from client intake to case resolution.
        </Text>
      </View>

      {/* Core Features */}
      <View style={s.section}>
        <SectionHeader badge="Core Features" title="Powerful Case Management Tools" description="Essential features for managing legal cases efficiently." />
        {coreFeatures.map((feature, index) => (
          <FeatureCard key={index} {...feature} />
        ))}
      </View>

      {/* Security Features */}
      <View style={s.section}>
        <SectionHeader badge="Security" title="Enterprise-Grade Security" description="Your data is protected with industry-standard security measures." />
        {securityFeatures.map((feature, index) => (
          <FeatureCard key={index} {...feature} />
        ))}
      </View>

      {/* Workflow Features */}
      <View style={s.section}>
        <SectionHeader badge="Workflow" title="Streamlined Workflows" description="Efficient processes for every stage of case management." />
        {workflowFeatures.map((feature, index) => (
          <FeatureCard key={index} {...feature} />
        ))}
      </View>

      {/* Technical Features */}
      <View style={s.section}>
        <SectionHeader badge="Technical" title="Modern Technology Stack" description="Built with cutting-edge technologies for reliability and performance." />
        {technicalFeatures.map((feature, index) => (
          <FeatureCard key={index} {...feature} />
        ))}
      </View>

      {/* CTA */}
      <View style={s.ctaSection}>
        <Text style={s.ctaTitle}>Ready to Get Started?</Text>
        <Text style={s.ctaText}>Experience all these features and more.</Text>
        <TouchableOpacity style={s.ctaBtn} onPress={() => router.push('/auth')}>
          <Text style={s.ctaBtnText}>Sign In</Text>
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
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: CHARCOAL, marginBottom: 8 },
  sectionDescription: { fontSize: 13, color: MUTED_OLIVE, lineHeight: 20 },
  featureCard: { backgroundColor: '#fff', borderRadius: 14, padding: 18, marginBottom: 10 },
  featureIconContainer: { width: 48, height: 48, borderRadius: 12, backgroundColor: `${PRIMARY_GOLD}15`, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  featureTitle: { fontSize: 15, fontWeight: '600', color: CHARCOAL, marginBottom: 6 },
  featureDescription: { fontSize: 13, color: MUTED_OLIVE, lineHeight: 20 },
  ctaSection: { backgroundColor: PRIMARY_BROWN, marginHorizontal: 16, borderRadius: 16, padding: 24, alignItems: 'center' },
  ctaTitle: { fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center' },
  ctaText: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  ctaBtn: { backgroundColor: PRIMARY_GOLD, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 24, marginTop: 16 },
  ctaBtnText: { fontSize: 14, fontWeight: '600', color: CHARCOAL },
});
