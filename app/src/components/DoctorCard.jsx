import { View, Text, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function DoctorCard({ doctor, wide, style }) {
  const router = useRouter();

  const Initial = ({ size }) => (
    <View className={`bg-brand-50 items-center justify-center rounded-full ${size}`}>
      <Text className="text-brand-400 font-bold" style={{ fontSize: size.includes('w-20') ? 26 : 30 }}>
        {doctor.name?.[4] || 'D'}
      </Text>
    </View>
  );

  if (wide) {
    return (
      <Pressable
        onPress={() => router.push(`/doctors/${doctor.slug}`)}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm flex-row items-center p-3.5 gap-3.5"
        style={style || { width: '100%' }}
      >
        <View className="border-2 border-brand-100 rounded-full p-0.5">
          {doctor.photo_url ? (
            <Image source={{ uri: doctor.photo_url }} className="w-16 h-16 rounded-full" resizeMode="cover" />
          ) : (
            <Initial size="w-16 h-16" />
          )}
        </View>

        <View className="flex-1">
          <Text className="font-bold text-slate-900 text-sm" numberOfLines={1}>{doctor.name}</Text>
          {doctor.qualification ? (
            <Text className="text-slate-400 text-[10px] mt-0.5" numberOfLines={1}>{doctor.qualification}</Text>
          ) : null}
          <Text className="text-brand-600 text-xs font-semibold mt-0.5" numberOfLines={1}>{doctor.specialization}</Text>

          <View className="flex-row items-center gap-1.5 mt-2">
            <View className="flex-row items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full">
              <Ionicons name="star" size={10} color="#f59e0b" />
              <Text className="text-[10px] font-bold text-amber-700">{doctor.rating}</Text>
            </View>
            {doctor.experience_years ? (
              <View className="flex-row items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full">
                <Ionicons name="ribbon-outline" size={10} color="#475569" />
                <Text className="text-[10px] font-semibold text-slate-600">{doctor.experience_years}+ yrs</Text>
              </View>
            ) : null}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => router.push(`/doctors/${doctor.slug}`)}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3.5"
      style={style || { width: 160 }}
    >
      <View className="items-center mb-2.5">
        <View className="border-2 border-brand-100 rounded-full p-0.5">
          {doctor.photo_url ? (
            <Image source={{ uri: doctor.photo_url }} className="w-20 h-20 rounded-full" resizeMode="cover" />
          ) : (
            <Initial size="w-20 h-20" />
          )}
        </View>
      </View>

      <Text className="font-bold text-slate-900 text-sm text-center" numberOfLines={1}>{doctor.name}</Text>
      {doctor.qualification ? (
        <Text className="text-slate-400 text-[10px] text-center mt-0.5" numberOfLines={1}>{doctor.qualification}</Text>
      ) : null}
      <Text className="text-slate-500 text-[11px] text-center mt-0.5" numberOfLines={1}>{doctor.specialization}</Text>

      <View className="flex-row items-center justify-center gap-1.5 mt-2.5">
        <View className="flex-row items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full">
          <Ionicons name="star" size={10} color="#f59e0b" />
          <Text className="text-[10px] font-bold text-amber-700">{doctor.rating}</Text>
        </View>
        {doctor.experience_years ? (
          <View className="flex-row items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full">
            <Ionicons name="ribbon-outline" size={10} color="#475569" />
            <Text className="text-[10px] font-semibold text-slate-600">{doctor.experience_years}+ yrs</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

