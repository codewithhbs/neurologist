# DHIC Mobile App — Neurocare Clinic

React Native + Expo (SDK 52, Expo Router 4, NativeWind for Tailwind-style styling). Connects to the same `dhic-backend` used by the website and admin panel.

## Setup

1. `npm install`
2. Set your backend URL — either:
   - Edit `app.json` → `expo.extra.apiUrl` (simplest for local dev), or
   - Copy `.env.example` → `.env` and set `EXPO_PUBLIC_API_URL` (takes priority if set).
   - **Important**: use your machine's LAN IP (e.g. `http://192.168.1.100:5000/api`), not `localhost`, when testing on a physical device or Expo Go — the phone can't reach your computer's `localhost`.
3. `npx expo start` → scan the QR with Expo Go, or press `w` for web, `a`/`i` for Android/iOS simulators.

## What's different from the website
- **Guest browsing**: on first login screen, users can tap "Continue as Guest" to browse services, doctors, blog, offers, reviews without logging in. Booking confirmation and the Profile tab are gated behind OTP login (`src/components/GuestGate.jsx`) — guests get a friendly prompt instead of being blocked outright.
- **Onboarding slider**: shown once on first launch, slides are fetched live from the backend (`GET /api/onboarding-slides`) so the clinic can update them anytime from the admin panel ("App Onboarding" section) without an app update. Falls back to built-in slides if the API is unreachable.
- **Native-feeling booking flow**: same Service → Doctor → Date/Time → Confirm steps as the web wizard, but with a horizontal date strip (next 21 days) instead of a calendar input, and Razorpay Checkout runs inside a WebView bridge (`src/components/RazorpayCheckout.jsx`) since the managed Expo workflow doesn't support the native Razorpay SDK without a custom dev client.
- **SecureStore** instead of cookies for the patient JWT and guest-mode flag (`src/api/client.js`).

## Structure
- `app/` — Expo Router file-based routes. `(tabs)/` holds the 5 bottom-tab screens (Home, Services, Doctors, Blog, Profile); everything else (`doctors/[slug]`, `services/[slug]`, `blog/[slug]`, `appointment`, `offers`, `reviews`, `contact`, `login`, `onboarding`) is pushed on top as stack screens.
- `src/context/AuthContext.js` — patient session, guest mode, and "has seen onboarding" state, all persisted via `expo-secure-store`.
- `src/api/client.js` — axios instance, reads API URL from `EXPO_PUBLIC_API_URL` or `app.json`'s `extra.apiUrl`.
- `src/components/` — shared UI: Button, cards (Doctor/Service/Blog/Testimonial), AppHeader, GuestGate, RazorpayCheckout.

## Verified
This app was bundled end-to-end with `npx expo export --platform web` (840 modules, zero errors) to catch dependency and syntax issues before delivery. Note: `nativewind` is pinned to `4.1.6` (not the latest `^4.1.23` range) because newer versions pull in `react-native-css-interop` releases that require `react-native-worklets`, which isn't yet compatible with Expo SDK 52 / React Native 0.76. Bump it once the ecosystem catches up.

## Building for real devices
This app was validated via web bundling only (no device/simulator available in this environment). Before shipping:
1. `npx expo start` and test on Expo Go for both iOS and Android.
2. For production builds, set up EAS (`npx eas build`) — you'll need to add the Razorpay live key, a proper `expo-asset`/icon set, and configure `app.json`'s `ios.bundleIdentifier` / `android.package` if different from the placeholders already set (`in.hovermedia.dhic`).
