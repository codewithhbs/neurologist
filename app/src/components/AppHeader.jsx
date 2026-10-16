import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AppHeader({ title, subtitle, showBack = true }) {
  const router = useRouter();
  return (
    <View className="bg-brand-700 px-4 pt-2 pb-5">
      <View className="flex-row items-center gap-3">
        {showBack && router.canGoBack() && (
          <Pressable onPress={() => router.back()} className="w-9 h-9 rounded-full bg-white/15 items-center justify-center">
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </Pressable>
        )}
        <View className="flex-1">
          <Text className="text-white text-xl font-extrabold">{title}</Text>
          {subtitle && <Text className="text-brand-100 text-xs mt-0.5">{subtitle}</Text>}
        </View>
      </View>
    </View>
  );
}
