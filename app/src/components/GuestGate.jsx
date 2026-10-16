import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';

export default function GuestGate({ message = 'Please login to continue.' }) {
  const router = useRouter();
  return (
    <View className="items-center justify-center px-8 py-16">
      <View className="w-16 h-16 rounded-full bg-brand-50 items-center justify-center mb-4">
        <Ionicons name="lock-closed" size={28} color="#2563eb" />
      </View>
      <Text className="text-slate-900 font-bold text-base mb-1 text-center">Login Required</Text>
      <Text className="text-slate-500 text-sm text-center mb-6">{message}</Text>
      <Button label="Login with Mobile" icon="log-in-outline" onPress={() => router.push('/login')} className="w-full" />
    </View>
  );
}
