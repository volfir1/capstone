import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Animated, Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY_BROWN = '#8B4513';

const TOAST_CONFIG = {
  success: { bg: PRIMARY_BROWN, icon: 'checkmark-circle' },
  error:   { bg: '#DC3545', icon: 'close-circle' },
  warning: { bg: '#E67E22', icon: 'warning' },
  info:    { bg: '#3B82F6', icon: 'information-circle' },
};

export function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const showToast = useCallback((type, title, message, duration = 2500) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ type, title, message });
    timer.current = setTimeout(() => setToast(null), duration);
  }, []);

  const hideToast = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setToast(null);
  }, []);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return { toast, showToast, hideToast };
}

export default function ThemedToast({ toast, onHide }) {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (toast) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -120, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [toast]);

  if (!toast) return null;

  const cfg = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: cfg.bg, transform: [{ translateY }], opacity },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity style={styles.inner} onPress={onHide} activeOpacity={0.9}>
        <Ionicons name={cfg.icon} size={22} color="#fff" />
        <View style={styles.textWrap}>
          <Text style={styles.title}>{toast.title}</Text>
          {toast.message ? <Text style={styles.message}>{toast.message}</Text> : null}
        </View>
        <Ionicons name="close" size={16} color="rgba(255,255,255,0.6)" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    borderRadius: 12,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  textWrap: { flex: 1 },
  title: { color: '#fff', fontWeight: '700', fontSize: 14 },
  message: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
});
