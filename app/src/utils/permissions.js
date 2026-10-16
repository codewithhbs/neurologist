import { Platform, PermissionsAndroid } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import * as Location from 'expo-location';

/* ---------------- Notifications / FCM ---------------- */

async function requestAndroidNotificationPermission() {
  if (Platform.OS !== 'android' || Platform.Version < 33) return true;

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

export async function askNotification() {
  try {
    if (!messaging || typeof messaging !== 'function') {
      console.log('Firebase messaging not available — check native build');
      return { granted: false, token: null };
    }

    const androidOk = await requestAndroidNotificationPermission();
    if (!androidOk) return { granted: false, token: null };

    const authStatus = await messaging().requestPermission();
    const granted =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!granted) return { granted: false, token: null };

    const token = await getFcmToken();
    return { granted: true, token };
  } catch (err) {
    console.log('askNotification error:', err);
    return { granted: false, token: null };
  }
}
export async function getFcmToken() {
  try {
    await messaging().registerDeviceForRemoteMessages();
    const token = await messaging().getToken();
    return token || null;
  } catch (err) {
    console.log('getFcmToken error:', err);
    return null;
  }
}

export function onTokenRefresh(callback) {
  return messaging().onTokenRefresh(callback);
}

/* ---------------- Location ---------------- */

export async function askLocation() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { granted: false, coords: null };
    }

    const coords = await getLocation();
    return { granted: true, coords };
  } catch (err) {
    console.log('askLocation error:', err);
    return { granted: false, coords: null };
  }
}

export async function getLocation() {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch (err) {
    console.log('getLocation error:', err);
    return null;
  }
}

export async function getAddressFromCoords(latitude, longitude) {
  try {
    const result = await Location.reverseGeocodeAsync({ latitude, longitude });
    return result?.[0] || null;
  } catch (err) {
    console.log('getAddressFromCoords error:', err);
    return null;
  }
}