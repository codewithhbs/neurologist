import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import client from '../../src/api/client';
import AppHeader from '../../src/components/AppHeader';
import Button from '../../src/components/Button';

export default function BlogDetail() {
  const { slug } = useLocalSearchParams();
  const router = useRouter();

  const [data, setData] = useState(null);
  const [webViewHeight, setWebViewHeight] = useState(300);
  const webviewRef = useRef(null);

  useEffect(() => {
    client
      .get(`/blogs/${slug}`)
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
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="text-slate-400">Article not found.</Text>
      </SafeAreaView>
    );
  }

  const { blog } = data;

  const date = blog.published_at
    ? new Date(blog.published_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * { box-sizing: border-box; -webkit-text-size-adjust: 100%; }
          html, body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #475569;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            font-size: 15px;
            line-height: 1.7;
            width: 100%;
            overflow-x: hidden;
          }
          h1, h2, h3, h4 { color: #0f172a; margin-top: 20px; margin-bottom: 10px; line-height: 1.35; }
          h1 { font-size: 22px; }
          h2 { font-size: 20px; }
          h3 { font-size: 18px; }
          p { margin: 0 0 14px; }
          strong, b { color: #1e3a8a; }
          a { color: #1d4ed8; text-decoration: none; }
          ul, ol { padding-left: 22px; margin-bottom: 16px; }
          li { margin-bottom: 7px; }
          img { max-width: 100%; height: auto; border-radius: 12px; margin: 10px 0; display: block; }
          blockquote { margin: 15px 0; padding: 12px 15px; border-left: 4px solid #2563eb; background: #eff6ff; color: #334155; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
          th { background: #eff6ff; color: #1e3a8a; }
          pre { background: #f1f5f9; padding: 12px; border-radius: 8px; overflow-x: auto; }
        </style>
      </head>
      <body id="content-body">
        ${blog.content || ''}
        <script>
          function sendHeight() {
            var height = document.getElementById('content-body').scrollHeight;
            window.ReactNativeWebView.postMessage(String(height));
          }
          window.onload = sendHeight;
          window.addEventListener('resize', sendHeight);
          setTimeout(sendHeight, 300);
          setTimeout(sendHeight, 800);
          var imgs = document.getElementsByTagName('img');
          for (var i = 0; i < imgs.length; i++) {
            imgs[i].onload = sendHeight;
          }
        </script>
      </body>
    </html>
  `;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <AppHeader title="Article" subtitle={blog.title} showBack />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {blog.cover_image_url && (
          <Image
            source={{ uri: blog.cover_image_url }}
            className="w-full h-44 rounded-2xl mb-5"
            resizeMode="cover"
          />
        )}

        {blog.category_name && (
          <Text className="text-brand-600 text-xs font-bold uppercase mb-2">
            {blog.category_name}
          </Text>
        )}

        <Text className="text-2xl font-extrabold text-slate-900 mb-2">
          {blog.title}
        </Text>

        <Text className="text-slate-400 text-xs mb-5">
          {date}
          {blog.author_name ? ` · ${blog.author_name}` : ''}
        </Text>

        <View className="mb-8" style={{ height: webViewHeight }}>
          <WebView
            ref={webviewRef}
            originWhitelist={['*']}
            source={{ html: htmlContent }}
            javaScriptEnabled
            domStorageEnabled
            nestedScrollEnabled={false}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            style={{ backgroundColor: 'transparent', flex: 1 }}
            onMessage={(event) => {
              const height = parseInt(event.nativeEvent.data, 10);
              if (!isNaN(height) && height > 0) {
                setWebViewHeight(height);
              }
            }}
            onShouldStartLoadWithRequest={(request) => {
              if (
                request.url !== 'about:blank' &&
                !request.url.startsWith('data:')
              ) {
                Linking.openURL(request.url);
                return false;
              }
              return true;
            }}
          />
        </View>

        <View className="bg-brand-700 rounded-2xl p-5">
          <Text className="text-white font-bold mb-1">
            Need an Appointment?
          </Text>

          <Text className="text-brand-100 text-xs mb-4">
            Book your appointment today for a healthy smile.
          </Text>

          <Button
            label="Book Now"
            onPress={() => router.push('/appointment')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}