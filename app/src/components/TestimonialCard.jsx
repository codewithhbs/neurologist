import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TestimonialCard({ review }) {
  return (
    <View className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm" style={{ width: 260 }}>
      <View className="flex-row gap-0.5 mb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Ionicons key={i} name="star" size={14} color={i < review.rating ? '#f59e0b' : '#e2e8f0'} />
        ))}
      </View>
      <Text className="text-slate-600 text-xs mb-3" numberOfLines={4}>"{review.review_text}"</Text>
      <Text className="font-semibold text-slate-900 text-xs">— {review.patient_name}</Text>
    </View>
  );
}
