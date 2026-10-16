import { View, Text, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ServiceCard({ service, style }) {
  const router = useRouter();
  const isFree = parseFloat(service.base_price) === 0;
  const isFeatured = Number(service.is_featured) === 1;

  return (
    <Pressable
      onPress={() => router.push(`/services/${service.slug}`)}
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm"
      style={style || { width: 150 }}
    >
      <View className="w-full h-24 bg-brand-50">
        {service.banner_image_url || service.icon_url ? (
          <Image source={{ uri: service.banner_image_url || service.icon_url }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Text className="text-3xl">🦷</Text>
          </View>
        )}

        {isFeatured && (
          <View className="absolute top-2 left-2 bg-amber-400 px-2 py-0.5 rounded-full flex-row items-center">
            <Ionicons name="star" size={9} color="#78350f" />
            <Text className="text-[9px] font-bold text-amber-900 ml-1">Popular</Text>
          </View>
        )}

        {service.duration_minutes ? (
          <View className="absolute bottom-2 right-2 bg-black/60 px-2 py-0.5 rounded-full flex-row items-center">
            <Ionicons name="time-outline" size={10} color="#fff" />
            <Text className="text-[9px] font-semibold text-white ml-1">{service.duration_minutes} min</Text>
          </View>
        ) : null}
      </View>

      <View className="p-3">
        <Text className="font-bold text-slate-900 text-xs" numberOfLines={1}>{service.name}</Text>

        {service.short_description ? (
          <Text className="text-slate-500 text-[10px] mt-1 leading-4" numberOfLines={2}>
            {service.short_description}
          </Text>
        ) : null}

        <View className="flex-row items-center justify-between mt-2.5">
          {isFree ? (
            <View className="bg-emerald-50 px-2 py-1 rounded-lg">
              <Text className="text-emerald-700 font-bold text-[11px]">Free</Text>
            </View>
          ) : (
            <View>
              <Text className="text-slate-400 text-[9px]">View Details</Text>
              {/* <Text className="text-brand-700 font-extrabold text-sm -mt-0.5">₹{Number(service.base_price).toLocaleString('en-IN')}</Text> */}
            </View>
          )}

          <View className="w-6 h-6 rounded-full bg-brand-50 items-center justify-center">
            <Ionicons name="arrow-forward" size={13} color="#1d4ed8" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}