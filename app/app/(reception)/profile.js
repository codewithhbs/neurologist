import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import AppHeader from '../../src/components/AppHeader';
import Screen from '../../src/components/Screen';
import Button from '../../src/components/Button';

export default function ReceptionProfile() {
  const router = useRouter();
  const { staff, logout } = useAuth();

  const doLogout = async () => {
    await logout();
    router.replace('/reception-login');
  };

  return (
    <Screen className="bg-white">
      <AppHeader title="Staff Profile" showBack={false} />
      <View className="px-5 pt-6">
        <View className="items-center mb-8">
          <View className="w-20 h-20 rounded-full bg-brand-100 items-center justify-center mb-3">
            <Ionicons name="person" size={36} color="#1d4ed8" />
          </View>
          <Text className="text-lg font-extrabold text-slate-900">{staff?.name}</Text>
          <Text className="text-slate-400 text-sm">{staff?.mobile}</Text>
          {staff?.clinic_name && (
            <View className="flex-row items-center gap-1 mt-2 bg-slate-100 px-3 py-1.5 rounded-full">
              <Ionicons name="business" size={12} color="#64748b" />
              <Text className="text-slate-600 text-xs font-medium">{staff.clinic_name}</Text>
            </View>
          )}
        </View>

        <Button label="Logout" variant="danger" icon="log-out-outline" onPress={doLogout} />
      </View>
    </Screen>
  );
}
