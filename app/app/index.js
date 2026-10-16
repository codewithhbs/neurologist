import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '../src/context/AuthContext';
import {
  askLocation,
  askNotification,
} from '../src/utils/permissions';

export default function Index() {
  const router = useRouter();

  const {
    loading,
    hasSeenOnboarding,
    isAuthenticated,
    isReceptionist,
    isGuest,
  } = useAuth();

  // Request permissions
  useEffect(() => {
    let mounted = true;

    const requestPermissions = async () => {
      try {
        const notification = await askNotification();

        if (!mounted) return;

        if (notification.granted && notification.token) {
          // TODO:
          // Send notification.token to backend
        }

        const location = await askLocation();

        if (!mounted) return;

        if (location.granted && location.coords) {
          // TODO:
          // Use location.coords.latitude
          // Use location.coords.longitude
        }
      } catch (error) {
        // Permission failure should not block app navigation
      }
    };

    requestPermissions();

    return () => {
      mounted = false;
    };
  }, []);

  // Handle initial navigation
  useEffect(() => {
    if (loading) {
      return;
    }

    if (hasSeenOnboarding === null) {
      return;
    }

    // Receptionist
    if (isReceptionist) {
      router.replace('/(reception)');
      return;
    }

    // User has not completed onboarding
    if (!hasSeenOnboarding) {
      router.replace('/onboarding');
      return;
    }

    // Authenticated user
    if (isAuthenticated) {
      router.replace('/(tabs)');
      return;
    }

    // Guest user
    if (isGuest) {
      router.replace('/(tabs)');
      return;
    }

    // Not authenticated
    router.replace('/login');
  }, [
    loading,
    hasSeenOnboarding,
    isAuthenticated,
    isReceptionist,
    isGuest,
    router,
  ]);

  return (
    <View className="flex-1 items-center justify-center bg-brand-700">
      <ActivityIndicator
        color="#fff"
        size="large"
      />
    </View>
  );
}