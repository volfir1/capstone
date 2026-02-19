import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { PRIMARY_BROWN, PRIMARY_GOLD, CHARCOAL, MUTED_OLIVE, ACCENT_TAN } from 'utils/constants';

const TEAM = [
  {
    name: 'John Leonard O. Nagallo',
    role: 'Lead Developer & Project Manager',
    desc: 'Specializes in full-stack development and system architecture. Passionate about using technology to solve social issues.',
    color: '#8B6F47',
  },
  {
    name: 'Gwyneth Selwyn Zoe G. Ortiz',
    role: 'UI/UX Designer & Frontend Developer',
    desc: 'Focuses on creating accessible and intuitive user interfaces. Advocates for inclusive design principles.',
    color: '#9B59B6',
  },
  {
    name: 'Jade C. Pis-an',
    role: 'Backend Developer & AI Specialist',
    desc: 'Develops AI/ML models for legal recommendations. Ensures data security and system reliability.',
    color: '#4A90D9',
  },
  {
    name: 'Lester I. Sible',
    role: 'Database Administrator & Research Lead',
    desc: 'Manages data infrastructure and conducts user research. Bridges technical solutions with community needs.',
    color: '#2ECC71',
  },
];

const CHALLENGES = [
  'Prohibitive legal costs',
  'Geographic distance from legal services',
  'Language barriers and complex legal terminology',
  'Limited awareness of legal rights and procedures',
];

const SOLUTIONS = [
  'Multilingual legal forms and guidance',
  'Remote consultations with PAO volunteer lawyers',
  'AI-powered legal recommendations',
  'Offline-capable technology for rural areas',
];

export default function About() {
  const router = useRouter();

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={CHARCOAL} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>About</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Hero */}
      <View style={s.heroSection}>
        <View style={s.heroBadge}>
          <Text style={s.heroBadgeText}>About JUSTREACH</Text>
        </View>
        <Text style={s.heroTitle}>Bridging the Justice Gap Through Innovation & Empathy</Text>
        <Text style={s.heroDesc}>
          JUSTREACH is a capstone project born from a commitment to make legal services accessible to every Filipino,
          regardless of location, income, or educational background. We're leveraging technology to create a more just
          and equitable society.
        </Text>
      </View>

      {/* Mission & Vision */}
      <View style={s.section}>
        <View style={s.card}>
          <View style={s.cardIconRow}>
            <Ionicons name="flag-outline" size={22} color={PRIMARY_BROWN} />
            <Text style={s.cardTitle}>Our Mission</Text>
          </View>
          <Text style={s.cardText}>
            To democratize access to legal services in the Philippines by creating a technology-driven platform that
            connects underserved communities with qualified legal professionals, breaking down barriers of cost, distance,
            and complexity.
          </Text>
        </View>
        <View style={[s.card, { marginTop: 10 }]}>
          <View style={s.cardIconRow}>
            <Ionicons name="eye-outline" size={22} color={PRIMARY_GOLD} />
            <Text style={s.cardTitle}>Our Vision</Text>
          </View>
          <Text style={s.cardText}>
            A Philippines where every citizen, regardless of their socioeconomic status or geographic location, can exercise
            their legal rights and access justice through an inclusive, transparent, and efficient digital platform.
          </Text>
        </View>
      </View>

      {/* SDG 16 */}
      <View style={s.section}>
        <View style={s.sdgBadge}>
          <Text style={s.sdgBadgeText}>Project Background</Text>
        </View>
        <Text style={s.sectionTitle}>Supporting SDG 16: Peace, Justice & Strong Institutions</Text>

        <View style={s.challengeCard}>
          <Text style={s.subHeading}>The Challenge</Text>
          {CHALLENGES.map((item, i) => (
            <View key={i} style={s.bulletRow}>
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
              <Text style={s.bulletText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={[s.challengeCard, { backgroundColor: '#f0fdf4', marginTop: 10 }]}>
          <Text style={[s.subHeading, { color: '#22c55e' }]}>Our Solution</Text>
          {SOLUTIONS.map((item, i) => (
            <View key={i} style={s.bulletRow}>
              <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
              <Text style={s.bulletText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Team */}
      <View style={s.section}>
        <View style={s.sdgBadge}>
          <Text style={s.sdgBadgeText}>Meet the Team</Text>
        </View>
        <Text style={s.sectionTitle}>The Minds Behind JUSTREACH</Text>
        <Text style={s.sectionSubtext}>
          A dedicated team of IT students from Technological University of the Philippines - Taguig,
          committed to making a difference through technology and innovation.
        </Text>
        {TEAM.map((member, i) => (
          <View key={i} style={s.teamCard}>
            <View style={[s.teamAvatar, { backgroundColor: member.color }]}>
              <Text style={s.teamInitials}>
                {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.teamName}>{member.name}</Text>
              <Text style={s.teamRole}>{member.role}</Text>
              <Text style={s.teamDesc}>{member.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Institution */}
      <View style={s.section}>
        <View style={s.institutionCard}>
          <Ionicons name="school-outline" size={28} color={PRIMARY_BROWN} />
          <Text style={s.institutionName}>Technological University of the Philippines - Taguig</Text>
          <Text style={s.institutionText}>
            This capstone project is presented to the Faculty of the Electrical and Allied Department as part of
            the requirements for the Bachelor of Science in Information Technology degree. Completed in August 2025.
          </Text>
          <Text style={s.institutionAddress}>
            KM. 14 East Service Road, Western Bicutan, Taguig City, Philippines
          </Text>
        </View>
      </View>

      {/* CTA */}
      <View style={s.ctaSection}>
        <Text style={s.ctaTitle}>Join Us in Making Justice Accessible</Text>
        <Text style={s.ctaText}>
          Whether you're seeking legal assistance or want to support our mission, we'd love to hear from you.
        </Text>
        <TouchableOpacity style={s.ctaBtn} onPress={() => router.push('/auth')}>
          <Text style={s.ctaBtnText}>Get Started</Text>
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
  heroBadge: { backgroundColor: `${PRIMARY_BROWN}15`, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginBottom: 14 },
  heroBadgeText: { fontSize: 12, fontWeight: '600', color: PRIMARY_BROWN },
  heroTitle: { fontSize: 22, fontWeight: '700', color: CHARCOAL, textAlign: 'center', lineHeight: 30, marginBottom: 12 },
  heroDesc: { fontSize: 14, color: MUTED_OLIVE, textAlign: 'center', lineHeight: 22 },
  section: { paddingHorizontal: 16, paddingVertical: 16 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 18 },
  cardIconRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: CHARCOAL },
  cardText: { fontSize: 13, color: MUTED_OLIVE, lineHeight: 20 },
  sdgBadge: { alignSelf: 'flex-start', backgroundColor: `${PRIMARY_GOLD}20`, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 10 },
  sdgBadgeText: { fontSize: 11, fontWeight: '600', color: PRIMARY_BROWN },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: CHARCOAL, marginBottom: 8 },
  sectionSubtext: { fontSize: 13, color: MUTED_OLIVE, lineHeight: 20, marginBottom: 14 },
  subHeading: { fontSize: 14, fontWeight: '600', color: '#ef4444', marginBottom: 8 },
  challengeCard: { backgroundColor: '#fef2f2', borderRadius: 12, padding: 16 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  bulletText: { fontSize: 13, color: CHARCOAL, flex: 1, lineHeight: 18 },
  teamCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, alignItems: 'flex-start' },
  teamAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  teamInitials: { color: '#fff', fontSize: 16, fontWeight: '600' },
  teamName: { fontSize: 14, fontWeight: '600', color: CHARCOAL },
  teamRole: { fontSize: 11, color: PRIMARY_BROWN, fontWeight: '500', marginTop: 1 },
  teamDesc: { fontSize: 12, color: MUTED_OLIVE, marginTop: 4, lineHeight: 17 },
  institutionCard: { backgroundColor: '#fff', borderRadius: 14, padding: 20, alignItems: 'center' },
  institutionName: { fontSize: 16, fontWeight: '700', color: CHARCOAL, textAlign: 'center', marginTop: 8 },
  institutionText: { fontSize: 13, color: MUTED_OLIVE, textAlign: 'center', lineHeight: 20, marginTop: 8 },
  institutionAddress: { fontSize: 11, color: '#999', textAlign: 'center', marginTop: 8 },
  ctaSection: { backgroundColor: PRIMARY_BROWN, marginHorizontal: 16, borderRadius: 16, padding: 24, alignItems: 'center' },
  ctaTitle: { fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center' },
  ctaText: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  ctaBtn: { backgroundColor: PRIMARY_GOLD, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 24, marginTop: 16 },
  ctaBtnText: { fontSize: 14, fontWeight: '600', color: CHARCOAL },
});
