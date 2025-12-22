import React, { memo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import styles from '@assets/styles/landingStyles';

// Memoized components for better performance
const FeatureCard = memo(({ icon, title, description }) => (
  <View style={styles.featureCard}>
    <View style={styles.featureIconContainer}>
      <Ionicons name={icon} size={32} color="#C4AB7D" />
    </View>
    <Text style={styles.featureTitle}>{title}</Text>
    <Text style={styles.featureDescription}>{description}</Text>
  </View>
));

const ServiceCard = memo(({ icon, title, description }) => (
  <View style={styles.serviceCard}>
    <View style={styles.serviceIconContainer}>
      <Ionicons name={icon} size={24} color="#FFFFFF" />
    </View>
    <Text style={styles.serviceTitle}>{title}</Text>
    <Text style={styles.serviceDescription}>{description}</Text>
  </View>
));

const StatCard = memo(({ number, label }) => (
  <View style={styles.statCard}>
    <Text style={styles.statNumber}>{number}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
));

export default function LandingPage() {
  const features = [
    {
      icon: "shield-checkmark-outline",
      title: "Expert Legal Advice",
      description: "Professional consultation from experienced attorneys"
    },
    {
      icon: "document-text-outline",
      title: "Document Preparation",
      description: "Comprehensive legal document drafting services"
    },
    {
      icon: "people-outline",
      title: "Client-Focused",
      description: "Personalized legal solutions for your needs"
    }
  ];

  const services = [
    { id: 1, title: "Family Law", icon: "home-outline", description: "Divorce, custody & family matters" },
    { id: 2, title: "Business Law", icon: "briefcase-outline", description: "Corporate & commercial services" },
    { id: 3, title: "Real Estate", icon: "business-outline", description: "Property transactions & disputes" },
    { id: 4, title: "Criminal Defense", icon: "shield-outline", description: "Professional defense representation" }
  ];

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
    >
      {/* Compact Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Ionicons name="library-outline" size={24} color="#C4AB7D" />
            <Text style={styles.logo}>
              Just<Text style={styles.logoAccent}>Reach</Text>
            </Text>
          </View>
          <Link href="/auth" asChild>
            <TouchableOpacity style={styles.headerButton}>
              <Text style={styles.headerButtonText}>Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      {/* Hero Section */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Professional Legal Services</Text>
        <Text style={styles.heroSubtitle}>
          Connect with experienced attorneys and get the legal help you need
        </Text>
        <Link href="/auth/signup" asChild>
          <TouchableOpacity style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </Link>
        <Link href="/auth/attorneyLogin" asChild>
          <TouchableOpacity style={styles.secondaryButton}>
            <Ionicons name="briefcase-outline" size={18} color="#C4AB7D" />
            <Text style={styles.secondaryButtonText}>Attorney Login</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <StatCard number="500+" label="Cases Won" />
        <StatCard number="1000+" label="Happy Clients" />
        <StatCard number="25+" label="Expert Lawyers" />
      </View>

      {/* Features Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why Choose Us</Text>
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </View>
      </View>

      {/* Services Section */}
      <View style={[styles.section, styles.servicesSection]}>
        <Text style={styles.sectionTitle}>Our Services</Text>
        <View style={styles.servicesGrid}>
          {services.map((service) => (
            <ServiceCard key={service.id} {...service} />
          ))}
        </View>
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <Ionicons name="hammer-outline" size={48} color="#C4AB7D" style={styles.ctaIcon} />
        <Text style={styles.ctaTitle}>Ready to Get Legal Help?</Text>
        <Text style={styles.ctaDescription}>
          Join hundreds of satisfied clients today
        </Text>
        <Link href="/auth/signup" asChild>
          <TouchableOpacity style={styles.ctaButtonLarge}>
            <Text style={styles.ctaButtonLargeText}>Start Your Case</Text>
            <Ionicons name="arrow-forward" size={20} color="#2C2C2C" />
          </TouchableOpacity>
        </Link>
      </View>

      {/* Compact Footer */}
      <View style={styles.footer}>
        <View style={styles.footerHeader}>
          <Ionicons name="library-outline" size={24} color="#C4AB7D" />
          <Text style={styles.footerLogo}>
            Just<Text style={styles.footerLogoAccent}>Reach</Text>
          </Text>
        </View>
        
        <View style={styles.footerLinks}>
          <View style={styles.footerColumn}>
            <Text style={styles.footerTitle}>Services</Text>
            <Text style={styles.footerLink}>Family Law</Text>
            <Text style={styles.footerLink}>Business Law</Text>
            <Text style={styles.footerLink}>Real Estate</Text>
            <Text style={styles.footerLink}>Criminal Defense</Text>
          </View>
          <View style={styles.footerColumn}>
            <Text style={styles.footerTitle}>Company</Text>
            <Text style={styles.footerLink}>About Us</Text>
            <Text style={styles.footerLink}>Contact</Text>
            <Text style={styles.footerLink}>Careers</Text>
          </View>
          <View style={styles.footerColumn}>
            <Text style={styles.footerTitle}>Legal</Text>
            <Text style={styles.footerLink}>Privacy</Text>
            <Text style={styles.footerLink}>Terms</Text>
            <Text style={styles.footerLink}>Disclaimer</Text>
          </View>
        </View>
        
        <Text style={styles.footerCopyright}>© 2024 JustReach. All rights reserved.</Text>
      </View>

      {/* Floating AI Chatbot Button */}
      <TouchableOpacity 
        style={styles.floatingChatButton}
        onPress={() => router.push('/ai-chatbot')}
        activeOpacity={0.8}
      >
        <Ionicons name="chatbubble-ellipses" size={28} color="#FFFFFF" />
        <Text style={styles.floatingChatText}>Ask AI</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}