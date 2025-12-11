import { StyleSheet } from "react-native";
import {
  PRIMARY_GOLD,
  PRIMARY_BROWN,
  MUTED_OLIVE,
  THEMED_LIGHT_BG,
  CHARCOAL,
  ACCENT_TAN,
} from "@utils/constants";

const attorneySignupStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEMED_LIGHT_BG,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  formSection: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 24,
    shadowColor: CHARCOAL,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },

  // Back Button
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 15,
    color: PRIMARY_BROWN,
    marginLeft: 8,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  // Header Section
  headerContainer: {
    marginBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 56,
    height: 56,
    backgroundColor: THEMED_LIGHT_BG,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: CHARCOAL,
    letterSpacing: -0.5,
    flex: 1,
  },
  subtitle: {
    fontSize: 15,
    color: MUTED_OLIVE,
    lineHeight: 22,
    fontWeight: "400",
  },

  // Section Titles
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: CHARCOAL,
    marginTop: 24,
    marginBottom: 16,
    letterSpacing: 0.2,
  },

  // Input Fields
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: CHARCOAL,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  requiredStar: {
    color: "#EF4444",
  },
  input: {
    backgroundColor: THEMED_LIGHT_BG,
    borderWidth: 1.5,
    borderColor: "transparent",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: CHARCOAL,
    fontWeight: "400",
  },
  inputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: "500",
  },
  textArea: {
    height: 110,
    textAlignVertical: "top",
    paddingTop: 14,
  },

  // Date Button
  dateButton: {
    backgroundColor: THEMED_LIGHT_BG,
    borderWidth: 1.5,
    borderColor: "transparent",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateButtonText: {
    fontSize: 15,
    color: CHARCOAL,
    fontWeight: "400",
  },
  dateButtonPlaceholder: {
    color: MUTED_OLIVE,
    opacity: 0.6,
  },

  // Picker
  pickerContainer: {
    backgroundColor: THEMED_LIGHT_BG,
    borderWidth: 1.5,
    borderColor: "transparent",
    borderRadius: 12,
    overflow: "hidden",
  },
  picker: {
    height: 50,
    color: CHARCOAL,
  },

  // Checkbox
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: PRIMARY_GOLD,
    borderRadius: 6,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: PRIMARY_GOLD,
  },
  checkboxLabel: {
    fontSize: 14,
    color: CHARCOAL,
    flex: 1,
    lineHeight: 20,
  },

  // Multi-Select
  multiSelectContainer: {
    backgroundColor: THEMED_LIGHT_BG,
    borderWidth: 1.5,
    borderColor: "transparent",
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
  },
  multiSelectItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },

  // Address Section
  addressSection: {
    backgroundColor: THEMED_LIGHT_BG,
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },

  // Submit Button
  submitButton: {
    backgroundColor: PRIMARY_GOLD,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 28,
    marginBottom: 16,
    shadowColor: PRIMARY_GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: ACCENT_TAN,
    opacity: 0.6,
  },
  submitButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // Login Link
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  loginText: {
    fontSize: 14,
    color: MUTED_OLIVE,
    fontWeight: "400",
  },
  loginLink: {
    fontSize: 14,
    color: PRIMARY_BROWN,
    fontWeight: "600",
  },

  // Education Item
  educationItem: {
    backgroundColor: THEMED_LIGHT_BG,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  educationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  educationInfo: {
    flex: 1,
  },
  educationDegree: {
    fontSize: 15,
    fontWeight: "600",
    color: CHARCOAL,
    marginBottom: 4,
  },
  educationSchool: {
    fontSize: 13,
    color: MUTED_OLIVE,
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
  },

  // Add Button
  addButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: PRIMARY_GOLD,
    borderStyle: "dashed",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  addButtonText: {
    color: PRIMARY_GOLD,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
    letterSpacing: 0.3,
  },

  // Additional styles for form fields
  inputWrapper: {
    position: "relative",
  },
  inputWithIcon: {
    paddingRight: 48,
  },
  eyeIcon: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    padding: 8,
  },
  helperText: {
    fontSize: 12,
    color: MUTED_OLIVE,
    marginTop: 6,
    marginLeft: 4,
    fontStyle: "italic",
  },
  sectionDescription: {
    fontSize: 13,
    color: MUTED_OLIVE,
    marginBottom: 12,
    marginTop: -8,
    lineHeight: 18,
  },
  consultationModeContainer: {
    backgroundColor: THEMED_LIGHT_BG,
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
  },
});

export default attorneySignupStyles;