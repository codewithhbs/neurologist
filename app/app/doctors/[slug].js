import { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import client from '../../src/api/client';
import AppHeader from '../../src/components/AppHeader';
import Button from '../../src/components/Button';
import TestimonialCard from '../../src/components/TestimonialCard';

const BIO_COLLAPSED_LINES = 4;

export default function DoctorDetail() {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState(null);
  const [bioExpanded, setBioExpanded] = useState(false);

  useEffect(() => {
    client.get(`/doctors/${slug}`).then((res) => setData(res.data)).catch(() => setData(false));
  }, [slug]);

  if (data === null) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#1d4ed8" size="large" />
      </SafeAreaView>
    );
  }
  if (!data) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-8">
        <View className="w-16 h-16 rounded-full bg-slate-100 items-center justify-center mb-3">
          <Ionicons name="alert-circle-outline" size={26} color="#94a3b8" />
        </View>
        <Text className="text-slate-500 font-medium text-center">Doctor not found.</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-brand-600 font-semibold text-sm">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const { doctor, services = [], reviews = [] } = data;
  const firstName = doctor.name

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-white" edges={['top']}>
      <AppHeader title={doctor.name} subtitle={doctor.specialization} />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View className="bg-slate-50 rounded-3xl p-5 items-center mb-6">
          {doctor.photo_url ? (
            <Image source={{ uri: doctor.photo_url }} className="w-24 h-24 rounded-full mb-3" />
          ) : (
            <View className="w-24 h-24 rounded-full bg-brand-100 items-center justify-center mb-3">
              <Text className="text-3xl font-bold text-brand-600">{doctor.name?.[4] || 'D'}</Text>
            </View>
          )}

          <Text className="font-extrabold text-lg text-slate-900 text-center">{doctor.name}</Text>
          <Text className="text-slate-500 text-xs mt-0.5">{doctor.qualification}</Text>
          <Text className="text-brand-600 text-xs font-semibold mt-0.5">{doctor.specialization}</Text>

          <View className="flex-row items-center flex-wrap justify-center gap-2 mt-3">
            <View className="flex-row items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full">
              <Ionicons name="star" size={12} color="#f59e0b" />
              <Text className="text-[11px] font-bold text-amber-700">{doctor.rating} Rating</Text>
            </View>

            {doctor.experience_years ? (
              <View className="flex-row items-center gap-1 bg-white px-2.5 py-1 rounded-full">
                <Ionicons name="ribbon-outline" size={12} color="#1d4ed8" />
                <Text className="text-[11px] font-semibold text-slate-600">{doctor.experience_years}+ yrs experience</Text>
              </View>
            ) : null}

            {doctor.registration_no ? (
              <View className="flex-row items-center gap-1 bg-white px-2.5 py-1 rounded-full">
                <Ionicons name="shield-checkmark-outline" size={12} color="#16a34a" />
                <Text className="text-[11px] font-semibold text-slate-600">Reg. No. {doctor.registration_no}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* About */}
        <View className="flex-row items-center gap-2 mb-3">
          <View className="w-7 h-7 rounded-full bg-brand-50 items-center justify-center">
            <Ionicons name="person-outline" size={14} color="#1d4ed8" />
          </View>
          <Text className="font-bold text-slate-900 text-base">About</Text>
        </View>

        <Text
          className="text-slate-600 text-sm leading-6"
          numberOfLines={bioExpanded ? undefined : BIO_COLLAPSED_LINES}
        >
          {doctor.bio}
        </Text>
        {doctor.bio && doctor.bio.length > 180 && (
          <Pressable onPress={() => setBioExpanded(!bioExpanded)} className="mt-1.5">
            <Text className="text-brand-600 text-xs font-semibold">{bioExpanded ? 'Show less' : 'Read more'}</Text>
          </Pressable>
        )}

        {/* Services */}
        {services.length > 0 && (
          <View className="mt-7">
            <View className="flex-row items-center gap-2 mb-3">
              <View className="w-7 h-7 rounded-full bg-brand-50 items-center justify-center">
                <Ionicons name="medical-outline" size={14} color="#1d4ed8" />
              </View>
              <Text className="font-bold text-slate-900 text-base">Services Offered</Text>
            </View>

            <View className="gap-2">
              {services.map((s) => (
                <View key={s.id} className="flex-row justify-between items-center bg-slate-50 rounded-xl px-4 py-3.5 border border-slate-100">
                  <View className="flex-1 pr-3">
                    <Text className="font-semibold text-slate-800 text-sm">{s.name}</Text>
                    {s.duration_minutes ? (
                      <View className="flex-row items-center gap-1 mt-1">
                        <Ionicons name="time-outline" size={11} color="#94a3b8" />
                        <Text className="text-slate-400 text-[11px]">{s.duration_minutes} min</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text className="font-bold text-brand-700 text-sm">₹{s.fee}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <View className="mt-7">
            <View className="flex-row items-center gap-2 mb-3">
              <View className="w-7 h-7 rounded-full bg-brand-50 items-center justify-center">
                <Ionicons name="chatbubble-ellipses-outline" size={13} color="#1d4ed8" />
              </View>
              <Text className="font-bold text-slate-900 text-base">Patient Reviews</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {reviews.map((item, idx) => (
                <View key={String(item.id)} style={{ marginRight: idx === reviews.length - 1 ? 0 : 12 }}>
                  <TestimonialCard review={item} />
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Sticky book bar */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 14), shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: -2 }, elevation: 8 }}
      >
        <View className="flex-row items-center gap-3">
          {doctor.service_fee ? (
            <View className="flex-1">
              <Text className="text-slate-400 text-[10px]">Consultation fee</Text>
              <Text className="text-slate-900 font-extrabold text-base">₹{Number(doctor.service_fee).toLocaleString('en-IN')}</Text>
            </View>
          ) : null}
          <View style={{ flex: doctor.service_fee ? 1.6 : 1 }}>
            <Button
              label={`Book with ${firstName}`}
              icon="calendar"
              onPress={() => router.push(`/appointment?doctor=${doctor.slug}`)}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}