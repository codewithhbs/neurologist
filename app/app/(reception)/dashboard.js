import { useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import client from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';
import AppHeader from '../../src/components/AppHeader';
import Screen from '../../src/components/Screen';

const METHOD_ICON = { cash: 'cash', card: 'card', upi: 'qr-code' };

export default function ReceptionDashboard() {
  const { staff } = useAuth();
  const [stats, setStats] = useState(null);
  const [byMethod, setByMethod] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await client.get('/admin/receptionist/dashboard');
      setStats(res.data.stats);
      setByMethod(res.data.collectionByMethod || []);
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Failed to load dashboard' });
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  return (
    <Screen scroll={false} className="bg-slate-50">
      <AppHeader title="My Dashboard" subtitle={staff?.name} showBack={false} />
      {loading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator color="#1d4ed8" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View className="flex-row gap-3 mb-3">
            <StatCard icon="calendar" label="Today's Bookings" value={stats?.todayBookings ?? 0} color="#1d4ed8" bg="bg-blue-50" />
            <StatCard icon="albums" label="Total Bookings" value={stats?.totalBookings ?? 0} color="#7c3aed" bg="bg-violet-50" />
          </View>
          <View className="flex-row gap-3 mb-3">
            <StatCard icon="cash" label="Cash Today" value={`₹${stats?.todayCashCollected ?? 0}`} color="#16a34a" bg="bg-green-50" />
            <StatCard icon="wallet" label="Total Cash" value={`₹${stats?.totalCashCollected ?? 0}`} color="#16a34a" bg="bg-green-50" />
          </View>

          <View className="bg-white rounded-2xl border border-slate-100 p-4 mb-3">
            <Text className="font-bold text-slate-900 text-sm mb-1">Total Collected (All Modes)</Text>
            <Text className="text-2xl font-extrabold text-brand-700">₹{stats?.totalCollectedAllModes ?? 0}</Text>
          </View>

          <View className="bg-white rounded-2xl border border-slate-100 p-4">
            <Text className="font-bold text-slate-900 text-sm mb-3">Collection by Method</Text>
            {byMethod.length === 0 && <Text className="text-slate-400 text-xs">No payments collected yet.</Text>}
            {byMethod.map((m) => (
              <View key={m.method} className="flex-row items-center justify-between py-2.5 border-b border-slate-50">
                <View className="flex-row items-center gap-2">
                  <Ionicons name={METHOD_ICON[m.method] || 'card'} size={16} color="#1d4ed8" />
                  <Text className="text-slate-700 text-sm font-medium capitalize">{m.method}</Text>
                  <Text className="text-slate-400 text-xs">({m.count})</Text>
                </View>
                <Text className="font-bold text-slate-900 text-sm">₹{m.total}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

function StatCard({ icon, label, value, color, bg }) {
  return (
    <View className={`flex-1 rounded-2xl p-4 ${bg}`}>
      <Ionicons name={icon} size={18} color={color} />
      <Text className="text-xl font-extrabold text-slate-900 mt-2">{value}</Text>
      <Text className="text-slate-500 text-xs mt-0.5">{label}</Text>
    </View>
  );
}