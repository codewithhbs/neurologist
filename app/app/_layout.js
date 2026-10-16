import "../global.css";
import { Stack } from "expo-router";
import Toast from "react-native-toast-message";
import { AuthProvider } from "../src/context/AuthContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "react-native";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="login" />
          <Stack.Screen name="reception-login" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(reception)" />
          <Stack.Screen name="doctors/[slug]" />
          <Stack.Screen name="services/[slug]" />
          <Stack.Screen name="blog/[slug]" />
          <Stack.Screen name="offers" />
          <Stack.Screen name="reviews" />
          <Stack.Screen name="contact" />
          <Stack.Screen name="appointment" />
        </Stack>
        <Toast />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
