import { StyleSheet, Dimensions } from "react-native";
import {
  PRIMARY_GOLD,
  PRIMARY_BROWN,
  MUTED_OLIVE,
  THEMED_LIGHT_BG,
  CHARCOAL,
  ACCENT_TAN,
} from "../../utils/constants";

const { width } = Dimensions.get("window");
const isSmallDevice = width < 375;

const landingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Header - Compact and clean
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: THEMED_LIGHT_BG,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    fontSize: isSmallDevice ? 20 : 24,
    fontWeight: '700',
    color: PRIMARY_GOLD,
  },
  logoAccent: {
    color: PRIMARY_BROWN,
  },
  headerButton: {
    backgroundColor: PRIMARY_BROWN,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: PRIMARY_BROWN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  headerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Hero Section - Clean and focused
  hero: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
  },
  heroTitle: {
    fontSize: isSmallDevice ? 28 : 34,
    fontWeight: '700',
    color: CHARCOAL,
    marginBottom: 12,
    lineHeight: isSmallDevice ? 34 : 42,
  },
  heroSubtitle: {
    fontSize: 16,
    color: MUTED_OLIVE,
    marginBottom: 28,
    lineHeight: 24,
  },
  ctaButton: {
    backgroundColor: PRIMARY_BROWN,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    gap: 8,
    shadowColor: PRIMARY_BROWN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: PRIMARY_GOLD,
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButtonText: {
    color: PRIMARY_GOLD,
    fontSize: 16,
    fontWeight: '600',
  },

  // Stats Section - More prominent
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: THEMED_LIGHT_BG,
  },
  statCard: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: isSmallDevice ? 28 : 34,
    fontWeight: '700',
    color: PRIMARY_BROWN,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: MUTED_OLIVE,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Section Styles
  section: {
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  sectionTitle: {
    fontSize: isSmallDevice ? 24 : 28,
    fontWeight: '700',
    color: CHARCOAL,
    marginBottom: 24,
    textAlign: 'center',
  },

  // Features - Single column for better mobile readability
  featuresContainer: {
    gap: 16,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: THEMED_LIGHT_BG,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: THEMED_LIGHT_BG,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: CHARCOAL,
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 14,
    color: MUTED_OLIVE,
    lineHeight: 21,
  },

  // Services - Optimized grid
  servicesSection: {
    backgroundColor: THEMED_LIGHT_BG,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  serviceCard: {
    width: (width - 52) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: PRIMARY_BROWN,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: CHARCOAL,
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 12,
    color: MUTED_OLIVE,
    lineHeight: 18,
  },

  // CTA Section - More prominent
  ctaSection: {
    backgroundColor: PRIMARY_BROWN,
    paddingHorizontal: 20,
    paddingVertical: 48,
    alignItems: 'center',
  },
  ctaIcon: {
    marginBottom: 16,
  },
  ctaTitle: {
    fontSize: isSmallDevice ? 24 : 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  ctaDescription: {
    fontSize: 16,
    color: THEMED_LIGHT_BG,
    marginBottom: 28,
    textAlign: 'center',
    lineHeight: 24,
  },
  ctaButtonLarge: {
    backgroundColor: PRIMARY_GOLD,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaButtonLargeText: {
    color: CHARCOAL,
    fontSize: 16,
    fontWeight: '700',
  },

  // Footer - Compact and organized
  footer: {
    backgroundColor: CHARCOAL,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  footerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 28,
  },
  footerLogo: {
    fontSize: 24,
    fontWeight: '700',
    color: PRIMARY_GOLD,
  },
  footerLogoAccent: {
    color: '#FFFFFF',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    flexWrap: 'wrap',
  },
  footerColumn: {
    width: (width - 60) / 3,
    marginBottom: 20,
  },
  footerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PRIMARY_GOLD,
    marginBottom: 12,
  },
  footerLink: {
    fontSize: 13,
    color: THEMED_LIGHT_BG,
    marginBottom: 8,
  },
  footerCopyright: {
    fontSize: 12,
    color: THEMED_LIGHT_BG,
    textAlign: 'center',
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: MUTED_OLIVE,
    opacity: 0.8,
  },

  // Floating AI Chatbot Button
  floatingChatButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: PRIMARY_GOLD,
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 1000,
  },
  floatingChatText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default landingStyles;