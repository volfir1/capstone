import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import {Link} from 'expo-router'
const { width } = Dimensions.get('window');

export default function Home() {
  const [activeTab, setActiveTab] = useState('home');

  const features = [
    {
      title: "Lightning Fast",
      description: "Optimized performance for seamless experience"
    },
    {
      title: "Secure & Private",
      description: "Your data is protected with enterprise-grade security"
    },
    {
      title: "Smart Analytics",
      description: "Track your progress with intelligent insights"
    }
  ];

  const collections = [
    { id: 1, title: "Design Inspiration", items: "2.4k", colors: ['#a855f7', '#ec4899'] },
    { id: 2, title: "Tech & Innovation", items: "1.8k", colors: ['#3b82f6', '#06b6d4'] },
    { id: 3, title: "Lifestyle", items: "3.2k", colors: ['#f97316', '#ef4444'] },
    { id: 4, title: "Creative Arts", items: "1.5k", colors: ['#22c55e', '#10b981'] }
  ];
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>A</Text>
          </View>
          <Text style={styles.brandName}>Artistry</Text>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Search</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.signInButton}>
            {/* <Text style={styles.signInButtonText} >Sign In</Text> */}
            <Link href='/auth'>Login</Link>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroCard}>
          <View style={styles.heroCircle1} />
          <View style={styles.heroCircle2} />
          
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Welcome to Your Creative Space</Text>
            <Text style={styles.heroSubtitle}>
              Discover amazing content, connect with creators, and unleash your creativity in a modern, beautiful interface.
            </Text>
            <View style={styles.heroButtons}>
              <TouchableOpacity style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Get Started</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Learn More</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Features Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why Choose Us</Text>
        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={styles.featureBadge}>
                <Text style={styles.featureBadgeText}>{index + 1}</Text>
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Collections Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Collections</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.collectionsGrid}>
          {collections.map((collection) => (
            <View key={collection.id} style={styles.collectionCard}>
              <View style={[styles.collectionImage, { backgroundColor: collection.colors[0] }]}>
                <Text style={styles.collectionNumber}>{collection.id}</Text>
              </View>
              <Text style={styles.collectionTitle}>{collection.title}</Text>
              <Text style={styles.collectionItems}>{collection.items} items</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA Section */}
      <View style={styles.section}>
        <View style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>Ready to Get Started?</Text>
          <Text style={styles.ctaSubtitle}>
            Join thousands of creators and discover endless possibilities
          </Text>
          <TouchableOpacity style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Start Your Journey</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerGrid}>
          <View style={styles.footerColumn}>
            <Text style={styles.footerTitle}>Product</Text>
            <Text style={styles.footerLink}>Features</Text>
            <Text style={styles.footerLink}>Pricing</Text>
            <Text style={styles.footerLink}>Updates</Text>
          </View>
          <View style={styles.footerColumn}>
            <Text style={styles.footerTitle}>Company</Text>
            <Text style={styles.footerLink}>About</Text>
            <Text style={styles.footerLink}>Blog</Text>
            <Text style={styles.footerLink}>Careers</Text>
          </View>
          <View style={styles.footerColumn}>
            <Text style={styles.footerTitle}>Resources</Text>
            <Text style={styles.footerLink}>Help Center</Text>
            <Text style={styles.footerLink}>Community</Text>
            <Text style={styles.footerLink}>Guides</Text>
          </View>
          <View style={styles.footerColumn}>
            <Text style={styles.footerTitle}>Legal</Text>
            <Text style={styles.footerLink}>Privacy</Text>
            <Text style={styles.footerLink}>Terms</Text>
            <Text style={styles.footerLink}>Security</Text>
          </View>
        </View>
        <View style={styles.footerBottom}>
          <Text style={styles.footerCopyright}>© 2024 Artistry. All rights reserved.</Text>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerLeft: {
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerButtonText: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '600',
  },
  signInButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  signInButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  heroCard: {
    backgroundColor: '#6366f1',
    borderRadius: 24,
    padding: 40,
    position: 'relative',
    overflow: 'hidden',
  },
  heroCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 150,
    top: -100,
    right: -100,
  },
  heroCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 100,
    bottom: -50,
    left: -50,
  },
  heroContent: {
    zIndex: 1,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    lineHeight: 44,
  },
  heroSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 32,
    lineHeight: 28,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 24,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  viewAllText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  featuresGrid: {
    gap: 16,
  },
  featureCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  featureBadge: {
    width: 56,
    height: 56,
    backgroundColor: '#6366f1',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureBadgeText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
  },
  collectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  collectionCard: {
    width: (width - 56) / 2,
    marginBottom: 16,
  },
  collectionImage: {
    height: 160,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  collectionNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.3)',
  },
  collectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  collectionItems: {
    fontSize: 13,
    color: '#64748b',
  },
  ctaCard: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  ctaSubtitle: {
    fontSize: 18,
    color: '#cbd5e1',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 28,
  },
  ctaButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  footerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  footerColumn: {
    width: (width - 60) / 2,
    marginBottom: 24,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  footerLink: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  footerBottom: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 24,
    alignItems: 'center',
  },
  footerCopyright: {
    fontSize: 14,
    color: '#64748b',
  },
});