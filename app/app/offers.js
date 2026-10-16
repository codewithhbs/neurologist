import { useEffect, useState } from 'react';
import { View, Text, Image, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import client from '../src/api/client';
import AppHeader from '../src/components/AppHeader';
import Button from '../src/components/Button';

export default function Offers() {
  const router = useRouter();
  const [offers, setOffers] = useState([]);

  useEffect(() => { client.get('/offers').then((res) => setOffers(res.data.offers || [])); }, []);

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-white" edges={['top']}>
      <AppHeader title="Offers & Discounts" subtitle="Save more on your dental treatments" />
      <FlatList
        data={offers}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 20, gap: 14 }}
        ListEmptyComponent={<Text className="text-center text-slate-400 mt-10">No active offers right now. Check back soon!</Text>}
        renderItem={({ item }) => (
          <View className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} className="w-full h-36" resizeMode="cover" />
            ) : (
              <View className="w-full h-36 bg-brand-50 items-center justify-center"><Text className="text-4xl">🎁</Text></View>
            )}
            <View className="p-4">
              <Text className="font-bold text-slate-900 mb-1">{item.title}</Text>
              <Text className="text-slate-500 text-xs mb-3">{item.description}</Text>
              {item.coupon_code && (
                <View className="border border-dashed border-brand-300 bg-brand-50 rounded-xl px-4 py-2 items-center mb-3">
                  <Text className="text-slate-400 text-[10px]">Use code</Text>
                  <Text className="font-bold text-brand-700 tracking-wide">{item.coupon_code}</Text>
                </View>
              )}
              <Button label="Book & Save" onPress={() => router.push(`/appointment?coupon=${item.coupon_code || ''}`)} />
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
