import { useState, useEffect } from 'react';
import { View, Text, TextInput, Image, Pressable } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import client from '../src/api/client';
import { useAuth } from '../src/context/AuthContext';
import Button from '../src/components/Button';

export default function Login() {
  const router = useRouter();
  const { loginWithOtp, continueAsGuest } = useAuth();
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [settings, setSettings] = useState({});
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    client.get('/settings').then((res) => setSettings(res.data.settings || {})).catch(() => { });
  }, []);

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
      const res = await client.post('/auth/send-otp', { mobile });
      if (res.data.patient) {
        setPatient(res.data.patient);
        if (res.data.patient.name) {
          setName(res.data.patient.name);
        }
      }
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
      await client.post('/auth/send-otp', { mobile });
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
      await loginWithOtp(mobile, otp, name);
      router.replace('/(tabs)');
    } catch (e) {
      Toast.show({ type: 'error', text1: e.response?.data?.message || 'Invalid OTP' });
    }
    setLoading(false);
  };

  const skipAsGuest = async () => {
    await continueAsGuest();
    router.replace('/(tabs)');
  };

  const stats = [
    settings.years_experience ? { value: settings.years_experience, label: 'Years' } : null,
    settings.happy_patients ? { value: settings.happy_patients, label: 'Patients' } : null,
    settings.patient_satisfaction ? { value: settings.patient_satisfaction, label: 'Satisfaction' } : null,
  ].filter(Boolean);

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-white">
    
      <KeyboardAwareScrollView
        bottomOffset={40}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand header */}
        <View className="items-center mb-7">
          {settings.logo_url ? (
            <Image source={{ uri: settings.logo_url }} className="w-16 h-16 rounded-2xl mb-3" resizeMode="contain" />
          ) : (
            <View className="w-16 h-16 rounded-full bg-brand-100 items-center justify-center mb-3">
              <Ionicons name="medkit" size={28} color="#1d4ed8" />
            </View>
          )}
          <Text className="text-xl font-extrabold text-slate-900 text-center">
            {settings.site_name || 'Neurocare Clinic'}
          </Text>
          <Text className="text-slate-500 text-sm mt-1">
            {settings.site_tagline || 'Login to manage your appointments'}
          </Text>

          {stats.length > 0 && (
            <View className="flex-row items-center bg-slate-50 rounded-2xl px-4 py-3 mt-5" style={{ gap: 18 }}>
              {stats.map((s, i) => (
                <View key={i} className="flex-row items-center" style={{ gap: 18 }}>
                  {i > 0 && <View className="w-px h-7 bg-slate-200" />}
                  <View className="items-center">
                    <Text className="font-extrabold text-brand-700 text-sm">{s.value}</Text>
                    <Text className="text-slate-400 text-[10px]">{s.label}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Auth card */}
        <View className="bg-white rounded-2xl border border-slate-100 p-5" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}>
          {!otpSent ? (
            <>
              <Text className="text-xs font-semibold text-slate-500 uppercase mb-1.5">Mobile Number</Text>
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

              {!patient?.name && (
                <>
                  <Text className="text-xs font-semibold text-slate-500 uppercase mb-1.5">
                    Your Name
                  </Text>

                  <TextInput
                    placeholder="Full name"
                    placeholderTextColor="#94a3b8"
                    value={name}
                    onChangeText={setName}
                    className="border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-900 mb-4"
                  />
                </>
              )}
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

        <View className="flex-row items-center gap-3 my-6">
          <View className="flex-1 h-px bg-slate-200" />
          <Text className="text-slate-400 text-xs">OR</Text>
          <View className="flex-1 h-px bg-slate-200" />
        </View>

        <Button label="Continue as Guest" variant="outline" icon="person-outline" onPress={skipAsGuest} />
        <Text className="text-slate-400 text-[11px] text-center mt-3">
          You can browse the app as a guest. Login is required to book appointments or view your profile.
        </Text>

        <Pressable onPress={() => router.push('/reception-login')} className="mt-6 items-center">
          <Text className="text-slate-400 text-xs font-medium">Clinic Staff? <Text className="text-brand-600 font-semibold">Staff Login</Text></Text>
        </Pressable>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}