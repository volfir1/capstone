import { StyleSheet, Dimensions } from "react-native";

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
    fontSize: 40,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "#ffffff",
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
    color: "#E26EE5",
    textAlign: "right",
    marginBottom: 32,
  },
  brandAccent: {
    color: "#7E30E1",
  },
  titleContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748b",
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1e293b",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1e293b",
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#7E30E1",
    fontWeight: "500",
  },
  loginButton: {
    flexDirection: "row",
    backgroundColor: "#7E30E1",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
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
    backgroundColor: "#e2e8f0",
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: "#64748b",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    paddingVertical: 16,
    borderRadius: 12,
  },
  googleButtonText: {
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "500",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  signupText: {
    fontSize: 14,
    color: "#64748b",
  },
  signupLink: {
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

export default loginStyles;