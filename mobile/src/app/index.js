import React, { memo, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ImageBackground, StyleSheet, Dimensions, Image } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from 'context/authContext';

const { width } = Dimensions.get('window');
const PRIMARY_GOLD = '#C4AB7D';
const PRIMARY_BROWN = '#8B4513';
const MUTED_OLIVE = '#6B6B5A';
const CHARCOAL = '#2C2C2C';

const FEATURES = [
  { icon: 'calendar-outline', title: 'Easy Appointment Booking', desc: 'Submit a legal aid appointment request anytime — no account or login required. Just fill out the form and you\'re set.' },
  { icon: 'people-outline', title: 'Free Legal Consultations', desc: 'Get connected with verified legal aid lawyers for free professional advice, document drafting, and court representation.' },
  { icon: 'clipboard-outline', title: 'Guided Appointment Form', desc: 'Our step-by-step form walks you through providing the right details so the legal office can assess your concern quickly.' },
  { icon: 'hand-left-outline', title: 'No Account Needed', desc: 'You don\'t need to create an account or remember a password. Simply submit your appointment and the office takes it from there.' },
];

const STEPS = [
  { num: '01', icon: 'clipboard-outline', title: 'Submit Appointment', desc: 'Fill out the guided appointment form with your personal details and legal concern — no account needed.' },
  { num: '02', icon: 'person-circle-outline', title: 'Office Reviews', desc: 'The SOLA legal office staff reviews your submission and evaluates your legal concern.' },
  { num: '03', icon: 'calendar-outline', title: 'Get Scheduled', desc: 'The office confirms your appointment and schedules a consultation date at the legal aid office.' },
  { num: '04', icon: 'hammer-outline', title: 'Meet at the Office', desc: 'Visit the SOLA office for your consultation. All case discussions, updates, and decisions happen in person.' },
];

const STATS = [
  { value: '100%', label: 'Free legal assistance for qualified individuals' },
  { value: '24/7', label: 'Appointment form available anytime' },
  { value: '4-Step', label: 'Simple process from request to consultation' },
  { value: 'No Login', label: 'Book an appointment without an account' },
];

const TEAM = [
  { name: 'John Leonard O. Nagallo', role: 'Lead Developer & Project Manager', initials: 'JN', img: require('@assets/images/profiles/person_2.jpg') },
  { name: 'Gwyneth Selwyn Zoe G. Ortiz', role: 'UI/UX Designer & Frontend Developer', initials: 'GO', img: require('@assets/images/profiles/person_1.jpg') },
  { name: 'Jade C. Pis-an', role: 'Backend Developer & AI Specialist', initials: 'JP', img: require('@assets/images/profiles/person_3.jpg') },
  { name: 'Lester I. Sible', role: 'Database Admin & Research Lead', initials: 'LS', img: require('@assets/images/profiles/person_4.jpg') },
];

const SectionBadge = memo(({ children }) => (
  <View style={s.sectionBadge}>
    <Text style={s.sectionBadgeText}>{children}</Text>
  </View>
));

const FeatureCard = memo(({ icon, title, desc }) => (
  <View style={s.featureCard}>
    <View style={s.featureIcon}>
      <Ionicons name={icon} size={24} color={PRIMARY_BROWN} />
    </View>
    <Text style={s.featureTitle}>{title}</Text>
    <Text style={s.featureDesc}>{desc}</Text>
  </View>
));

const StepCard = memo(({ num, icon, title, desc }) => (
  <View style={s.stepCard}>
    <Text style={s.stepNum}>{num}</Text>
    <View style={s.stepIcon}>
      <Ionicons name={icon} size={22} color={PRIMARY_BROWN} />
    </View>
    <Text style={s.stepTitle}>{title}</Text>
    <Text style={s.stepDesc}>{desc}</Text>
  </View>
));

const TeamCard = memo(({ name, role, initials, img }) => (
  <View style={s.teamCard}>
    <View style={s.teamAvatar}>
      {img ? (
        <Image source={img} style={s.teamImage} />
      ) : (
        <Text style={s.teamInitials}>{initials}</Text>
      )}
    </View>
    <Text style={s.teamName}>{name}</Text>
    <Text style={s.teamRole}>{role}</Text>
  </View>
));

export default function LandingPage() {
  const { userLoggedIn, userData } = useAuth();

  useEffect(() => {
    if (userLoggedIn && userData) {
      router.replace('/admin');
    }
  }, [userLoggedIn, userData]);

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerContent}>
          <View style={s.logoRow}>
            <Ionicons name="scale-outline" size={22} color={PRIMARY_GOLD} />
            <Text style={s.logoGold}>SOLA – </Text>
            <Text style={s.logoBrown}>JustReach</Text>
          </View>
          <Link href="/appointment" asChild>
            <TouchableOpacity style={s.headerCta}>
              <Text style={s.headerCtaText}>Get Legal Aid</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      {/* Hero */}
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1920&q=80' }}
        style={s.heroBg}
        resizeMode="cover"
      >
        <View style={s.heroOverlay}>
          <View style={s.heroPad}>
            <View style={s.sdgBadge}>
              <Text style={s.sdgText}>Supporting SDG 16: Peace, Justice & Strong Institutions</Text>
            </View>
            <Text style={s.heroTitle}>
              Free Legal Aid for{' '}
              <Text style={{ color: PRIMARY_GOLD }}>Filipino Communities</Text>
            </Text>
            <Text style={s.heroSub}>
              Book a free legal aid appointment with SOLA — no account needed. Just submit the form and the office handles the rest, from review to consultation.
            </Text>
            <Link href="/appointment" asChild>
              <TouchableOpacity style={s.heroBtn}>
                <Text style={s.heroBtnText}>Get Legal Assistance</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ImageBackground>

      {/* Features */}
      <View style={s.section}>
        <SectionBadge>Platform Features</SectionBadge>
        <Text style={s.sectionTitle}>Why Choose SOLA</Text>
        <Text style={s.sectionSub}>
          We make it simple to access free legal aid — just book an appointment and the office takes care of everything else.
        </Text>
        <View style={s.featureGrid}>
          {FEATURES.map((f, i) => <FeatureCard key={i} {...f} />)}
        </View>
      </View>

      {/* How It Works */}
      <View style={[s.section, { backgroundColor: '#FAFAF8' }]}>
        <SectionBadge>How It Works</SectionBadge>
        <Text style={s.sectionTitle}>Get Legal Help in 4 Simple Steps</Text>
        <Text style={s.sectionSub}>
          We've streamlined the legal assistance process to make it accessible, transparent, and efficient.
        </Text>
        <View style={s.stepsGrid}>
          {STEPS.map((st, i) => <StepCard key={i} {...st} />)}
        </View>
        <Link href="/appointment" asChild>
          <TouchableOpacity style={[s.heroBtn, { alignSelf: 'center', marginTop: 24 }]}>
            <Text style={s.heroBtnText}>Start Your Request</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </Link>
      </View>

      {/* Stats */}
      <View style={s.section}>
        <View style={s.statsRow}>
          {STATS.map((st, i) => (
            <View key={i} style={s.statItem}>
              <Text style={s.statValue}>{st.value}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* About */}
      <View style={[s.section, { backgroundColor: '#FAFAF8' }]}>
        <SectionBadge>About</SectionBadge>
        <Text style={s.sectionTitle}>The Sebastinian Office of Legal Aid</Text>
        <Text style={s.sectionSub}>
          SOLA was established on August 28, 1992, under the Supreme Court's permit. As the legal aid arm of San Sebastian College–Recoletos, 
          it provides free, accessible, ethical, and quality legal representation to indigent individuals.
        </Text>
        <View style={s.aboutCard}>
          <Ionicons name="flag-outline" size={22} color={PRIMARY_BROWN} />
          <Text style={s.aboutCardTitle}>Our Mission</Text>
          <Text style={s.aboutCardDesc}>
            To democratize access to legal services in the Philippines by creating a technology-driven platform that connects underserved communities with qualified legal professionals.
          </Text>
        </View>
        <View style={[s.aboutCard, { marginTop: 12 }]}>
          <Ionicons name="heart-outline" size={22} color={PRIMARY_GOLD} />
          <Text style={s.aboutCardTitle}>Our Vision</Text>
          <Text style={s.aboutCardDesc}>
            A Philippines where every citizen, regardless of socioeconomic status or geographic location, can exercise their legal rights and access justice.
          </Text>
        </View>
        {/* Contact */}
        <View style={[s.aboutCard, { marginTop: 12 }]}>
          <View style={s.contactRow}>
            <Ionicons name="location-outline" size={18} color={PRIMARY_BROWN} />
            <Text style={s.contactText}>SSC-R Law Building, Recto Ave, Quiapo, Manila, 1001 Metro Manila</Text>
          </View>
          <View style={[s.contactRow, { marginTop: 8 }]}>
            <Ionicons name="call-outline" size={18} color={PRIMARY_BROWN} />
            <Text style={s.contactText}>(02) 8734-8931 loc. 313</Text>
          </View>
          <View style={[s.contactRow, { marginTop: 8 }]}>
            <Ionicons name="mail-outline" size={18} color={PRIMARY_BROWN} />
            <Text style={[s.contactText, { color: PRIMARY_BROWN, fontWeight: '500' }]}>sola@sscrrnl.edu.ph</Text>
          </View>
        </View>
      </View>

      {/* Team */}
      <View style={s.section}>
        <SectionBadge>The Team</SectionBadge>
        <Text style={s.sectionTitle}>The Minds Behind JustReach</Text>
        <Text style={s.sectionSub}>
          IT students from the Technological University of the Philippines – Taguig, committed to making a difference through technology.
        </Text>
        <View style={s.teamGrid}>
          {TEAM.map((m, i) => <TeamCard key={i} {...m} />)}
        </View>
      </View>

      {/* CTA */}
      <View style={s.ctaSection}>
        <Text style={s.ctaTitle}>Ready to Access Justice?</Text>
        <Text style={s.ctaSub}>
          Take the first step toward resolving your legal concern. Book a free appointment — no account or login needed.
        </Text>
        <View style={s.ctaBadges}>
          <View style={s.ctaBadge}><Text style={s.ctaBadgeText}>No hidden fees</Text></View>
          <View style={s.ctaBadge}><Text style={s.ctaBadgeText}>No account needed</Text></View>
          <View style={s.ctaBadge}><Text style={s.ctaBadgeText}>Verified lawyers</Text></View>
        </View>
        <Link href="/appointment" asChild>
          <TouchableOpacity style={s.ctaBtn}>
            <Text style={s.ctaBtnText}>Schedule Free Appointment</Text>
            <Ionicons name="arrow-forward" size={18} color={PRIMARY_BROWN} />
          </TouchableOpacity>
        </Link>
        <Link href="/auth" asChild>
          <TouchableOpacity style={s.staffBtn}>
            <Ionicons name="log-in-outline" size={18} color={PRIMARY_GOLD} />
            <Text style={s.staffBtnText}>Staff Login</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {/* Footer */}
      <View style={s.footer}>
        <View style={s.footerBrand}>
          <Ionicons name="scale-outline" size={20} color={PRIMARY_GOLD} />
          <Text style={s.footerLogoGold}>Just</Text>
          <Text style={s.footerLogoBrown}>Reach</Text>
        </View>
        <Text style={s.footerDesc}>Sebastinian Office of Legal Aid</Text>
        <Text style={s.footerSdg}>Supporting SDG 16: Peace, Justice, and Strong Institutions</Text>
        <View style={s.footerLinks}>
          <View style={s.footerCol}>
            <Text style={s.footerColTitle}>Platform</Text>
            <TouchableOpacity><Text style={s.footerLink}>Features</Text></TouchableOpacity>
            <TouchableOpacity><Text style={s.footerLink}>How It Works</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/about')}><Text style={s.footerLink}>About</Text></TouchableOpacity>
          </View>
          <View style={s.footerCol}>
            <Text style={s.footerColTitle}>Contact</Text>
            <Text style={s.footerLink}>SSC-R Law Building, Manila</Text>
            <Text style={s.footerLink}>(02) 8734-8931</Text>
            <Text style={s.footerLink}>sola@sscrrnl.edu.ph</Text>
          </View>
          <View style={s.footerCol}>
            <Text style={s.footerColTitle}>Legal</Text>
            <TouchableOpacity onPress={() => router.push('/privacy')}><Text style={s.footerLink}>Privacy Policy</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/terms')}><Text style={s.footerLink}>Terms of Service</Text></TouchableOpacity>
          </View>
        </View>
        <View style={s.footerDivider} />
        <Text style={s.footerCopy}>© {new Date().getFullYear()} SOLA — JustReach. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  // Header
  header: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e8e8e8' },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, paddingTop: 50 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  logoGold: { fontSize: 16, fontWeight: '700', color: PRIMARY_GOLD },
  logoBrown: { fontSize: 16, fontWeight: '700', color: PRIMARY_BROWN },
  headerCta: { backgroundColor: PRIMARY_BROWN, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  headerCtaText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  // Hero
  heroBg: { minHeight: 420 },
  heroOverlay: { flex: 1, backgroundColor: 'rgba(44,44,44,0.85)', justifyContent: 'center' },
  heroPad: { padding: 24, paddingVertical: 48 },
  sdgBadge: { backgroundColor: 'rgba(196,171,125,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 16 },
  sdgText: { color: PRIMARY_GOLD, fontSize: 11, fontWeight: '600' },
  heroTitle: { fontSize: 28, fontWeight: '700', color: '#fff', lineHeight: 36, marginBottom: 12 },
  heroSub: { fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 23, marginBottom: 24 },
  heroBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: PRIMARY_BROWN, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 24, alignSelf: 'flex-start' },
  heroBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  // Section
  section: { paddingHorizontal: 20, paddingVertical: 40 },
  sectionBadge: { backgroundColor: `${PRIMARY_BROWN}15`, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 4, alignSelf: 'center', marginBottom: 8 },
  sectionBadgeText: { color: PRIMARY_BROWN, fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: CHARCOAL, textAlign: 'center', marginBottom: 8 },
  sectionSub: { fontSize: 14, color: MUTED_OLIVE, textAlign: 'center', lineHeight: 22, marginBottom: 28, paddingHorizontal: 8 },
  // Features
  featureGrid: { gap: 12 },
  featureCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#f0ede8' },
  featureIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: `${PRIMARY_BROWN}12`, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  featureTitle: { fontSize: 15, fontWeight: '600', color: CHARCOAL, marginBottom: 4 },
  featureDesc: { fontSize: 13, color: MUTED_OLIVE, lineHeight: 20 },
  // Steps
  stepsGrid: { gap: 12 },
  stepCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#f0ede8', alignItems: 'center' },
  stepNum: { fontSize: 24, fontWeight: '800', color: PRIMARY_GOLD, marginBottom: 8 },
  stepIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: `${PRIMARY_BROWN}12`, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  stepTitle: { fontSize: 15, fontWeight: '600', color: CHARCOAL, marginBottom: 4, textAlign: 'center' },
  stepDesc: { fontSize: 13, color: MUTED_OLIVE, lineHeight: 20, textAlign: 'center' },
  // Stats
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statItem: { width: (width - 56) / 2, alignItems: 'center', marginBottom: 20 },
  statValue: { fontSize: 28, fontWeight: '800', color: PRIMARY_BROWN, marginBottom: 4 },
  statLabel: { fontSize: 12, color: MUTED_OLIVE, textAlign: 'center', maxWidth: 150 },
  // About
  aboutCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#f0ede8' },
  aboutCardTitle: { fontSize: 16, fontWeight: '600', color: CHARCOAL, marginTop: 8, marginBottom: 6 },
  aboutCardDesc: { fontSize: 13, color: MUTED_OLIVE, lineHeight: 20 },
  contactRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  contactText: { fontSize: 13, color: MUTED_OLIVE, flex: 1, lineHeight: 20 },
  // Team
  teamGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  teamCard: { width: (width - 52) / 2, backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#f0ede8', alignItems: 'center' },
  teamAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: `${PRIMARY_GOLD}25`, justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderWidth: 2, borderColor: `${PRIMARY_GOLD}40`, overflow: 'hidden' },
  teamImage: { width: '100%', height: '100%', borderRadius: 28 },
  teamInitials: { fontSize: 16, fontWeight: '700', color: PRIMARY_BROWN },
  teamName: { fontSize: 13, fontWeight: '600', color: CHARCOAL, textAlign: 'center', marginBottom: 2 },
  teamRole: { fontSize: 11, color: PRIMARY_BROWN, fontWeight: '500', textAlign: 'center' },
  // CTA
  ctaSection: { paddingHorizontal: 20, paddingVertical: 48, alignItems: 'center', backgroundColor: CHARCOAL },
  ctaTitle: { fontSize: 22, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 8 },
  ctaSub: { fontSize: 14, color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 22, marginBottom: 16, maxWidth: 320 },
  ctaBadges: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 20 },
  ctaBadge: { borderWidth: 1, borderColor: `${PRIMARY_GOLD}60`, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  ctaBadgeText: { color: '#fff', fontSize: 12 },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 24, marginBottom: 12 },
  ctaBtnText: { color: PRIMARY_BROWN, fontSize: 15, fontWeight: '600' },
  staffBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: PRIMARY_GOLD, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 24 },
  staffBtnText: { color: PRIMARY_GOLD, fontSize: 14, fontWeight: '600' },
  // Footer
  footer: { backgroundColor: '#fff', borderTopWidth: 2, borderTopColor: PRIMARY_GOLD, paddingHorizontal: 20, paddingVertical: 32 },
  footerBrand: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  footerLogoGold: { fontSize: 18, fontWeight: '700', color: PRIMARY_GOLD },
  footerLogoBrown: { fontSize: 18, fontWeight: '700', color: PRIMARY_BROWN },
  footerDesc: { fontSize: 13, color: MUTED_OLIVE, marginBottom: 2 },
  footerSdg: { fontSize: 11, color: MUTED_OLIVE, marginBottom: 20 },
  footerLinks: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  footerCol: { flex: 1 },
  footerColTitle: { fontSize: 13, fontWeight: '600', color: CHARCOAL, marginBottom: 8 },
  footerLink: { fontSize: 12, color: MUTED_OLIVE, marginBottom: 6, lineHeight: 18 },
  footerDivider: { height: 1, backgroundColor: '#e8e8e8', marginBottom: 16 },
  footerCopy: { fontSize: 11, color: MUTED_OLIVE, textAlign: 'center' },
});