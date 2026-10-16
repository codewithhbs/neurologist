import { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, Image, FlatList, TextInput, Pressable, ActivityIndicator, RefreshControl, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import client from '../../src/api/client';
import ServiceCard from '../../src/components/ServiceCard';

const BANNER = require('../../assets/brand-banner.png');

const NAVY = '#1e3a8a';
const BLUE = '#2563eb';
const BG = '#f5f8ff';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'featured', label: 'Popular' },
  { key: 'free', label: 'Free Consult' },
  { key: 'quick', label: 'Under 30 min' },
];

export default function Services() {
  const [services, setServices] = useState([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await client.get('/services');
      setServices(res.data.services || []);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services.filter((s) => {
      if (q && !(`${s.name} ${s.short_description || ''}`.toLowerCase().includes(q))) return false;
      if (filter === 'featured' && Number(s.is_featured) !== 1) return false;
      if (filter === 'free' && parseFloat(s.base_price) !== 0) return false;
      if (filter === 'quick' && !(s.duration_minutes && Number(s.duration_minutes) <= 30)) return false;
      return true;
    });
  }, [services, query, filter]);

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }} />

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 20 }}
        contentContainerStyle={{ gap: 12, paddingBottom: 28 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />}
        renderItem={({ item }) => <ServiceCard service={item} style={{ flex: 1 }} />}
        ListHeaderComponent={
          <View style={{ backgroundColor: '#fff', borderBottomLeftRadius: 28, borderBottomRightRadius: 28, paddingBottom: 16, marginBottom: 18 }}>
            {/* ---- BRAND BANNER ---- */}
            <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
              <View
                style={{
                  borderRadius: 18,
                  overflow: 'hidden',
                  backgroundColor: '#eef4ff',
                  shadowColor: NAVY, shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 3,
                }}
              >
                <Image
                  source={BANNER}
                  style={{ width: '100%',height: 80 }}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* ---- TITLE ---- */}
            <View style={{ paddingHorizontal: 20, marginTop: 18 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 4, height: 22, borderRadius: 4, backgroundColor: BLUE, marginRight: 10 }} />
                <Text style={{ fontSize: 23, fontWeight: '800', color: '#0f172a' }}>Our Services</Text>
              </View>
              <Text style={{ fontSize: 12, color: '#64748b', marginTop: 6, marginLeft: 14 }}>
                Comprehensive dental care for the whole family
              </Text>
            </View>

            {/* ---- SEARCH ---- */}
            <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
              <View
                style={{
                  flexDirection: 'row', alignItems: 'center', height: 46,
                  backgroundColor: '#f1f5fd', borderRadius: 15, paddingHorizontal: 14,
                  borderWidth: 1, borderColor: '#e2e8f5',
                }}
              >
                <Ionicons name="search" size={17} color="#94a3b8" />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search treatments…"
                  placeholderTextColor="#94a3b8"
                  style={{ flex: 1, marginLeft: 9, fontSize: 13.5, color: '#0f172a', padding: 0 }}
                />
                {query.length > 0 && (
                  <Pressable onPress={() => setQuery('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={17} color="#cbd5e1" />
                  </Pressable>
                )}
              </View>
            </View>

            {/* ---- FILTER CHIPS ---- */}
            <FlatList
              horizontal
              data={FILTERS}
              keyExtractor={(f) => f.key}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 8, marginTop: 14 }}
              renderItem={({ item }) => {
                const active = filter === item.key;
                return (
                  <Pressable
                    onPress={() => setFilter(item.key)}
                    style={{
                      paddingHorizontal: 15, height: 34, borderRadius: 999,
                      alignItems: 'center', justifyContent: 'center',
                      backgroundColor: active ? NAVY : '#fff',
                      borderWidth: 1, borderColor: active ? NAVY : '#e2e8f5',
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#fff' : '#475569' }}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              }}
            />

            {/* ---- COUNT ---- */}
            {!loading && (
              <Text style={{ paddingHorizontal: 20, marginTop: 16, fontSize: 11.5, color: '#94a3b8', fontWeight: '600' }}>
                {filtered.length} {filtered.length === 1 ? 'treatment' : 'treatments'} available
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={{ paddingTop: 50, alignItems: 'center' }}>
              <ActivityIndicator color={BLUE} />
            </View>
          ) : (
            <View style={{ alignItems: 'center', paddingTop: 40, paddingHorizontal: 40 }}>
              <View style={{ width: 68, height: 68, borderRadius: 999, backgroundColor: '#e8f0ff', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="search-outline" size={30} color={BLUE} />
              </View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a', marginTop: 14 }}>No services found</Text>
              <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 5, textAlign: 'center' }}>
                Try a different search or clear the filters.
              </Text>
              {(query || filter !== 'all') && (
                <Pressable
                  onPress={() => { setQuery(''); setFilter('all'); }}
                  style={{ marginTop: 16, paddingHorizontal: 20, height: 40, borderRadius: 13, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Reset filters</Text>
                </Pressable>
              )}
            </View>
          )
        }
      />
    </View>
  );
}