import { StyleSheet, Dimensions } from "react-native";
import {
  PRIMARY_GOLD,
  PRIMARY_BROWN,
  MUTED_OLIVE,
  THEMED_LIGHT_BG,
  CHARCOAL,
} from "utils/constants";

const { height } = Dimensions.get("window");

const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    height: height * 0.35,
    position: "relative",
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: PRIMARY_BROWN,
    justifyContent: "center",
    alignItems: "center",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imagePlaceholderText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  heroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(139, 69, 19, 0.85)", // PRIMARY_BROWN with opacity
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  heroTitle: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: THEMED_LIGHT_BG,
    lineHeight: 24,
  },
  formSection: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 40,
  },
  brandText: {
    fontSize: 24,
    fontWeight: "600",
    color: PRIMARY_GOLD,
    textAlign: "right",
    marginBottom: 32,
  },
  brandAccent: {
    color: PRIMARY_BROWN,
  },
  titleContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "600",
    color: CHARCOAL,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: MUTED_OLIVE,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: CHARCOAL,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#D4C5A9",
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "#ffffff",
    height: 50, // Added fixed height
  },
  inputWrapperFocused: {
    borderColor: PRIMARY_GOLD,
  },
  icon: {
    marginRight: 12,
    color: MUTED_OLIVE,
  },
    input: {
    flex: 1, // This makes input take available space
    paddingVertical: 12,
    fontSize: 14,
    color: CHARCOAL,
    height: "100%", // Added to ensure full height
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: PRIMARY_BROWN,
    fontWeight: "500",
  },
  loginButton: {
    flexDirection: "row",
    backgroundColor: PRIMARY_BROWN,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PRIMARY_BROWN,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#D4C5A9",
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: MUTED_OLIVE,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#D4C5A9",
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#ffffff",
  },
  googleButtonText: {
    fontSize: 16,
    color: CHARCOAL,
    fontWeight: "500",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  signupText: {
    fontSize: 14,
    color: MUTED_OLIVE,
  },
  signupLink: {
    fontSize: 14,
    color: PRIMARY_BROWN,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 4,
  },
});

export default loginStyles;