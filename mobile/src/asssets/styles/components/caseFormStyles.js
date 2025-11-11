// components/SubmitCaseFormStyles.js
import { StyleSheet } from 'react-native';
import {
  PRIMARY_GOLD,
  PRIMARY_BROWN,
  MUTED_OLIVE,
  THEMED_LIGHT_BG,
  CHARCOAL,
  ACCENT_TAN
} from 'utils/constants';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: CHARCOAL,
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 24,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: CHARCOAL,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0DDD5',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: CHARCOAL,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  textAreaLarge: {
    height: 160,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  charCount: {
    fontSize: 12,
    color: MUTED_OLIVE,
    marginTop: 6,
    textAlign: 'right',
  },
  caseTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  caseTypeCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0DDD5',
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  caseTypeCardSelected: {
    borderColor: PRIMARY_BROWN,
    backgroundColor: '#FFF9F0',
  },
  caseTypeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: MUTED_OLIVE,
    textAlign: 'center',
  },
  caseTypeLabelSelected: {
    color: PRIMARY_BROWN,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF9F0',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderLeftWidth: 3,
    borderLeftColor: PRIMARY_GOLD,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: MUTED_OLIVE,
    lineHeight: 20,
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0DDD5',
  },
  submitButton: {
    backgroundColor: PRIMARY_BROWN,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: PRIMARY_BROWN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default styles