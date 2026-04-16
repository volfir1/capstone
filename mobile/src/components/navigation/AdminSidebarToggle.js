import React from 'react';
import { StyleSheet, TouchableOpacity, UIManager, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CHARCOAL = '#2C2C2C';
const HAS_NATIVE_BLUR_VIEW = !!UIManager.getViewManagerConfig?.('ExpoBlurView');

export default function AdminSidebarToggle() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleToggleDrawer = () => {
    navigation.dispatch(DrawerActions.toggleDrawer());
  };

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <TouchableOpacity
        style={[styles.buttonShell, { top: insets.top + 58 }]}
        onPress={handleToggleDrawer}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel="Toggle sidebar"
      >
        {HAS_NATIVE_BLUR_VIEW ? (
          <BlurView intensity={36} tint="light" style={styles.buttonBlur}>
            <View style={styles.buttonTint}>
              <Ionicons name="menu-outline" size={22} color={CHARCOAL} />
            </View>
          </BlurView>
        ) : (
          <View style={[styles.buttonBlur, styles.buttonNoBlur]}>
            <View style={styles.buttonTint}>
              <Ionicons name="menu-outline" size={22} color={CHARCOAL} />
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 70,
  },
  buttonShell: {
    position: 'absolute',
    left: 12,
    width: 44,
    height: 44,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  buttonBlur: {
    flex: 1,
  },
  buttonNoBlur: {
    backgroundColor: 'rgba(248,243,235,0.72)',
  },
  buttonTint: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248,243,235,0.4)',
  },
});
