import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import apiClient from '../api/apiClient';

const PRIMARY_BROWN = '#8B4513';
const PRIMARY_GOLD = '#C4AB7D';
const CHARCOAL = '#2C2C2C';
const MUTED_OLIVE = '#6B6B5A';
const BG = '#F7F8FA';

const TIME_SLOTS = [
  { value: '09:00', label: '9:00 AM' }, { value: '09:30', label: '9:30 AM' },
  { value: '10:00', label: '10:00 AM' }, { value: '10:30', label: '10:30 AM' },
  { value: '11:00', label: '11:00 AM' }, { value: '11:30', label: '11:30 AM' },
  { value: '13:00', label: '1:00 PM' }, { value: '13:30', label: '1:30 PM' },
  { value: '14:00', label: '2:00 PM' }, { value: '14:30', label: '2:30 PM' },
  { value: '15:00', label: '3:00 PM' }, { value: '15:30', label: '3:30 PM' },
  { value: '16:00', label: '4:00 PM' }, { value: '16:30', label: '4:30 PM' },
  { value: '17:00', label: '5:00 PM' },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function CalendarPicker({ selectedDate, onSelectDate }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [viewMonth, viewYear]);

  const goToPrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const isWeekend = (day) => {
    if (!day) return false;
    const d = new Date(viewYear, viewMonth, day);
    return d.getDay() === 0 || d.getDay() === 6;
  };

  const isPast = (day) => {
    if (!day) return false;
    const d = new Date(viewYear, viewMonth, day);
    return d < today;
  };

  const isSelected = (day) => {
    if (!day || !selectedDate) return false;
    const d = new Date(viewYear, viewMonth, day);
    return d.toDateString() === selectedDate.toDateString();
  };

  const handleDayPress = (day) => {
    if (!day || isWeekend(day) || isPast(day)) return;
    onSelectDate(new Date(viewYear, viewMonth, day));
  };

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const canGoPrev = viewYear > today.getFullYear() || (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  return (
    <View style={cs.calendarContainer}>
      <View style={cs.calendarHeader}>
        <TouchableOpacity onPress={goToPrevMonth} disabled={!canGoPrev} style={cs.navBtn}>
          <Ionicons name="chevron-back" size={20} color={canGoPrev ? CHARCOAL : '#ccc'} />
        </TouchableOpacity>
        <Text style={cs.monthLabel}>{monthLabel}</Text>
        <TouchableOpacity onPress={goToNextMonth} style={cs.navBtn}>
          <Ionicons name="chevron-forward" size={20} color={CHARCOAL} />
        </TouchableOpacity>
      </View>
      <View style={cs.daysRow}>
        {DAYS.map(d => (
          <Text key={d} style={[cs.dayHeader, (d === 'Sun' || d === 'Sat') && cs.weekendHeader]}>{d}</Text>
        ))}
      </View>
      <View style={cs.daysGrid}>
        {calendarDays.map((day, i) => {
          const weekend = isWeekend(day);
          const past = isPast(day);
          const selected = isSelected(day);
          const disabled = !day || weekend || past;
          return (
            <TouchableOpacity
              key={i}
              style={[cs.dayCell, selected && cs.dayCellSelected, weekend && day && cs.dayCellWeekend]}
              onPress={() => handleDayPress(day)}
              disabled={disabled}
            >
              {day && (
                <Text style={[
                  cs.dayText,
                  selected && cs.dayTextSelected,
                  weekend && cs.dayTextWeekend,
                  past && !weekend && cs.dayTextPast,
                ]}>
                  {day}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function Appointment() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    phone: '09',
    appointmentDate: null,
    appointmentTime: '',
  });
  const [showTimeSlots, setShowTimeSlots] = useState(false);

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const getTimeLabel = (value) => TIME_SLOTS.find(t => t.value === value)?.label || '';

  const validateForm = () => {
    if (!form.fullName.trim() || form.fullName.trim().length < 2) {
      Alert.alert('Error', 'Please enter your full name (at least 2 characters).');
      return false;
    }
    if (!/^09\d{9}$/.test(form.phone)) {
      Alert.alert('Error', 'Please enter a valid PH mobile number (09XXXXXXXXX).');
      return false;
    }
    if (!form.appointmentDate) {
      Alert.alert('Error', 'Please select an appointment date.');
      return false;
    }
    const day = form.appointmentDate.getDay();
    if (day === 0 || day === 6) {
      Alert.alert('Error', 'Weekends are not available for appointments.');
      return false;
    }
    if (!form.appointmentTime) {
      Alert.alert('Error', 'Please select a time slot.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      await apiClient.post('/clientsinfo/public-appointment', {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        appointmentDate: form.appointmentDate.toISOString(),
        appointmentTime: form.appointmentTime,
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Appointment submission error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View style={[s.container, s.successContainer]}>
        <View style={s.successCard}>
          <View style={s.successIconContainer}>
            <Ionicons name="checkmark-circle" size={64} color="#22c55e" />
          </View>
          <Text style={s.successTitle}>Appointment Submitted!</Text>
          <Text style={s.successText}>
            Your appointment request has been received. Our team will review it and get back to you shortly.
          </Text>
          <View style={s.successDetails}>
            <View style={s.successRow}>
              <Ionicons name="person-outline" size={16} color={MUTED_OLIVE} />
              <Text style={s.successDetailText}>{form.fullName}</Text>
            </View>
            <View style={s.successRow}>
              <Ionicons name="calendar-outline" size={16} color={MUTED_OLIVE} />
              <Text style={s.successDetailText}>
                {form.appointmentDate?.toLocaleDateString()} at {getTimeLabel(form.appointmentTime)}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={s.backToHomeBtn} onPress={() => router.replace('/')}>
            <Text style={s.backToHomeBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={CHARCOAL} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Book Appointment</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Hero */}
        <View style={s.heroSection}>
          <View style={s.heroIconContainer}>
            <Ionicons name="calendar-outline" size={40} color={PRIMARY_GOLD} />
          </View>
          <Text style={s.heroTitle}>Schedule a Legal Consultation</Text>
          <Text style={s.heroDesc}>
            Book a consultation with our experienced legal professionals. No account required.
          </Text>
          <View style={s.infoRow}>
            {[
              { icon: 'calendar-outline', text: 'Flexible Scheduling' },
              { icon: 'scale-outline', text: 'Expert Guidance' },
              { icon: 'lock-closed-outline', text: 'Confidential' },
            ].map((item, i) => (
              <View key={i} style={s.infoItem}>
                <Ionicons name={item.icon} size={14} color={PRIMARY_GOLD} />
                <Text style={s.infoText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Form */}
        <View style={s.formSection}>
          <Text style={s.formTitle}>Appointment Details</Text>

          {/* Full Name */}
          <View style={s.inputGroup}>
            <Text style={s.label}>Full Name *</Text>
            <View style={s.inputContainer}>
              <Ionicons name="person-outline" size={18} color={MUTED_OLIVE} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="Juan Dela Cruz"
                placeholderTextColor="#999"
                value={form.fullName}
                onChangeText={v => updateForm('fullName', v)}
              />
            </View>
          </View>

          {/* Phone */}
          <View style={s.inputGroup}>
            <Text style={s.label}>Phone *</Text>
            <View style={s.inputContainer}>
              <Ionicons name="call-outline" size={18} color={MUTED_OLIVE} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="09XXXXXXXXX"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                maxLength={11}
                value={form.phone}
                onChangeText={v => {
                  const digits = v.replace(/\D/g, '');
                  updateForm('phone', digits);
                }}
              />
            </View>
          </View>

          {/* Appointment Date - Calendar Picker */}
          <View style={s.inputGroup}>
            <Text style={s.label}>Appointment Date *</Text>
            <CalendarPicker
              selectedDate={form.appointmentDate}
              onSelectDate={d => updateForm('appointmentDate', d)}
            />
          </View>

          {/* Appointment Time */}
          <View style={s.inputGroup}>
            <Text style={s.label}>Appointment Time *</Text>
            <TouchableOpacity
              style={s.inputContainer}
              onPress={() => setShowTimeSlots(!showTimeSlots)}
            >
              <Ionicons name="time-outline" size={18} color={MUTED_OLIVE} style={s.inputIcon} />
              <Text style={[s.input, { color: form.appointmentTime ? CHARCOAL : '#999' }]}>
                {form.appointmentTime ? getTimeLabel(form.appointmentTime) : 'Select a time slot'}
              </Text>
              <Ionicons name={showTimeSlots ? 'chevron-up' : 'chevron-down'} size={18} color={MUTED_OLIVE} />
            </TouchableOpacity>
            {showTimeSlots && (
              <View style={s.optionsContainer}>
                {TIME_SLOTS.map((slot, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[s.optionItem, form.appointmentTime === slot.value && s.optionItemSelected]}
                    onPress={() => { updateForm('appointmentTime', slot.value); setShowTimeSlots(false); }}
                  >
                    <Text style={[s.optionText, form.appointmentTime === slot.value && s.optionTextSelected]}>
                      {slot.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[s.submitBtn, loading && s.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={s.submitBtnText}>Submit Appointment</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          {/* Info Alert */}
          <View style={s.infoAlert}>
            <Ionicons name="information-circle-outline" size={18} color={PRIMARY_BROWN} />
            <Text style={s.infoAlertText}>
              Walk-in appointments are also welcome during office hours (Mon-Fri, 8AM-5PM).
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const cs = StyleSheet.create({
  calendarContainer: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0', overflow: 'hidden' },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: PRIMARY_BROWN },
  navBtn: { padding: 4 },
  monthLabel: { fontSize: 15, fontWeight: '700', color: '#fff' },
  daysRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  dayHeader: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: MUTED_OLIVE },
  weekendHeader: { color: '#e74c3c' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
  dayCellSelected: { backgroundColor: PRIMARY_BROWN, borderRadius: 20 },
  dayCellWeekend: { backgroundColor: '#fef2f2' },
  dayText: { fontSize: 14, color: CHARCOAL },
  dayTextSelected: { color: '#fff', fontWeight: '700' },
  dayTextWeekend: { color: '#e74c3c' },
  dayTextPast: { color: '#ccc' },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: CHARCOAL },
  heroSection: { backgroundColor: PRIMARY_BROWN, paddingHorizontal: 20, paddingVertical: 28, alignItems: 'center' },
  heroIconContainer: { width: 72, height: 72, borderRadius: 20, backgroundColor: 'rgba(196,171,125,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  heroTitle: { fontSize: 22, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 8 },
  heroDesc: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 22 },
  infoRow: { flexDirection: 'row', gap: 16, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center' },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  formSection: { paddingHorizontal: 16, paddingVertical: 20 },
  formTitle: { fontSize: 18, fontWeight: '700', color: CHARCOAL, marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: CHARCOAL, marginBottom: 6 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0', paddingHorizontal: 12, minHeight: 48 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 14, color: CHARCOAL, paddingVertical: 12 },
  optionsContainer: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0', marginTop: 4, overflow: 'hidden' },
  optionItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  optionItemSelected: { backgroundColor: `${PRIMARY_GOLD}15` },
  optionText: { fontSize: 14, color: CHARCOAL },
  optionTextSelected: { color: PRIMARY_BROWN, fontWeight: '600' },
  submitBtn: { backgroundColor: PRIMARY_BROWN, borderRadius: 12, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  infoAlert: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: `${PRIMARY_BROWN}10`, borderRadius: 12, padding: 14, marginTop: 16 },
  infoAlertText: { flex: 1, fontSize: 12, color: PRIMARY_BROWN, lineHeight: 18 },
  successContainer: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingTop: 80 },
  successCard: { backgroundColor: '#fff', borderRadius: 20, padding: 30, alignItems: 'center', width: '100%', maxWidth: 400 },
  successIconContainer: { marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: '700', color: CHARCOAL, marginBottom: 8 },
  successText: { fontSize: 14, color: MUTED_OLIVE, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  successDetails: { backgroundColor: BG, borderRadius: 12, padding: 16, width: '100%', marginBottom: 20 },
  successRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  successDetailText: { fontSize: 13, color: CHARCOAL },
  backToHomeBtn: { backgroundColor: PRIMARY_BROWN, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  backToHomeBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
