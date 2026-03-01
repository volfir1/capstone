import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const PRIMARY_GOLD = '#C9A84C';
const CHARCOAL = '#2A303C';
const MUTED = '#6B7280';
const GOLD_LIGHT = '#E8D5A3';
const GOLD_PALE = '#FAF6EE';
const ACCENT_TAN = '#A8936A';

const sections = [
  {
    number: '01', title: 'Information We Collect', icon: 'cloud-download-outline', tag: 'Collection',
    content: 'We collect only the information necessary to provide and improve our services — including account details, email address, and any information you voluntarily provide through forms or interactions with our platform.',
  },
  {
    number: '02', title: 'How We Use Data', icon: 'bar-chart-outline', tag: 'Usage',
    content: 'Your data is used solely to authenticate users, personalize your experience, and deliver platform features. We do not — and will never — sell your personal information to third parties under any circumstances.',
  },
  {
    number: '03', title: 'Cookies & Authentication', icon: 'key-outline', tag: 'Cookies',
    content: 'We use secure, encrypted cookies and Firebase authentication to maintain your signed-in session. All sensitive session cookies are HTTP-only and protected against cross-site scripting to ensure your credentials remain safe.',
  },
  {
    number: '04', title: 'Data Sharing', icon: 'share-outline', tag: 'Sharing',
    content: 'We share your data only to the minimum extent necessary to operate our services — specifically with vetted third-party service providers — or when compelled by applicable law. We do not engage in unauthorized data sharing of any kind.',
  },
  {
    number: '05', title: 'Security', icon: 'lock-closed-outline', tag: 'Security',
    content: 'We employ reasonable and industry-standard technical and organizational safeguards to protect your data at rest and in transit. In the unlikely event of a security breach, we commit to notifying all affected users promptly and transparently.',
  },
  {
    number: '06', title: 'Your Rights', icon: 'person-circle-outline', tag: 'Rights',
    content: 'You have the right to request access to, correction of, or deletion of your personal data at any time. You may also request a portable copy of your data or object to certain processing activities. Contact us to exercise any of these rights.',
  },
  {
    number: '07', title: 'Contact', icon: 'mail-outline', tag: 'Contact',
    content: 'Our privacy team is here to help with any questions, concerns, or requests regarding your personal data. Reach us directly at justreach4@gmail.com.',
  },
];

const commitments = [
  { icon: 'lock-closed-outline', label: 'Data Encrypted' },
  { icon: 'shield-checkmark-outline', label: 'Never Sold' },
  { icon: 'person-circle-outline', label: 'GDPR Ready' },
];

export default function Privacy() {
  const router = useRouter();

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={CHARCOAL} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Hero */}
      <View style={s.heroSection}>
        <View style={s.orgRow}>
          <Ionicons name="shield-checkmark-outline" size={20} color={PRIMARY_GOLD} />
          <Text style={s.orgName}>San Sebastian Office of Legal Aid</Text>
        </View>
        <Text style={s.heroTitle}>Privacy Policy</Text>
        <Text style={s.heroDesc}>
          We respect your privacy and are committed to protecting your personal data. 
          This policy explains how we collect, use, and safeguard your information.
        </Text>
        <View style={s.commitmentRow}>
          {commitments.map((item, i) => (
            <View key={i} style={s.commitmentItem}>
              <Ionicons name={item.icon} size={14} color={PRIMARY_GOLD} />
              <Text style={s.commitmentText}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Sections */}
      <View style={s.sectionsContainer}>
        {sections.map((section, index) => (
          <View key={index} style={s.sectionCard}>
            <View style={s.sectionHeader}>
              <View style={s.sectionIconContainer}>
                <Ionicons name={section.icon} size={20} color={PRIMARY_GOLD} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={s.sectionTitle}>{section.title}</Text>
                  <View style={s.tagBadge}>
                    <Text style={s.tagText}>{section.tag}</Text>
                  </View>
                </View>
              </View>
            </View>
            <Text style={s.sectionContent}>{section.content}</Text>
            {section.number === '07' && (
              <TouchableOpacity onPress={() => Linking.openURL('mailto:justreach4@gmail.com')}>
                <Text style={s.emailLink}>justreach4@gmail.com</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={s.footer}>
        <Ionicons name="shield-checkmark-outline" size={20} color={PRIMARY_GOLD} />
        <Text style={s.footerTitle}>Your Privacy Is Protected</Text>
        <Text style={s.footerDate}>Effective date: February 27, 2026</Text>
      </View>

      <Text style={s.copyright}>© 2026 San Sebastian Office of Legal Aid. All rights reserved.</Text>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F1EB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: CHARCOAL },
  heroSection: { backgroundColor: CHARCOAL, paddingHorizontal: 20, paddingVertical: 28 },
  orgRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  orgName: { fontSize: 14, color: '#fff', fontWeight: '600' },
  heroTitle: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 12 },
  heroDesc: { fontSize: 14, color: '#9CA3AF', lineHeight: 22 },
  commitmentRow: { flexDirection: 'row', gap: 20, marginTop: 20, flexWrap: 'wrap' },
  commitmentItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  commitmentText: { fontSize: 12, color: '#9CA3AF' },
  sectionsContainer: { paddingHorizontal: 16, paddingVertical: 16 },
  sectionCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  sectionIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: GOLD_PALE, borderWidth: 1, borderColor: GOLD_LIGHT, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: CHARCOAL },
  tagBadge: { backgroundColor: GOLD_PALE, borderWidth: 1, borderColor: GOLD_LIGHT, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  tagText: { fontSize: 10, fontWeight: '600', color: ACCENT_TAN, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionContent: { fontSize: 14, color: MUTED, lineHeight: 22 },
  emailLink: { fontSize: 14, color: PRIMARY_GOLD, fontWeight: '600', marginTop: 8 },
  footer: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 16 },
  footerTitle: { fontSize: 14, fontWeight: '600', color: CHARCOAL, marginTop: 8 },
  footerDate: { fontSize: 12, color: MUTED, marginTop: 4 },
  copyright: { textAlign: 'center', fontSize: 12, color: MUTED, paddingHorizontal: 16 },
});
