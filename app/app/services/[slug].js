import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

import client from '../../src/api/client';
import AppHeader from '../../src/components/AppHeader';
import Button from '../../src/components/Button';
import DoctorCard from '../../src/components/DoctorCard';

export default function ServiceDetail() {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [webViewHeight, setWebViewHeight] = useState(100);
  const [data, setData] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    client
      .get(`/services/${slug}`)
      .then((res) => setData(res.data))
      .catch(() => setData(false));
  }, [slug]);

  if (data === null) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#1d4ed8" size="large" />
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-8">
        <View className="w-16 h-16 rounded-full bg-slate-100 items-center justify-center mb-3">
          <Ionicons name="alert-circle-outline" size={26} color="#94a3b8" />
        </View>
        <Text className="text-slate-500 font-medium text-center">Service not found.</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-brand-600 font-semibold text-sm">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const { service, doctors = [] } = data;
  const isFree = parseFloat(service.base_price) === 0;
  const isFeatured = Number(service.is_featured) === 1;

  const faqs =
    typeof service.faqs_json === 'string'
      ? JSON.parse(service.faqs_json || '[]')
      : service.faqs_json || [];

  const htmlContent = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: #ffffff; }
        body {
          color: #475569;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          font-size: 15px;
          line-height: 1.7;
          overflow-x: hidden;
        }
        h1, h2, h3, h4 { color: #0f172a; line-height: 1.35; margin-top: 18px; margin-bottom: 10px; }
        h1 { font-size: 24px; }
        h2 { font-size: 21px; }
        h3 { font-size: 18px; }
        p { margin: 0 0 14px; }
        strong, b { color: #1e3a8a; }
        a { color: #1d4ed8; text-decoration: none; }
        ul, ol { padding-left: 22px; margin: 0 0 16px; }
        li { margin-bottom: 7px; }
        img { max-width: 100%; height: auto; border-radius: 12px; margin: 10px 0; }
        blockquote { margin: 15px 0; padding: 12px 15px; border-left: 4px solid #2563eb; background: #eff6ff; color: #334155; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
        th { background: #eff6ff; color: #1e3a8a; }
      </style>
    </head>
    <body>
      ${service.description || ''}
      <script>
        function sendHeight() {
          const height = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.offsetHeight
          );
          window.ReactNativeWebView.postMessage(String(height));
        }
        window.addEventListener('load', sendHeight);
        setTimeout(sendHeight, 100);
        setTimeout(sendHeight, 500);
        setTimeout(sendHeight, 1000);
        document.querySelectorAll('img').forEach(img => {
          img.addEventListener('load', sendHeight);
        });
      </script>
    </body>
  </html>
`;

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white" edges={['top']}>
      {/* <AppHeader title={service.name} subtitle={isFree ? 'Free consultation' : `Starting from ₹${Number(service.base_price).toLocaleString('en-IN')}`} /> */}
      <AppHeader title={service.name} subtitle={isFree ? 'Free consultation' : `Fee Dependent on Doctor and Consultation`} />

      <ScrollView contentContainerStyle={{ paddingBottom: 100 + insets.bottom }} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View className="mx-5 mt-4 rounded-2xl overflow-hidden">
          {service.banner_image_url ? (
            <Image source={{ uri: service.banner_image_url }} className="w-full h-48" resizeMode="cover" />
          ) : (
            <View className="w-full h-48 bg-brand-50 items-center justify-center">
              <Text className="text-5xl">🦷</Text>
            </View>
          )}
        </View>

        {/* Info row — normal flow, not overlay */}
        <View className="px-5 mt-3 mb-2">
          <Text className="text-slate-900 font-extrabold text-xl mb-2">{service.name}</Text>

          <View className="flex-row items-center flex-wrap gap-2">
            {isFeatured && (
              <View className="flex-row items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full">
                <Ionicons name="star" size={11} color="#b45309" />
                <Text className="text-[11px] font-bold text-amber-700">Popular</Text>
              </View>
            )}

            {service.duration_minutes ? (
              <View className="flex-row items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-full">
                <Ionicons name="time-outline" size={12} color="#475569" />
                <Text className="text-[11px] font-semibold text-slate-600">{service.duration_minutes} min</Text>
              </View>
            ) : null}

            {/* <View className="flex-row items-center gap-1 bg-brand-50 px-2.5 py-1 rounded-full">
              <Ionicons name="pricetag-outline" size={12} color="#1d4ed8" />
              <Text className="text-[11px] font-semibold text-brand-700">
                {isFree ? 'Free' : `₹${Number(service.base_price).toLocaleString('en-IN')} onwards`}
              </Text>
            </View> */}
          </View>

          {service.short_description ? (
            <Text className="text-slate-500 text-sm leading-5 mt-3">{service.short_description}</Text>
          ) : null}
        </View>

        <View className="px-5">
          {/* Doctors */}
          {doctors.length > 0 && (
            <>
              <View className="flex-row items-center gap-2 mb-3 mt-2">
                <View className="w-7 h-7 rounded-full bg-brand-50 items-center justify-center">
                  <Ionicons name="medkit-outline" size={14} color="#1d4ed8" />
                </View>
                <Text className="font-bold text-slate-900 text-base">Specialists for {service.name}</Text>
              </View>

              <View className="gap-3 mb-6">
                {doctors.map((d) => (
                  <DoctorCard key={d.id} doctor={d} wide style={{ width: '100%' }} />
                ))}
              </View>
            </>
          )}

          {/* Overview */}
          <View className="flex-row items-center gap-2 mb-3 mt-2">
            <View className="w-7 h-7 rounded-full bg-brand-50 items-center justify-center">
              <Ionicons name="document-text-outline" size={14} color="#1d4ed8" />
            </View>
            <Text className="font-bold text-slate-900 text-base">Overview</Text>
          </View>

          <View className="mb-6 bg-slate-50/60 rounded-2xl px-4 pt-1">
            <WebView
              originWhitelist={['*']}
              source={{ html: htmlContent }}
              javaScriptEnabled
              domStorageEnabled
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              automaticallyAdjustContentInsets={false}
              onMessage={(event) => {
                const height = Number(event.nativeEvent.data);
                if (height > 0) setWebViewHeight(height + 10);
              }}
              style={{ backgroundColor: 'transparent', height: webViewHeight }}
            />
          </View>

          {/* FAQs */}
          {faqs.length > 0 && (
            <>
              <View className="flex-row items-center gap-2 mb-3">
                <View className="w-7 h-7 rounded-full bg-brand-50 items-center justify-center">
                  <Ionicons name="help-circle-outline" size={15} color="#1d4ed8" />
                </View>
                <Text className="font-bold text-slate-900 text-base">Frequently Asked Questions</Text>
              </View>

              <View className="gap-2 mb-6">
                {faqs.map((f, i) => {
                  const open = openFaq === i;
                  return (
                    <Pressable
                      key={i}
                      onPress={() => setOpenFaq(open ? null : i)}
                      className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100"
                    >
                      <View className="flex-row justify-between items-center">
                        <Text className="font-semibold text-slate-800 text-sm flex-1 pr-2">{f.q}</Text>
                        <View className="w-6 h-6 rounded-full bg-white items-center justify-center">
                          <Ionicons name={open ? 'remove' : 'add'} size={15} color="#1d4ed8" />
                        </View>
                      </View>

                      {open && (
                        <Text className="text-slate-500 text-xs mt-2.5 leading-5">{f.a}</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Sticky book bar */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-5 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 14), shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: -2 }, elevation: 8 }}>
        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <Text className="text-slate-400 text-[10px]">{isFree ? 'Consultation' : 'At Doctor Choice'}</Text>
            <Text className="text-slate-900 font-extrabold text-base">
              {isFree ? 'Free' : `Fee According to Doctor Choice`}
            </Text>
          </View>
          <View style={{ flex: 1.6 }}>
            <Button
              label="Book This Service"
              icon="calendar"
              onPress={() => router.push(`/appointment?service=${service.slug}`)}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}