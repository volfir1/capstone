import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { registerPushToken, unregisterPushToken } from '../api/userApi';

// Configure how notifications are presented when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions and get the FCM device token.
 * Returns the token string or null if unavailable.
 */
export async function getDevicePushToken() {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  // Set up Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#8B4513',
    });
  }

  // Get the native FCM token (works with firebase-admin on the server)
  const tokenData = await Notifications.getDevicePushTokenAsync();
  return tokenData.data;
}

/**
 * Register the device's push token with the backend.
 * Call this after user is authenticated.
 */
export async function registerForPushNotifications() {
  try {
    const token = await getDevicePushToken();
    if (!token) return null;

    await registerPushToken(token);
    console.log('Push token registered with server');
    return token;
  } catch (error) {
    console.error('Failed to register push token:', error.message);
    return null;
  }
}

/**
 * Unregister the device's push token from the backend.
 * Call this on logout.
 */
export async function unregisterPushNotifications(token) {
  try {
    if (!token) return;
    await unregisterPushToken(token);
    console.log('Push token unregistered from server');
  } catch (error) {
    console.error('Failed to unregister push token:', error.message);
  }
}

/**
 * Add a listener for when a notification is received while app is foregrounded.
 * Returns a subscription that should be removed on cleanup.
 */
export function addNotificationReceivedListener(callback) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add a listener for when a user taps on a notification.
 * Returns a subscription that should be removed on cleanup.
 */
export function addNotificationResponseListener(callback) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
