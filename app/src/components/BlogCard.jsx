import { View, Text, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function BlogCard({ blog, featured = false }) {
  const router = useRouter();
  const date = blog.published_at
    ? new Date(blog.published_at).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    : '';

  if (featured) {
    return (
      <Pressable
        onPress={() => router.push(`/blog/${blog.slug}`)}
        className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-md mb-1 active:opacity-90"
      >
        {blog.cover_image_url ? (
          <Image source={{ uri: blog.cover_image_url }} className="w-full h-52" resizeMode="cover" />
        ) : (
          <View className="w-full h-52 bg-brand-50 items-center justify-center">
            <Ionicons name="newspaper-outline" size={36} color="#1d4ed8" />
          </View>
        )}
        <View className="p-5">
          {blog.category_name && (
            <View className="self-start bg-brand-50 rounded-full px-3 py-1 mb-2">
              <Text className="text-brand-600 text-[10px] font-bold uppercase">
                {blog.category_name}
              </Text>
            </View>
          )}
          <Text className="font-extrabold text-slate-900 text-lg mb-1.5 leading-tight" numberOfLines={2}>
            {blog.title}
          </Text>
          <Text className="text-slate-500 text-xs mb-3 leading-relaxed" numberOfLines={2}>
            {blog.excerpt}
          </Text>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="calendar-outline" size={13} color="#94a3b8" />
              <Text className="text-slate-400 text-[11px]">{date}</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Text className="text-brand-600 text-xs font-bold">Read more</Text>
              <Ionicons name="arrow-forward" size={13} color="#1d4ed8" />
            </View>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => router.push(`/blog/${blog.slug}`)}
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm flex-row active:opacity-90"
    >
      {blog.cover_image_url ? (
        <Image source={{ uri: blog.cover_image_url }} className="w-28 h-full" resizeMode="cover" />
      ) : (
        <View className="w-28 bg-brand-50 items-center justify-center">
          <Ionicons name="newspaper-outline" size={24} color="#1d4ed8" />
        </View>
      )}
      <View className="flex-1 p-4">
        {blog.category_name && (
          <Text className="text-brand-600 text-[10px] font-bold uppercase mb-1">
            {blog.category_name}
          </Text>
        )}
        <Text className="font-bold text-slate-900 text-sm mb-1 leading-tight" numberOfLines={2}>
          {blog.title}
        </Text>
        <Text className="text-slate-500 text-xs mb-2 leading-relaxed" numberOfLines={2}>
          {blog.excerpt}
        </Text>
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="calendar-outline" size={12} color="#94a3b8" />
          <Text className="text-slate-400 text-[11px]">{date}</Text>
        </View>
      </View>
    </Pressable>
  );
}