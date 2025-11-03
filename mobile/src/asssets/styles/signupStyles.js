import { StyleSheet, Dimensions } from "react-native";

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
    backgroundColor: "#7E30E1",
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
    backgroundColor: "rgba(126, 48, 225, 0.8)",
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
    color: "#ffffff",
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
    color: "#E26EE5",
    textAlign: "right",
    marginBottom: 24,
  },
  brandAccent: {
    color: "#7E30E1",
  },
  titleContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
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
    color: "#1e293b",
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "#ffffff",
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1e293b",
  },
  signupButton: {
    flexDirection: "row",
    backgroundColor: "#7E30E1",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
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
    backgroundColor: "#e2e8f0",
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    color: "#64748b",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    paddingVertical: 14,
    borderRadius: 12,
  },
  googleButtonText: {
    fontSize: 15,
    color: "#1e293b",
    fontWeight: "500",
  },
  signinContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  signinText: {
    fontSize: 14,
    color: "#64748b",
  },
  loginLink: {
    fontSize: 14,
    color: "#7E30E1",
    fontWeight: "600",
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 4,
  },
});

export default signupStyles;