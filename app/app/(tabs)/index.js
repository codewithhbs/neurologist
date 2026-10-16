import { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, ScrollView, Pressable, RefreshControl, Linking, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import client from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';
import ServiceCard from '../../src/components/ServiceCard';
import DoctorCard from '../../src/components/DoctorCard';
import TestimonialCard from '../../src/components/TestimonialCard';
import HeroBannerSlider from '../../src/components/HeroBannerSlider';

/* ---- assets ---- */
const MASCOT = require('../../assets/tooth-mascot.png');

/* ---- website palette ---- */
const NAVY = '#1e3a8a';
const BLUE = '#2563eb';
const BLUE_SOFT = '#3b82f6';
const BG = '#f5f8ff';

const QUICK_LINKS = [
  { label: 'Book\nAppointment', icon: 'calendar', href: '/appointment', bg: '#eff6ff', color: '#2563eb' },
  { label: 'Find\nDoctors', icon: 'medkit', href: '/(tabs)/doctors', bg: '#ecfdf5', color: '#059669' },
  { label: 'Offers &\nPackages', icon: 'pricetag', href: '/offers', bg: '#f5f3ff', color: '#7c3aed' },
  { label: 'Contact\nUs', icon: 'headset', href: '/contact', bg: '#fff7ed', color: '#ea580c' },
];

export default function Home() {
  const router = useRouter();
  const { patient, isGuest } = useAuth();
  const [settings, setSettings] = useState({});
  const [services, setServices] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [banners, setBanners] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [s, sv, d, r, b] = await Promise.all([
      client.get('/settings').catch(() => ({ data: { settings: {} } })),
      client.get('/services').catch(() => ({ data: { services: [] } })),
      client.get('/doctors').catch(() => ({ data: { doctors: [] } })),
      client.get('/reviews?featured=1').catch(() => ({ data: { reviews: [] } })),
      client.get('/hero-banners').catch(() => ({ data: { banners: [] } })),
    ]);
    setSettings(s.data.settings || {});
    setServices((sv.data.services || []).filter((x) => x.is_featured).slice(0, 8));
    setDoctors((d.data.doctors || []).slice(0, 6));
    setReviews((r.data.reviews || []).slice(0, 5));
    setBanners(b.data.banners || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const firstName = patient?.name ? patient.name.split(' ')[0] : null;
  const greeting = firstName ? `Hello, ${firstName}!` : isGuest ? 'Welcome, Guest!' : 'Welcome!';
  const siteName = settings.site_name || 'Dental Health Care';
  const subName = settings.site_sub_name || '& Implant Centre';
  const tagline = settings.site_tagline || 'Your Smile, Our Priority';
  const happyPatients = settings.happy_patients || '2000+';
  const experience = settings.experience_years || '10+';
  const phone = settings.phone || '9716590959';
  const whatsapp = settings.whatsapp || '918527271759';
  const logo = settings.logo_url || settings.logo || null;

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      <SafeAreaView edges={['top']} style={{ backgroundColor: NAVY }} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />}
      >
        {/* ===================== HERO ===================== */}
        <View
          style={{
            backgroundColor: NAVY,
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: 68,
            overflow: 'hidden',
          }}
        >
          {/* decorative blobs */}
          <View style={{ position: 'absolute', top: -70, right: -50, width: 200, height: 200, borderRadius: 999, backgroundColor: BLUE_SOFT, opacity: 0.28 }} />
          <View style={{ position: 'absolute', bottom: -60, left: -45, width: 165, height: 165, borderRadius: 999, backgroundColor: BLUE, opacity: 0.26 }} />

          {/* ---- MASCOT ---- */}
          <Image
            source={MASCOT}
            resizeMode="contain"
            pointerEvents="none"
            style={{
              position: 'absolute',
              right: -14,
              top: 74,
              zIndex: 99,
              width: 148,
              height: 128,
              opacity: 0.95,
            }}
          />

          {/* ---- Logo + App name ---- */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 38, height: 38, borderRadius: 15, backgroundColor: '#fff',
                alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 5,
              }}
            >
              <Image
                source={logo ? { uri: logo } : MASCOT}
                style={{ width: 28, height: 28 }}
                resizeMode="contain"
              />
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text numberOfLines={2} style={{ color: '#fff', fontSize: 12.5, fontWeight: '800', }}>
                {siteName}
              </Text>
              <Text numberOfLines={1} style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>
                {subName}
              </Text>
            </View>

            <Pressable
              onPress={() => Linking.openURL(`tel:${phone}`)}
              style={{ width: 30, height: 30, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}
            >
              <Ionicons name="call" size={14} color="#fff" />
            </Pressable>
          </View>

          {/* ---- Tagline + greeting (right padding so mascot never overlaps) ---- */}
          <View style={{ paddingRight: 128 }}>
            <Text style={{ color: '#93c5fd', fontSize: 10.5, fontWeight: '700', letterSpacing: 1.4, marginTop: 26 }}>
              {tagline.toUpperCase()}
            </Text>
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 8, lineHeight: 31 }}>
              {greeting}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.78)', fontSize: 12.5, marginTop: 6, lineHeight: 18 }}>
              How can we help you smile today?
            </Text>
          </View>

          {/* ---- Search ---- */}
          <Pressable
            onPress={() => router.push('/(tabs)/services')}
            style={{
              marginTop: 20,
              position: 'relative',
              zIndex: 999,
              backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 16,
              paddingHorizontal: 14, height: 46, flexDirection: 'row', alignItems: 'center',
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
            }}
          >
            <Ionicons name="search" size={17} color="rgba(255,255,255,0.85)" />
            <Text style={{ color: 'rgba(255,255,255,0.85)', marginLeft: 10, fontSize: 13 }}>
              Search treatments, doctors…
            </Text>
          </Pressable>

          {/* ---- Stats ---- */}
          <View style={{ flexDirection: 'row', marginTop: 22 }}>
            <Stat value={experience} label="Years of Experience" />
            <Divider />
            <Stat value={happyPatients} label="Happy Patients" />
            <Divider />
            <Stat value="100%" label="Patient Satisfaction" />
          </View>
        </View>

        {/* ============ FLOATING BOOK CARD ============ */}
        <View style={{ paddingHorizontal: 20, marginTop: -46 }}>
          <Pressable
            onPress={() => router.push('/appointment')}
            style={{
              backgroundColor: '#fff', borderRadius: 22, padding: 16,
              flexDirection: 'row', alignItems: 'center',
              shadowColor: NAVY, shadowOpacity: 0.14, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 6,
            }}
          >
            <View style={{ width: 46, height: 46, borderRadius: 15, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="calendar" size={21} color="#fff" />
            </View>
            <View style={{ flex: 1, marginLeft: 13 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a' }}>Book an Appointment</Text>
              <Text style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>Choose service, doctor & time slot</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </Pressable>
        </View>

        {/* ============ QUICK LINKS ============ */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 22 }}>
          {QUICK_LINKS.map((item) => (
            <Pressable key={item.label} onPress={() => router.push(item.href)} style={{ width: '23%', alignItems: 'center' }}>
              <View style={{ width: 56, height: 56, borderRadius: 20, backgroundColor: item.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={item.icon} size={24} color={item.color} />
              </View>
              <Text style={{ fontSize: 10.5, fontWeight: '600', color: '#334155', textAlign: 'center', lineHeight: 14, marginTop: 8 }}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ============ BANNERS ============ */}
        {banners.length > 0 && (
          <View style={{ marginTop: 24, paddingHorizontal: 20 }}>
            <HeroBannerSlider banners={banners} />
          </View>
        )}

        {/* ============ SERVICES ============ */}
        <Section title="Our Treatments" subtitle="Featured services" onViewAll={() => router.push('/(tabs)/services')}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20 }}>
            {services.map((item) => (
              <View key={String(item.id)} style={{ width: '48%', marginBottom: 12 }}>
                <ServiceCard service={item} />
              </View>
            ))}
          </View>
        </Section>

        {/* ============ DOCTORS ============ */}
        <Section title="Meet Our Doctors" subtitle="Experienced specialists" onViewAll={() => router.push('/(tabs)/doctors')}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            {doctors.map((item, idx) => (
              <View key={String(item.id)} style={{ marginRight: idx === doctors.length - 1 ? 0 : 12 }}>
                <DoctorCard doctor={item} />
              </View>
            ))}
          </ScrollView>
        </Section>

        {/* ============ REVIEWS ============ */}
        {reviews.length > 0 && (
          <Section title="What Patients Say" subtitle="Real stories, real smiles">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
              {reviews.map((item, idx) => (
                <View key={String(item.id)} style={{ marginRight: idx === reviews.length - 1 ? 0 : 12 }}>
                  <TestimonialCard review={item} />
                </View>
              ))}
            </ScrollView>
          </Section>
        )}

        {/* ============ CTA ============ */}
        <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
          <View style={{ backgroundColor: NAVY, borderRadius: 24, padding: 20, overflow: 'hidden' }}>
            <View style={{ position: 'absolute', top: -45, right: -35, width: 140, height: 140, borderRadius: 999, backgroundColor: BLUE, opacity: 0.35 }} />
            <Image
              source={MASCOT}
              resizeMode="contain"
              pointerEvents="none"
              style={{ position: 'absolute', right: -10, bottom: -18, width: 86, height: 110, opacity: 0.5 }}
            />
            <View style={{ paddingRight: 66 }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Need help choosing a treatment?</Text>
              <Text style={{ color: 'rgba(255,255,255,0.78)', fontSize: 12, marginTop: 5, marginBottom: 16 }}>
                Call us or chat on WhatsApp — we're here to help.
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => Linking.openURL(`tel:${phone}`)}
                style={{ flex: 1, height: 46, borderRadius: 14, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="call" size={16} color={NAVY} />
                <Text style={{ color: NAVY, fontWeight: '700', marginLeft: 7, fontSize: 13.5 }}>Call Now</Text>
              </Pressable>
              <Pressable
                onPress={() => Linking.openURL(`https://wa.me/${whatsapp}`)}
                style={{ flex: 1, height: 46, borderRadius: 14, backgroundColor: '#25D366', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="logo-whatsapp" size={17} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', marginLeft: 7, fontSize: 13.5 }}>WhatsApp</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <Text style={{ textAlign: 'center', color: '#94a3b8', fontSize: 11, marginTop: 26 }}>
          {siteName} {subName} • {tagline}
        </Text>
      </ScrollView>
    </View>
  );
}

/* ---------- local components ---------- */

function Stat({ value, label }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: 'rgba(255,255,255,0.68)', fontSize: 10, marginTop: 3 }} numberOfLines={2}>{label}</Text>
    </View>
  );
}

function Divider() {
  return <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 12, marginVertical: 2 }} />;
}

function Section({ title, subtitle, onViewAll, children }) {
  return (
    <View style={{ marginTop: 26 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 13 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16.5, fontWeight: '800', color: '#0f172a' }}>{title}</Text>
          {!!subtitle && <Text style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>{subtitle}</Text>}
        </View>
        {!!onViewAll && (
          <Pressable onPress={onViewAll} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: BLUE, fontSize: 12, fontWeight: '700' }}>View All</Text>
            <Ionicons name="chevron-forward" size={14} color={BLUE} />
          </Pressable>
        )}
      </View>
      {children}
    </View>
  );
}