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
    number: '01', title: 'Acceptance', icon: 'document-text-outline', tag: 'Agreement',
    content: 'By accessing or using our service, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms in their entirety, you are not authorized to use our service in any manner.',
  },
  {
    number: '02', title: 'Accounts', icon: 'person-outline', tag: 'Accounts',
    content: 'Account holders bear full responsibility for safeguarding their credentials and maintaining the security of their account. You agree to provide accurate, current, and complete information during registration and to update such information as necessary.',
  },
  {
    number: '03', title: 'Acceptable Use', icon: 'ban-outline', tag: 'Conduct',
    content: 'You agree not to use the service for any unlawful purpose or in any way that violates these Terms. Abusive, harmful, or fraudulent behavior — including unauthorized access attempts — may result in immediate suspension or permanent termination of your account.',
  },
  {
    number: '04', title: 'Intellectual Property', icon: 'copy-outline', tag: 'IP Rights',
    content: 'All content, software, trademarks, and materials made available through the service are the exclusive property of us and our licensors. You may not copy, reproduce, distribute, or create derivative works without prior written permission.',
  },
  {
    number: '05', title: 'Disclaimers & Limitation', icon: 'alert-circle-outline', tag: 'Liability',
    content: 'The service is provided on an "as is" and "as available" basis without warranties of any kind, either express or implied. To the fullest extent permitted by applicable law, we expressly disclaim all warranties, including implied warranties of merchantability and fitness for a particular purpose.',
  },
  {
    number: '06', title: 'Governing Law', icon: 'globe-outline', tag: 'Jurisdiction',
    content: 'These Terms of Service and any disputes arising out of or related to them shall be governed by and construed in accordance with the applicable laws of the jurisdiction in which the company is incorporated, without regard to conflict of law provisions.',
  },
  {
    number: '07', title: 'Contact', icon: 'mail-outline', tag: 'Contact',
    content: 'If you have questions, concerns, or requests regarding these Terms, our legal team is available to assist you. Please direct all correspondence to justreach4@gmail.com.',
  },
];

export default function Terms() {
  const router = useRouter();

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={CHARCOAL} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Terms of Service</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Hero */}
      <View style={s.heroSection}>
        <View style={s.orgRow}>
          <Ionicons name="scale-outline" size={20} color={PRIMARY_GOLD} />
          <Text style={s.orgName}>San Sebastian Office of Legal Aid</Text>
        </View>
        <Text style={s.heroTitle}>Terms of Service</Text>
        <Text style={s.heroDesc}>
          Please read these terms carefully before using our service. Your continued 
          use constitutes acceptance of all conditions herein.
        </Text>
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
        <Ionicons name="scale-outline" size={20} color={PRIMARY_GOLD} />
        <Text style={s.footerTitle}>Terms of Service</Text>
        <Text style={s.footerDate}>Effective date: February 27, 2026</Text>
        <View style={s.footerLinks}>
          <TouchableOpacity onPress={() => router.push('/privacy')}>
            <Text style={s.footerLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>
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
  footerLinks: { flexDirection: 'row', gap: 16, marginTop: 12 },
  footerLink: { fontSize: 12, color: ACCENT_TAN, textDecorationLine: 'underline' },
  copyright: { textAlign: 'center', fontSize: 12, color: MUTED, paddingHorizontal: 16 },
});
