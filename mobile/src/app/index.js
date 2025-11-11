import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import styles from '../asssets/styles/landingStyles';

export default function LandingPage() {
  const features = [
    {
      icon: "shield-checkmark-outline",
      title: "Expert Legal Advice",
      description: "Get professional legal consultation from experienced attorneys"
    },
    {
      icon: "document-text-outline",
      title: "Document Preparation",
      description: "Comprehensive legal document drafting and review services"
    },
    {
      icon: "people-outline",
      title: "Client-Focused",
      description: "Personalized legal solutions tailored to your needs"
    }
  ];

  const services = [
    { id: 1, title: "Family Law", icon: "home-outline", description: "Divorce, custody, and family matters" },
    { id: 2, title: "Business Law", icon: "briefcase-outline", description: "Corporate and commercial legal services" },
    { id: 3, title: "Real Estate", icon: "business-outline", description: "Property transactions and disputes" },
    { id: 4, title: "Criminal Defense", icon: "shield-outline", description: "Professional criminal defense representation" }
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="library-outline" size={32} color="#C4AB7D" />
          <Text style={styles.brandName}>
            Just<Text style={styles.brandAccent}>Reach</Text>
          </Text>
        </View>
        
        <View style={styles.headerRight}>
          <Link href="/auth" asChild>
            <TouchableOpacity style={styles.signInButton}>
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroCard}>
          <View style={styles.heroOverlay} />
          
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Professional Legal Services at Your Fingertips</Text>
            <Text style={styles.heroSubtitle}>
              Connect with experienced attorneys and get the legal assistance you need, whenever you need it.
            </Text>
            <View style={styles.heroButtons}>
              <Link href="/auth/signup" asChild>
                <TouchableOpacity style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Get Started</Text>
                </TouchableOpacity>
              </Link>
              <TouchableOpacity style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Learn More</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Features Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why Choose JustReach</Text>
        <Text style={styles.sectionSubtitle}>
          Trusted legal expertise delivered with excellence
        </Text>
        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <Ionicons name={feature.icon} size={32} color="#C4AB7D" />
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Services Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Our Legal Services</Text>
        </View>
        <View style={styles.servicesGrid}>
          {services.map((service) => (
            <View key={service.id} style={styles.serviceCard}>
              <View style={styles.serviceIconContainer}>
                <Ionicons name={service.icon} size={28} color="#FFFFFF" />
              </View>
              <Text style={styles.serviceTitle}>{service.title}</Text>
              <Text style={styles.serviceDescription}>{service.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <View style={styles.statsCard}>
          <Text style={styles.statsNumber}>500+</Text>
          <Text style={styles.statsLabel}>Cases Won</Text>
        </View>
        <View style={styles.statsCard}>
          <Text style={styles.statsNumber}>1000+</Text>
          <Text style={styles.statsLabel}>Happy Clients</Text>
        </View>
        <View style={styles.statsCard}>
          <Text style={styles.statsNumber}>25+</Text>
          <Text style={styles.statsLabel}>Expert Lawyers</Text>
        </View>
      </View>

      {/* CTA Section */}
      <View style={styles.section}>
        <View style={styles.ctaCard}>
          <Ionicons name="hammer-outline" size={48} color="#C4AB7D" style={styles.ctaIcon} />
          <Text style={styles.ctaTitle}>Ready to Get Legal Help?</Text>
          <Text style={styles.ctaSubtitle}>
            Join hundreds of satisfied clients and get the legal assistance you deserve
          </Text>
          <Link href="/auth/signup" asChild>
            <TouchableOpacity style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Start Your Case Today</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerBrand}>
          <Ionicons name="library-outline" size={28} color="#C4AB7D" />
          <Text style={styles.footerBrandText}>
            Just<Text style={styles.footerBrandAccent}>Reach</Text>
          </Text>
        </View>
        
        <View style={styles.footerGrid}>
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
            <Text style={styles.footerLink}>Our Team</Text>
            <Text style={styles.footerLink}>Careers</Text>
            <Text style={styles.footerLink}>Contact</Text>
          </View>
          <View style={styles.footerColumn}>
            <Text style={styles.footerTitle}>Resources</Text>
            <Text style={styles.footerLink}>Help Center</Text>
            <Text style={styles.footerLink}>Legal Blog</Text>
            <Text style={styles.footerLink}>FAQs</Text>
            <Text style={styles.footerLink}>Case Studies</Text>
          </View>
          <View style={styles.footerColumn}>
            <Text style={styles.footerTitle}>Legal</Text>
            <Text style={styles.footerLink}>Privacy Policy</Text>
            <Text style={styles.footerLink}>Terms of Service</Text>
            <Text style={styles.footerLink}>Cookie Policy</Text>
            <Text style={styles.footerLink}>Disclaimer</Text>
          </View>
        </View>
        
        <View style={styles.footerBottom}>
          <Text style={styles.footerCopyright}>© 2024 JustReach. All rights reserved.</Text>
          <Text style={styles.footerDisclaimer}>
            Professional Legal Services
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}