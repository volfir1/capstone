import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function About() {
  const stats = [
    { value: '10K+', label: 'Active Users' },
    { value: '50+', label: 'Countries' },
    { value: '99%', label: 'Satisfaction' },
    { value: '24/7', label: 'Support' }
  ];

  const team = [
    { name: 'Sarah Johnson', role: 'CEO & Founder', color: '#6366f1' },
    { name: 'Michael Chen', role: 'Lead Designer', color: '#8b5cf6' },
    { name: 'Emma Davis', role: 'Head of Engineering', color: '#ec4899' },
    { name: 'James Wilson', role: 'Product Manager', color: '#06b6d4' }
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>A</Text>
          </View>
          <Text style={styles.brandName}>Artistry</Text>
        </View>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>About Us</Text>
        <Text style={styles.heroSubtitle}>
          Building the future of creative collaboration
        </Text>
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Mission Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Mission</Text>
        <View style={styles.missionCard}>
          <Text style={styles.missionText}>
            We're on a mission to empower creators and innovators worldwide by providing 
            cutting-edge tools and a vibrant community. Our platform brings together 
            talented individuals to collaborate, share ideas, and bring their visions to life.
          </Text>
        </View>
      </View>

      {/* Story Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Story</Text>
        <View style={styles.storyCard}>
          <Text style={styles.storyText}>
            Founded in 2020, Artistry started with a simple idea: making creativity accessible 
            to everyone. What began as a small project has grown into a global platform used 
            by thousands of creators every day.
          </Text>
          <Text style={styles.storyText}>
            We believe that great ideas can come from anywhere, and we're committed to 
            providing the tools and support needed to turn those ideas into reality.
          </Text>
        </View>
      </View>

      {/* Team Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Meet Our Team</Text>
        <View style={styles.teamGrid}>
          {team.map((member, index) => (
            <View key={index} style={styles.teamCard}>
              <View style={[styles.teamAvatar, { backgroundColor: member.color }]}>
                <Text style={styles.teamInitial}>{member.name.charAt(0)}</Text>
              </View>
              <Text style={styles.teamName}>{member.name}</Text>
              <Text style={styles.teamRole}>{member.role}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Values Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Values</Text>
        <View style={styles.valuesContainer}>
          <View style={styles.valueCard}>
            <View style={styles.valueNumber}>
              <Text style={styles.valueNumberText}>1</Text>
            </View>
            <Text style={styles.valueTitle}>Innovation</Text>
            <Text style={styles.valueDescription}>
              Constantly pushing boundaries and exploring new possibilities
            </Text>
          </View>

          <View style={styles.valueCard}>
            <View style={styles.valueNumber}>
              <Text style={styles.valueNumberText}>2</Text>
            </View>
            <Text style={styles.valueTitle}>Community</Text>
            <Text style={styles.valueDescription}>
              Building strong connections and supporting each other
            </Text>
          </View>

          <View style={styles.valueCard}>
            <View style={styles.valueNumber}>
              <Text style={styles.valueNumberText}>3</Text>
            </View>
            <Text style={styles.valueTitle}>Excellence</Text>
            <Text style={styles.valueDescription}>
              Delivering quality in everything we do
            </Text>
          </View>
        </View>
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <View style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>Join Our Journey</Text>
          <Text style={styles.ctaSubtitle}>
            Be part of something special
          </Text>
          <TouchableOpacity style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2024 Artistry. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 48,
    height: 48,
    backgroundColor: '#6366f1',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  brandName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingVertical: 48,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
  },
  statsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 32,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: (width - 52) / 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
  },
  missionCard: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
    padding: 28,
  },
  missionText: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 26,
  },
  storyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  storyText: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 24,
    marginBottom: 16,
  },
  teamGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  teamCard: {
    width: (width - 52) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  teamAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  teamInitial: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'center',
  },
  teamRole: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
  valuesContainer: {
    gap: 16,
  },
  valueCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  valueNumber: {
    width: 48,
    height: 48,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  valueNumberText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  valueTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  valueDescription: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
  },
  ctaSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  ctaCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  ctaSubtitle: {
    fontSize: 16,
    color: '#cbd5e1',
    marginBottom: 24,
  },
  ctaButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    backgroundColor: '#ffffff',
    paddingVertical: 32,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerText: {
    fontSize: 14,
    color: '#64748b',
  },
});