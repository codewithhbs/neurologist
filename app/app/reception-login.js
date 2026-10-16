import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import client from '../src/api/client';
import { useAuth } from '../src/context/AuthContext';
import Button from '../src/components/Button';

export default function ReceptionLogin() {
  const router = useRouter();
  const { loginReceptionist } = useAuth();
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  const sendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      Toast.show({ type: 'error', text1: 'Enter a valid 10-digit mobile number' });
      return;
    }
    setLoading(true);
    try {
      await client.post('/reception/auth/send-otp', { mobile });
      setOtpSent(true);
      setResendTimer(30);
      Toast.show({ type: 'success', text1: 'OTP sent successfully' });
    } catch (e) {
      Toast.show({ type: 'error', text1: e.response?.data?.message || 'Failed to send OTP' });
    }
    setLoading(false);
  };

  const resendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      await client.post('/reception/auth/send-otp', { mobile });
      setResendTimer(30);
      Toast.show({ type: 'success', text1: 'OTP resent' });
    } catch (e) {
      Toast.show({ type: 'error', text1: e.response?.data?.message || 'Failed to resend OTP' });
    }
    setLoading(false);
  };

  const verify = async () => {
    if (otp.length !== 6) {
      Toast.show({ type: 'error', text1: 'Enter the 6-digit OTP' });
      return;
    }
    setLoading(true);
    try {
      await loginReceptionist(mobile, otp);
      router.replace('/(reception)');
    } catch (e) {
      Toast.show({ type: 'error', text1: e.response?.data?.message || 'Invalid OTP' });
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-white">
      <KeyboardAwareScrollView
        bottomOffset={40}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-7">
          <View className="w-16 h-16 rounded-full bg-brand-100 items-center justify-center mb-3">
            <Ionicons name="briefcase" size={28} color="#1d4ed8" />
          </View>
          <Text className="text-xl font-extrabold text-slate-900 text-center">Staff Login</Text>
          <Text className="text-slate-500 text-sm mt-1">Receptionist desk access</Text>
        </View>

        <View className="bg-white rounded-2xl border border-slate-100 p-5" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}>
          {!otpSent ? (
            <>
              <Text className="text-xs font-semibold text-slate-500 uppercase mb-1.5">Registered Staff Mobile</Text>
              <View className="flex-row items-center border border-slate-200 rounded-xl mb-4 overflow-hidden">
                <View className="px-3.5 py-3.5 bg-slate-50 border-r border-slate-200">
                  <Text className="text-slate-500 text-sm font-medium">+91</Text>
                </View>
                <TextInput
                  keyboardType="number-pad"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  placeholderTextColor="#94a3b8"
                  value={mobile}
                  onChangeText={(t) => setMobile(t.replace(/\D/g, ''))}
                  className="flex-1 px-4 py-3.5 text-sm text-slate-900"
                />
              </View>
              <Button label="Send OTP" icon="paper-plane-outline" onPress={sendOtp} loading={loading} />
            </>
          ) : (
            <>
              <Pressable onPress={() => { setOtpSent(false); setOtp(''); }} className="flex-row items-center gap-1 mb-4">
                <Ionicons name="chevron-back" size={14} color="#1d4ed8" />
                <Text className="text-brand-600 text-xs font-semibold">Change number</Text>
              </Pressable>

              <Text className="text-slate-500 text-xs mb-4">
                OTP sent to <Text className="font-semibold text-slate-700">+91 {mobile}</Text>
              </Text>

              <Text className="text-xs font-semibold text-slate-500 uppercase mb-1.5">Enter OTP</Text>
              <TextInput
                keyboardType="number-pad"
                maxLength={6}
                placeholder="6-digit OTP"
                placeholderTextColor="#94a3b8"
                value={otp}
                onChangeText={(t) => setOtp(t.replace(/\D/g, ''))}
                className="border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-900 mb-2 tracking-widest"
              />

              <Pressable onPress={resendOtp} disabled={resendTimer > 0} className="mb-4">
                <Text className={`text-xs font-medium ${resendTimer > 0 ? 'text-slate-400' : 'text-brand-600'}`}>
                  {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                </Text>
              </Pressable>

              <Button label="Verify & Login" icon="checkmark-circle-outline" onPress={verify} loading={loading} />
            </>
          )}
        </View>

        <Pressable onPress={() => router.replace('/login')} className="mt-6">
          <Text className="text-slate-400 text-xs text-center">← Back to patient login</Text>
        </Pressable>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
