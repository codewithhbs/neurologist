import { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, Image, FlatList, TextInput, Pressable, ActivityIndicator, RefreshControl, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import client from '../../src/api/client';
import DoctorCard from '../../src/components/DoctorCard';

const BANNER = require('../../assets/brand-banner.png');

const NAVY = '#1e3a8a';
const BLUE = '#2563eb';
const BG = '#f5f8ff';

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [query, setQuery] = useState('');
  const [spec, setSpec] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await client.get('/doctors');
      setDoctors(res.data.doctors || []);
    } catch {
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  // build chips from actual data
  const specs = useMemo(() => {
    const set = [...new Set(doctors.map((d) => d.specialization).filter(Boolean))];
    return [{ key: 'all', label: 'All Doctors' }, ...set.map((s) => ({ key: s, label: s }))];
  }, [doctors]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return doctors.filter((d) => {
      if (spec !== 'all' && d.specialization !== spec) return false;
      if (!q) return true;
      return `${d.name} ${d.specialization || ''} ${d.qualification || ''}`.toLowerCase().includes(q);
    });
  }, [doctors, query, spec]);

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }} />

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingBottom: 28 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 20 }}>
            <DoctorCard doctor={item} wide style={{ width: '100%' }} />
          </View>
        )}
        ListHeaderComponent={
          <View style={{ backgroundColor: '#fff', borderBottomLeftRadius: 28, borderBottomRightRadius: 28, paddingBottom: 16, marginBottom: 18 }}>
            {/* ---- BRAND BANNER ---- */}
            <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
              <View
                style={{
                  borderRadius: 18, overflow: 'hidden', backgroundColor: '#eef4ff',
                  shadowColor: NAVY, shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 3,
                }}
              >
                <Image source={BANNER} style={{ width: '100%', height: 80 }} resizeMode="cover" />
              </View>
            </View>

            {/* ---- TITLE ---- */}
            <View style={{ paddingHorizontal: 20, marginTop: 18 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 4, height: 22, borderRadius: 4, backgroundColor: BLUE, marginRight: 10 }} />
                <Text style={{ fontSize: 23, fontWeight: '800', color: '#0f172a' }}>Our Doctors</Text>
              </View>
              <Text style={{ fontSize: 12, color: '#64748b', marginTop: 6, marginLeft: 14 }}>
                Expert dentists dedicated to your smile
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
                  placeholder="Search doctor or specialization…"
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

            {/* ---- SPECIALIZATION CHIPS ---- */}
            {specs.length > 1 && (
              <FlatList
                horizontal
                data={specs}
                keyExtractor={(s) => String(s.key)}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 8, marginTop: 14 }}
                renderItem={({ item }) => {
                  const active = spec === item.key;
                  return (
                    <Pressable
                      onPress={() => setSpec(item.key)}
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
            )}

            {/* ---- COUNT ---- */}
            {!loading && (
              <Text style={{ paddingHorizontal: 20, marginTop: 16, fontSize: 11.5, color: '#94a3b8', fontWeight: '600' }}>
                {filtered.length} {filtered.length === 1 ? 'doctor' : 'doctors'} available
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
                <Ionicons name="people-outline" size={30} color={BLUE} />
              </View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a', marginTop: 14 }}>No doctors found</Text>
              <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 5, textAlign: 'center' }}>
                Try a different search or clear the filters.
              </Text>
              {(query || spec !== 'all') && (
                <Pressable
                  onPress={() => { setQuery(''); setSpec('all'); }}
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