import React, { memo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ImageBackground } from 'react-native';
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

const StepCard = memo(({ icon, title, description, stepNumber }) => (
  <View style={styles.stepCard}>
    <View style={styles.stepBadge}>
      <Text style={styles.stepNumber}>Step {stepNumber}</Text>
    </View>
    <View style={styles.stepIconContainer}>
      <Ionicons name={icon} size={28} color="#C4AB7D" />
    </View>
    <Text style={styles.stepTitle}>{title}</Text>
    <Text style={styles.stepDescription}>{description}</Text>
  </View>
));

const ImpactItem = memo(({ title, description }) => (
  <View style={styles.impactItem}>
    <View style={styles.impactCheckIcon}>
      <Ionicons name="checkmark" size={16} color="#5D4E37" />
    </View>
    <View style={styles.impactContent}>
      <Text style={styles.impactTitle}>{title}</Text>
      <Text style={styles.impactDescription}>{description}</Text>
    </View>
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
      icon: "language-outline",
      title: "Multilingual & Accessible",
      description: "Access legal forms and guidance in English, Filipino, and major regional languages"
    },
    {
      icon: "people-outline",
      title: "Connect with PAO Lawyers",
      description: "Schedule remote consultations with Public Attorney's Office volunteer lawyers"
    },
    {
      icon: "bulb-outline",
      title: "AI-Powered Legal Guidance",
      description: "Our intelligent system suggests applicable laws and assesses case severity"
    },
    {
      icon: "document-text-outline",
      title: "Secure Case Tracking",
      description: "Monitor your case status in real-time through our secure platform"
    },
    {
      icon: "folder-outline",
      title: "Digital Document Submission",
      description: "Safely digitize and submit legal documents with certified e-submission"
    },
    {
      icon: "wifi-outline",
      title: "Offline-Capable Platform",
      description: "Access core features including legal forms and case tracking even without stable internet"
    }
  ];

  const steps = [
    {
      icon: "document-text-outline",
      title: "File Your Report",
      description: "Start by reporting your legal concern through our integrated barangay-level blotter system"
    },
    {
      icon: "people-outline",
      title: "Connect & Consult",
      description: "Get matched with a verified PAO volunteer lawyer based on your case type"
    },
    {
      icon: "shield-checkmark-outline",
      title: "Track Progress",
      description: "Monitor your case through our secure platform with real-time updates"
    },
    {
      icon: "hammer-outline",
      title: "Receive Resolution",
      description: "Access AI-powered guidance while your lawyer works toward resolving your case"
    }
  ];

  const impactItems = [
    {
      title: "Eliminates Geographic Barriers",
      description: "No need to travel to urban centers for legal consultations"
    },
    {
      title: "Reduces Legal Costs",
      description: "Free consultations and digital document processing"
    },
    {
      title: "Increases Legal Awareness",
      description: "Educational resources in multiple languages"
    },
    {
      title: "Strengthens Local Governance",
      description: "Barangay-level integration for transparent justice"
    }
  ];

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Ionicons name="scale-outline" size={24} color="#C4AB7D" />
            <Text style={styles.logo}>
              Just<Text style={styles.logoAccent}>Reach</Text>
            </Text>
          </View>
          <View style={{ width: 24 }} />
        </View>
      </View>

      {/* Hero Section with Background Image */}
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1920&q=80' }}
        style={styles.heroBackground}
        resizeMode="cover"
      >
        <View style={styles.heroOverlay}>
          <View style={styles.hero}>
            <View style={styles.sdgBadge}>
              <Text style={styles.sdgBadgeText}>Supporting SDG 16: Peace, Justice & Strong Institutions</Text>
            </View>
            
            <Text style={styles.heroTitle}>
              Bridging the Justice Gap for{' '}
              <Text style={styles.heroTitleAccent}>Rural Filipinos</Text>
            </Text>
            
            <Text style={styles.heroSubtitle}>
              JUSTREACH brings legal services directly to underserved communities across the Philippines. 
              Access multilingual legal guidance, connect with PAO lawyers, and track your case progress—all 
              from your mobile device, even with limited internet connectivity.
            </Text>
            
            <View style={styles.heroButtons}>
              <Link href="/appointment" asChild>
                <TouchableOpacity style={styles.ctaButton}>
                  <Text style={styles.ctaButtonText}>Get Legal Assistance</Text>
                </TouchableOpacity>
              </Link>
            </View>

            {/* Stats Row */}
            <View style={styles.heroStats}>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatNumber}>50K+</Text>
                <Text style={styles.heroStatLabel}>Users Served</Text>
              </View>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatNumber}>24/7</Text>
                <Text style={styles.heroStatLabel}>Platform Access</Text>
              </View>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatNumber}>3+</Text>
                <Text style={styles.heroStatLabel}>Languages</Text>
              </View>
            </View>
          </View>
        </View>
      </ImageBackground>

      {/* Features Section */}
      <View style={styles.section}>
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>Platform Features</Text>
        </View>
        <Text style={styles.sectionTitle}>Comprehensive Legal Services Designed for Filipino Communities</Text>
        <Text style={styles.sectionDescription}>
          JUSTREACH combines technology and legal expertise to overcome traditional barriers to 
          justice—cost, distance, language, and complexity.
        </Text>
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </View>
      </View>

      {/* How It Works Section */}
      <View style={[styles.section, styles.howItWorksSection]}>
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>Simple Process</Text>
        </View>
        <Text style={styles.sectionTitle}>Get Justice in 4 Simple Steps</Text>
        <Text style={styles.sectionDescription}>
          We've streamlined the legal assistance process to make it accessible, 
          transparent, and efficient for everyone.
        </Text>
        <View style={styles.stepsContainer}>
          {steps.map((step, index) => (
            <StepCard key={index} {...step} stepNumber={index + 1} />
          ))}
        </View>
      </View>

      {/* Impact Section */}
      <View style={styles.section}>
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>Our Impact</Text>
        </View>
        <Text style={styles.sectionTitle}>Empowering Communities Through Technology</Text>
        <Text style={styles.sectionDescription}>
          JUSTREACH addresses the critical justice gap in rural Philippines by decentralizing 
          legal services through mobile and web platforms.
        </Text>
        <View style={styles.impactList}>
          {impactItems.map((item, index) => (
            <ImpactItem key={index} {...item} />
          ))}
        </View>
        
        {/* Impact Stats */}
        <View style={styles.impactStats}>
          <View style={styles.impactStatCard}>
            <Text style={styles.impactStatNumber}>63%</Text>
            <Text style={styles.impactStatLabel}>Of PDLs lack timely trials—we're changing that</Text>
          </View>
          <View style={styles.impactStatCard}>
            <Text style={styles.impactStatNumber}>85%</Text>
            <Text style={styles.impactStatLabel}>Reduction in travel costs for rural clients</Text>
          </View>
        </View>
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <View style={styles.ctaIconContainer}>
          <Ionicons name="hammer-outline" size={48} color="#C4AB7D" />
        </View>
        <Text style={styles.ctaTitle}>Ready to Access Justice?</Text>
        <Text style={styles.ctaDescription}>
          Join thousands of Filipinos who have accessed legal services through JUSTREACH
        </Text>
        <Link href="/appointment" asChild>
          <TouchableOpacity style={styles.ctaButtonLarge}>
            <Text style={styles.ctaButtonLargeText}>Book Appointment</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </Link>
        <Link href="/auth" asChild>
          <TouchableOpacity style={styles.ctaButtonSecondary}>
            <Ionicons name="log-in-outline" size={18} color="#C4AB7D" />
            <Text style={styles.ctaButtonSecondaryText}>Staff Login</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerHeader}>
          <Ionicons name="scale-outline" size={24} color="#C4AB7D" />
          <Text style={styles.footerLogo}>
            Just<Text style={styles.footerLogoAccent}>Reach</Text>
          </Text>
        </View>
        
        <Text style={styles.footerDescription}>
          Accessible Legal Services Network for Rural Philippines
        </Text>
        
        <View style={styles.footerLinks}>
          <View style={styles.footerColumn}>
            <Text style={styles.footerTitle}>Quick Links</Text>
            <TouchableOpacity onPress={() => router.push('/about')}>
              <Text style={styles.footerLink}>About Us</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/features')}>
              <Text style={styles.footerLink}>Features</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/how')}>
              <Text style={styles.footerLink}>How It Works</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.footerColumn}>
            <Text style={styles.footerTitle}>Legal</Text>
            <TouchableOpacity onPress={() => router.push('/privacy')}>
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/terms')}>
              <Text style={styles.footerLink}>Terms of Service</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={styles.footerCopyright}>© 2026 JustReach. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
}