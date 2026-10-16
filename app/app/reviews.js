import { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import client from '../src/api/client';
import AppHeader from '../src/components/AppHeader';

export default function Reviews() {
  const [data, setData] = useState({ reviews: [], avg_rating: 0, total: 0 });

  useEffect(() => { client.get('/reviews').then((res) => setData(res.data)); }, []);

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-white" edges={['top']}>
      <AppHeader title="Patient Reviews" subtitle={`${parseFloat(data.avg_rating || 5).toFixed(1)} ★ · ${data.total || 0} reviews`} />
      <FlatList
        data={data.reviews}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 20, gap: 12 }}
        ListEmptyComponent={<Text className="text-center text-slate-400 mt-10">No reviews yet.</Text>}
        renderItem={({ item }) => (
          <View className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <View className="flex-row gap-0.5 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Ionicons key={i} name="star" size={14} color={i < item.rating ? '#f59e0b' : '#e2e8f0'} />
              ))}
            </View>
            <Text className="text-slate-600 text-sm mb-2">"{item.review_text}"</Text>
            <Text className="font-semibold text-slate-900 text-xs">— {item.patient_name}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
