import { StyleSheet, Dimensions } from "react-native";
import {
  PRIMARY_GOLD,
  PRIMARY_BROWN,
  MUTED_OLIVE,
  THEMED_LIGHT_BG,
  CHARCOAL,
  ACCENT_TAN,
} from "utils/constants";

const { height } = Dimensions.get("window");

const signupStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    height: height * 0.3,
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
    fontSize: 36,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 15,
    color: THEMED_LIGHT_BG,
    lineHeight: 24,
  },
  formSection: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  brandText: {
    fontSize: 20,
    fontWeight: "600",
    color: PRIMARY_GOLD,
    textAlign: "right",
    marginBottom: 24,
  },
  brandAccent: {
    color: PRIMARY_BROWN,
  },
  titleContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: CHARCOAL,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: MUTED_OLIVE,
  },
  rowInputs: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
    marginBottom: 0,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: CHARCOAL,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: ACCENT_TAN,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "#ffffff",
  },
  inputWrapperFocused: {
    borderColor: PRIMARY_GOLD,
  },
  icon: {
    marginRight: 8,
    color: MUTED_OLIVE,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: CHARCOAL,
  },
  signupButton: {
    flexDirection: "row",
    backgroundColor: PRIMARY_BROWN,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
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
  signupButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: ACCENT_TAN,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    color: MUTED_OLIVE,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: ACCENT_TAN,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#ffffff",
  },
  googleButtonText: {
    fontSize: 15,
    color: CHARCOAL,
    fontWeight: "500",
  },
  signinContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  signinText: {
    fontSize: 14,
    color: MUTED_OLIVE,
  },
  loginLink: {
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

export default signupStyles;