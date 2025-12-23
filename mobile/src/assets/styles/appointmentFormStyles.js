import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const PRIMARY_GOLD = '#C4AB7D';
const PRIMARY_BROWN = '#7D5A3B';
const MUTED_OLIVE = '#9BA17B';
const CHARCOAL = '#2C2C2C';
const THEMED_LIGHT_BG = '#FAF8F3';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEMED_LIGHT_BG,
  },
  
  header: {
    backgroundColor: PRIMARY_BROWN,
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  
  backButton: {
    padding: 8,
  },
  
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  
  clearButton: {
    padding: 8,
  },
  
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: 'white',
  },
  
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  stepCircleActive: {
    backgroundColor: PRIMARY_BROWN,
  },
  
  stepCircleCompleted: {
    backgroundColor: MUTED_OLIVE,
  },
  
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  
  stepLineCompleted: {
    backgroundColor: MUTED_OLIVE,
  },
  
  stepLabelsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingBottom: 12,
    backgroundColor: 'white',
  },
  
  stepLabel: {
    flex: 1,
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  
  stepLabelActive: {
    color: PRIMARY_BROWN,
    fontWeight: '600',
  },
  
  scrollView: {
    flex: 1,
  },
  
  formSection: {
    padding: 16,
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: CHARCOAL,
    marginBottom: 16,
  },
  
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PRIMARY_BROWN,
    marginTop: 8,
    marginBottom: 12,
  },
  
  inputGroup: {
    marginBottom: 16,
  },
  
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: CHARCOAL,
    marginBottom: 6,
  },
  
  required: {
    color: '#E74C3C',
  },
  
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: CHARCOAL,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  inputText: {
    fontSize: 14,
    color: CHARCOAL,
  },
  
  inputError: {
    borderColor: '#E74C3C',
  },
  
  inputReadonly: {
    backgroundColor: '#F5F5F5',
    color: '#999',
  },
  
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  
  errorText: {
    fontSize: 12,
    color: '#E74C3C',
    marginTop: 4,
  },
  
  row: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  
  pickerContainer: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  
  picker: {
    height: 50,
    color: CHARCOAL,
  },
  
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  
  checkboxLabel: {
    fontSize: 14,
    color: CHARCOAL,
    marginLeft: 8,
  },
  
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
  },
  
  alertBox: {
    backgroundColor: `${PRIMARY_GOLD}20`,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY_GOLD,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  
  alertText: {
    flex: 1,
    fontSize: 13,
    color: CHARCOAL,
    marginLeft: 8,
    lineHeight: 18,
  },
  
  infoBox: {
    backgroundColor: `${PRIMARY_BROWN}15`,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY_BROWN,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
  },
  
  infoText: {
    flex: 1,
    fontSize: 13,
    color: CHARCOAL,
    marginLeft: 8,
    lineHeight: 18,
  },
  
  reviewSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  
  reviewSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY_BROWN,
    marginBottom: 12,
  },
  
  reviewItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  
  reviewLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
    width: 120,
  },
  
  reviewValue: {
    flex: 1,
    fontSize: 13,
    color: CHARCOAL,
  },
  
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  
  buttonPrimary: {
    backgroundColor: PRIMARY_BROWN,
  },
  
  buttonSecondary: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: PRIMARY_BROWN,
  },
  
  buttonPrimaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  
  buttonSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: PRIMARY_BROWN,
  },
});
