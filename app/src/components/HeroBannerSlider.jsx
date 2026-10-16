import { useEffect, useRef, useState } from 'react';
import { View, Text, Image, FlatList, Dimensions, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const SLIDE_WIDTH = width - 40; // matches px-5 (20px) horizontal padding on each side
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&q=80';

export default function HeroBannerSlider({ banners = [] }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const listRef = useRef(null);
  const timerRef = useRef(null);

  const slides = banners.length > 0 ? banners : [{ id: 'fallback', image_url: FALLBACK_IMAGE, title: null, subtitle: null, cta_text: null, cta_link: null }];

  useEffect(() => {
    if (slides.length <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => {
        const next = (i + 1) % slides.length;
        listRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, [slides.length]);

  const onMomentumEnd = (e) => {
    clearInterval(timerRef.current);
    setIndex(Math.round(e.nativeEvent.contentOffset.x / SLIDE_WIDTH));
  };

  return (
    <View>
      <FlatList
        ref={listRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => String(item.id)}
        snapToInterval={SLIDE_WIDTH}
        decelerationRate="fast"
        onMomentumScrollEnd={onMomentumEnd}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => item.cta_link && router.push(item.cta_link)}
            style={{ width: SLIDE_WIDTH, height: SLIDE_WIDTH * 0.55 }}
            className="rounded-2xl overflow-hidden"
          >
            <Image source={{ uri: item.image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            {(item.title || item.subtitle || item.cta_text) && (
              <View className="absolute inset-0 bg-black/35 justify-end p-4">
                {item.title && <Text className="text-white font-bold text-base mb-0.5" numberOfLines={2}>{item.title}</Text>}
                {item.subtitle && <Text className="text-white/85 text-xs mb-2" numberOfLines={2}>{item.subtitle}</Text>}
                {item.cta_text && (
                  <View className="self-start bg-white rounded-lg px-3 py-1.5">
                    <Text className="text-brand-700 font-semibold text-xs">{item.cta_text}</Text>
                  </View>
                )}
              </View>
            )}
          </Pressable>
        )}
      />

      {slides.length > 1 && (
        <View className="flex-row justify-center gap-1.5 mt-3">
          {slides.map((s, i) => (
            <View key={s.id} className={`h-1.5 rounded-full ${i === index ? 'w-5 bg-brand-600' : 'w-1.5 bg-brand-100'}`} />
          ))}
        </View>
      )}
    </View>
  );
}
