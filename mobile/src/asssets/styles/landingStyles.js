import { StyleSheet, Dimensions } from "react-native";
import {
  PRIMARY_GOLD,
  PRIMARY_BROWN,
  MUTED_OLIVE,
  THEMED_LIGHT_BG,
  CHARCOAL,
} from "../../utils/constants";

const { width } = Dimensions.get("window");

const landingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Header Styles
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEMED_LIGHT_BG,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: PRIMARY_GOLD,
  },
  brandAccent: {
    color: PRIMARY_BROWN,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  attorneySignInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: PRIMARY_GOLD,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  attorneySignInButtonText: {
    color: PRIMARY_GOLD,
    fontSize: 13,
    fontWeight: '600',
  },
  signInButton: {
    backgroundColor: PRIMARY_BROWN,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: PRIMARY_BROWN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  // Hero Section
  heroSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  heroCard: {
    backgroundColor: PRIMARY_BROWN,
    borderRadius: 20,
    padding: 32,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 320,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(139, 69, 19, 0.15)',
  },
  heroContent: {
    zIndex: 1,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    lineHeight: 40,
  },
  heroSubtitle: {
    fontSize: 16,
    color: THEMED_LIGHT_BG,
    marginBottom: 28,
    lineHeight: 24,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  primaryButton: {
    backgroundColor: PRIMARY_GOLD,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: PRIMARY_GOLD,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: CHARCOAL,
    fontSize: 15,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },

  // Section Styles
  section: {
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: CHARCOAL,
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 15,
    color: MUTED_OLIVE,
    marginBottom: 24,
    textAlign: 'center',
  },
  sectionHeader: {
    marginBottom: 20,
  },

  // Features Grid
  featuresGrid: {
    gap: 16,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEMED_LIGHT_BG,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIconContainer: {
    width: 64,
    height: 64,
    backgroundColor: THEMED_LIGHT_BG,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: CHARCOAL,
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: MUTED_OLIVE,
    lineHeight: 22,
  },

  // Services Grid
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: (width - 56) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: THEMED_LIGHT_BG,
    marginBottom: 16,
  },
  serviceIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: PRIMARY_BROWN,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: CHARCOAL,
    marginBottom: 6,
  },
  serviceDescription: {
    fontSize: 13,
    color: MUTED_OLIVE,
    lineHeight: 18,
  },

  // Stats Section
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 32,
    backgroundColor: THEMED_LIGHT_BG,
  },
  statsCard: {
    alignItems: 'center',
  },
  statsNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: PRIMARY_BROWN,
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 13,
    color: MUTED_OLIVE,
    fontWeight: '500',
  },

  // CTA Section
  ctaCard: {
    backgroundColor: THEMED_LIGHT_BG,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: PRIMARY_GOLD,
  },
  ctaIcon: {
    marginBottom: 16,
  },
  ctaTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: CHARCOAL,
    marginBottom: 12,
    textAlign: 'center',
  },
  ctaSubtitle: {
    fontSize: 15,
    color: MUTED_OLIVE,
    marginBottom: 28,
    textAlign: 'center',
    lineHeight: 24,
  },
  ctaButton: {
    backgroundColor: PRIMARY_BROWN,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: PRIMARY_BROWN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Footer
  footer: {
    backgroundColor: CHARCOAL,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  footerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
  },
  footerBrandText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: PRIMARY_GOLD,
  },
  footerBrandAccent: {
    color: '#FFFFFF',
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
    color: PRIMARY_GOLD,
    marginBottom: 12,
  },
  footerLink: {
    fontSize: 14,
    color: THEMED_LIGHT_BG,
    marginBottom: 8,
  },
  footerBottom: {
    borderTopWidth: 1,
    borderTopColor: MUTED_OLIVE,
    paddingTop: 24,
    alignItems: 'center',
  },
  footerCopyright: {
    fontSize: 13,
    color: THEMED_LIGHT_BG,
    marginBottom: 4,
  },
  footerDisclaimer: {
    fontSize: 12,
    color: MUTED_OLIVE,
  },
});

export default landingStyles;