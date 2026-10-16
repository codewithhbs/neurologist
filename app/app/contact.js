import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import client from '../src/api/client';
import AppHeader from '../src/components/AppHeader';
import Button from '../src/components/Button';

export default function Contact() {
  const [settings, setSettings] = useState({});
  useEffect(() => { client.get('/settings').then((res) => setSettings(res.data.settings || {})); }, []);

  const phone = settings.phone || '9716590959';
  const whatsapp = settings.whatsapp || '918527271759';
  const email = settings.email || 'neurocareclinic@gmail.com';
  const address = settings.address || 'A-122, Chander Vihar, Opp. Ramakrishna Apartment / Kali Mata Mandir, I.P. Extension, Patparganj, Delhi – 110092';

  const rows = [
    ['location', 'Address', address],
    ['call', 'Phone', `${phone} / +91 ${whatsapp?.replace('91', '')}`],
    ['mail', 'Email', email],
    ['time', 'Clinic Timing', 'Mon–Sat: 10 AM–2 PM & 5 PM–9 PM · Sun: 11 AM–2 PM (Appointment Only)']
  ];

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-white" edges={['top']}>
      <AppHeader title="Contact Us" subtitle="We'd love to hear from you" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View className="gap-5 mb-8">
          {rows.map(([icon, title, val]) => (
            <View key={title} className="flex-row items-start gap-4">
              <View className="w-11 h-11 rounded-full bg-brand-100 items-center justify-center">
                <Ionicons name={icon} size={18} color="#1d4ed8" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-slate-900 text-sm">{title}</Text>
                <Text className="text-slate-500 text-xs mt-0.5">{val}</Text>
              </View>
            </View>
          ))}
        </View>

        <View className="flex-row gap-3">
          <Button label="Call Now" icon="call" variant="outline" onPress={() => Linking.openURL(`tel:${phone}`)} className="flex-1" />
          <Button label="WhatsApp" icon="logo-whatsapp" variant="whatsapp" onPress={() => Linking.openURL(`https://wa.me/${whatsapp}`)} className="flex-1" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
