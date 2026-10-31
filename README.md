# Nearby: Expo (React Native) app

## v9: real backend, face scan
See `backend/README.md`. New: live face scan at first login / reinstall (`app/face-scan.tsx`), verified he/she + age cards (`components/VerifiedCard.tsx`), real auth, chat, requests, blocks, uploads. The 112 button is removed. Set `EXPO_PUBLIC_API_URL` and all demo data disappears.
Face scan needs a **development build** (camera + ML Kit are native): `npx expo install expo-dev-client && npx expo run:android`. Run `npm install` first (new packages: expo-camera, expo-image-manipulator, @react-native-ml-kit/face-detection).

## Run
1. Install Node 18+ and the Expo Go app on your Android phone (or Android Studio emulator).
2. In this folder:  `npm install`  then  `npx expo install --fix`  (aligns package versions with your Expo SDK)
3. `npx expo start`  and scan the QR code with Expo Go.

Compass and GPS need a real phone. On an emulator, set a mock location in Extended Controls.

## What works now (demo mode)
Onboarding (saved locally), welcome/signup/login/forgot, 7-step profile wizard, tabs (Home, Nearby radar + list,
Connections, Messages, Profile), preview sheet, full profile, chat, notifications, edit profile, settings,
blocked users, report, legal/help pages, status screens (`/status?kind=network|session|suspended`).
Auth, people and messages are FAKE demo data (services/demoData.ts, services/auth.ts). State persists in AsyncStorage.

## Radar
`services/geo.ts` has real haversine distance + bearing math. Demo people are placed around your GPS fix, then
distance/bearing are computed from coordinates and rotated by device heading (expo-location `watchHeadingAsync`).
If heading is unavailable the radar is north-up and says so. Distances are rounded; coordinates are never displayed.

## Icons / images (free)
Icons: Ionicons via @expo/vector-icons (MIT). Emoji: system emoji. Demo photos: randomuser.me portraits (demo only;
remove before release). Check each license before publishing.

## Before release
- Replace services/auth.ts with Supabase auth; add a typed service per feature (profiles, connections, chat, nearby via PostGIS RPC).
- Never ship service-role keys in the app. Enforce blocks, request rules and visibility in Postgres RLS / edge functions.
- Replace placeholder legal text in app/info.tsx. Add real push notifications (Phase 6).
- Not done yet: Reanimated-based polish, automated tests, search screen, email verification, real-time chat.

## Update notes (UI polish + location + photo preview)
- **Location permission**: one shared `LocationProvider` (services/location.tsx). A permission screen (`app/permission.tsx`) runs after profile setup.
  If location is later denied or off, a banner on Home and Nearby (and a row in Settings) lets the person fix it in one tap.
  Returning from phone Settings re-checks automatically. On Android the "turn on location" system dialog is shown. Foreground ("while using the app") only.
- **Photos**: gallery or camera, make-main star, remove, 6 max. A live profile card (`components/ProfilePreview.tsx`) updates as photos are added,
  in Setup (Photos step, Preview step) and Edit profile. Images shimmer, then fade in (`FadeImage`).
- **Motion**: `components/Motion.tsx` (FadeIn, Pop, Float, PulseRing, press-scale). Uses the built-in Animated API with native driver, no extra deps.
  Respects the phone's "reduce motion" setting. Radar has a smooth compass dial, gliding markers and pulse rings.
- **Fixed**: two syntax errors (onboarding + chat), duplicate prop on profile screen, discovery hiding people when GPS was off, hard-coded Messages badge,
  DOB validation (exact age, auto-formats as you type), missing packages (`expo-asset`, `expo-constants`, `expo-font`, `query-string`).
- Photos picked from the gallery are local URIs. Upload them to storage (e.g. Supabase Storage) before release.

## Update notes (v3: all options working, Android first)
- **New pages**: search, blocked users, privacy and safety, change email, email verification (OTP), about, send feedback, account deleted. Offline banner (netinfo).
- **Chat**: mute, clear chat, delete/copy message, emoji, send photo, typing and "Seen" (replies are automatic demo replies).
- **Messages / Connections / Nearby**: search, mute/delete/block menus, "Say hi", remove/block/report from the connections list.
- **Notifications**: real list filled by your actions (requests, accepts), delete one or clear all, respects the toggles in Settings.
- **Settings**: units (km/mi), change email, change password asks for the current one, delete account needs typing DELETE, log out, support and feedback.
- **Profile**: completeness bar, preview as others see you, share, gender, languages (multi), custom interests, "Show me" filter, photo reorder.
- **Demo codes**: email and reset codes are `123456`. Auto-replies and request accepts are fake.
- **Still needs a backend or extra package**: real sign-in/OTP email, Google/phone login, real people and live chat, photo upload (gallery photos are local paths), push notifications (`expo-notifications` + a development build), real verified badge. Replace `SUPPORT_EMAIL` in `constants/theme.ts` and the placeholder legal text in `app/info.tsx`.

## Update notes (v5: help, safety, home cards, permissions)
- **Notifications**: real phone notifications (`services/notifications.ts`), Android channels, tap-to-open, test button in Settings, new permission screen. Needs a dev build (not Expo Go) to test fully.
- **New pages**: Help center (`app/help.tsx`, live status checks + FAQ), Safety center (`app/safety.tsx`, emergency call, safety tools, tips). Legal pages are now sectioned DRAFT text (`app/info.tsx`), have a lawyer review them.
- **Home cards**: stats row, finish-profile card, daily safety tip. **Chat**: tap-to-use icebreakers.
- **UI/accessibility**: switches are now reachable and labelled for screen readers, warning banner action has readable contrast, chips are 44 px tall, section/banner actions announce as buttons.
- Still demo: auth, people, chat replies. "Who can discover me" is saved but only takes effect once the backend exists.

## Real backend, real radius, background (v8)

**Demo vs real.** With `EXPO_PUBLIC_API_URL` empty the app runs in demo mode (fictional people). Set it in `.env` to your server and the app sends your GPS to the backend and shows the real people around you, each with an exact distance in metres and a compass bearing (`37 m · NE 47°`).

**Run the included test backend** (`backend/`, Node 18+):

    cd backend && npm install && npm start      # http://0.0.0.0:4000
    # in the app folder: .env -> EXPO_PUBLIC_API_URL=http://<your-computer-LAN-IP>:4000
    npx expo start -c

Log in on two phones with different names/emails and they see each other. It uses an in-memory store and a dev login only; swap in real auth and a database (Postgres + PostGIS or Redis GEO) for production.

**API the app already calls** (`services/api.ts`):
`POST /auth/dev-login` · `PUT /me` · `POST /location {lat,lng,accuracy}` · `POST /visibility {visible}` · `GET /nearby?radius=` (returns people with `distance` metres and `bearing` degrees, never their coordinates) · `POST /push-token`.
Still local/demo, to be moved to the backend next: connection requests, chat, blocks/reports, real sign-up/login.

**Background + notifications.** Settings > Location > *Run in background* starts an Android foreground service that keeps posting your location and shows a phone notification when someone comes into range. **This does not work in Expo Go.** Build a development build: `npx expo install expo-dev-client && npx expo run:android` (or `eas build --profile development`). Remote push (the backend notifying you with the app closed) also needs that build plus an EAS `projectId` in `app.json` (`extra.eas.projectId`).

**Accuracy.** Distance is shown to the metre, but phone GPS is usually only accurate to about 5 to 15 m outdoors and worse indoors. Set `EXACT_DISTANCE = false` in `services/config.ts` to go back to rounded (50 m) distances.
