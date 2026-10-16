import { useEffect, useRef, useState } from 'react';
import { View, Text, Image, FlatList, Dimensions, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import client from '../src/api/client';
import { useAuth } from '../src/context/AuthContext';

const { width } = Dimensions.get('window');

const FALLBACK_SLIDES = [
  { id: 1, title: 'World-Class Dental Care', subtitle: 'Advanced treatments with compassion and care.', image_url: null },
  { id: 2, title: 'Book Appointments Instantly', subtitle: 'Choose your doctor, pick a slot, and confirm in seconds.', image_url: null },
  { id: 3, title: 'Track Your Dental Journey', subtitle: 'View prescriptions, medical history and follow-ups anytime.', image_url: null }
];

export default function Onboarding() {
  const router = useRouter();
  const { completeOnboarding } = useAuth();
  const [slides, setSlides] = useState(null);
  const [settings, setSettings] = useState({});
  const [index, setIndex] = useState(0);
  const listRef = useRef(null);

  useEffect(() => {
    client.get('/onboarding-slides')
      .then((res) => setSlides(res.data.slides?.length ? res.data.slides : FALLBACK_SLIDES))
      .catch(() => setSlides(FALLBACK_SLIDES));
    client.get('/settings').then((res) => setSettings(res.data.settings || {})).catch(() => {});
  }, []);

  const finish = async () => {
    await completeOnboarding();
    router.replace('/login');
  };

  const next = () => {
    if (index < (slides?.length || 0) - 1) {
      listRef.current?.scrollToIndex({ index: index + 1 });
      setIndex(index + 1);
    } else {
      finish();
    }
  };

  if (!slides) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-700">
        <StatusBar style="light" />
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-white">
      <StatusBar style="dark" backgroundColor="#ffffff" />

      {/* Brand header */}
      <View className="flex-row items-center justify-between px-6 pt-2 pb-1">
        <View className="flex-row items-center gap-2.5">
          {settings.logo_url ? (
            <Image source={{ uri: settings.logo_url }} className="w-9 h-9 rounded-xl" resizeMode="contain" />
          ) : (
            <View className="w-9 h-9 rounded-xl bg-brand-100 items-center justify-center">
              <Ionicons name="medkit" size={18} color="#1d4ed8" />
            </View>
          )}
          <Text className="font-bold text-slate-900 text-sm" numberOfLines={1} style={{ maxWidth: width * 0.55 }}>
            {settings.site_name || 'Dental Health Care'}
          </Text>
        </View>

        <Pressable onPress={finish} className="px-3 py-1.5 rounded-full bg-slate-100">
          <Text className="text-slate-500 font-semibold text-xs">Skip</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => String(item.id)}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={{ width }} className="items-center justify-center px-8">
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={{ width: width * 0.75, height: width * 0.85 }} className="rounded-3xl mb-8" resizeMode="cover" />
            ) : (
              <View style={{ width: width * 0.75, height: width * 0.85 }} className="rounded-3xl mb-8 bg-brand-50 items-center justify-center">
                <Text className="text-6xl">🦷</Text>
              </View>
            )}
            <Text className="text-2xl font-extrabold text-slate-900 text-center mb-3">{item.title}</Text>
            <Text className="text-slate-500 text-center text-sm leading-5">{item.subtitle}</Text>
          </View>
        )}
      />

      <View className="flex-row justify-center gap-2 mb-6">
        {slides.map((_, i) => (
          <View key={i} className={`h-2 rounded-full ${i === index ? 'w-6 bg-brand-600' : 'w-2 bg-brand-100'}`} />
        ))}
      </View>

      <View className="px-8 pb-8">
        <Pressable onPress={next} className="bg-brand-600 rounded-2xl py-4 flex-row items-center justify-center gap-2">
          <Text className="text-white font-bold text-[15px]">{index === slides.length - 1 ? 'Get Started' : 'Next'}</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </Pressable>

        {index < slides.length - 1 && (
          <Pressable onPress={finish} className="items-center mt-3">
            <Text className="text-slate-400 text-xs font-medium">Skip and go to login</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}