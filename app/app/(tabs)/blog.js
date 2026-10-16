import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import client from '../../src/api/client';
import BlogCard from '../../src/components/BlogCard';
import AppHeader from '../../src/components/AppHeader';

export default function Blog() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchBlogs = useCallback(() => {
    return client
      .get('/blogs?limit=20')
      .then((res) => {
        setBlogs(res.data.blogs || []);
        setError(false);
      })
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    fetchBlogs().finally(() => setLoading(false));
  }, [fetchBlogs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBlogs().finally(() => setRefreshing(false));
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-white" edges={['top']}>
      <AppHeader title="Dental Blog" subtitle="Tips, news and insights for a healthier smile" />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1d4ed8" size="large" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-10">
          <Ionicons name="newspaper-outline" size={40} color="#cbd5e1" />
          <Text className="text-slate-400 text-sm mt-3 text-center">
            Couldn't load articles. Pull down to try again.
          </Text>
        </View>
      ) : (
        <FlatList
          data={blogs}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View className="h-4" />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1d4ed8" />
          }
          renderItem={({ item, index }) => <BlogCard blog={item} featured={index === 0} />}
          ListEmptyComponent={
            <View className="items-center justify-center mt-24 px-10">
              <Ionicons name="newspaper-outline" size={40} color="#cbd5e1" />
              <Text className="text-slate-400 text-sm mt-3 text-center">
                No articles yet. Check back soon.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}