# Nearby v6: fixes applied from the v5 audit

Checked after the changes: `tsc --noEmit` has 0 errors (v5 had 3), `npm ci` is in sync, and `expo export --platform android` bundles.
Not checked: no device or emulator, so layout and keyboard items marked (verify) still need a quick look on a phone.

## High (all 8 fixed)
- H1 package-lock.json regenerated (`npm ci` passes). Added `expo-file-system` as an explicit dependency.
- H2 Support email is no longer a placeholder. Set `EXPO_PUBLIC_SUPPORT_EMAIL` (see `.env.example`). While empty, the support buttons show "Support email is not set up yet".
- H3 `report(id, reason)` now saves a report (in `reports`, included in data export) and hides the person from discovery, search, lists and badges. Report from chat or profile then goes back.
- H4 "Call 112" is red: `Btn` skips the violet gradient when a background colour is passed.
- H5 Toasts show while a Sheet or Dialog is open (each Modal renders its own toast at the top; the app-level one hides meanwhile).
- H6 Android Back in setup goes one step back.
- H7 Permission and Onboarding scroll and shrink their artwork on short screens.
- H8 Blocking from Messages asks for confirmation.

## Medium (21 of 22 fixed, M13/M15/M16 need a device check)
M1 tab bar hides with keyboard · M2 radar stops when Nearby is not focused · M3 Connections tile opens Connections · M4 list/radar icon swaps · M5 Nearby search uses labels · M6 chips wrap · M7 fake online dots removed · M8 chats sort by latest message · M9 day/Yesterday/date in lists + day separators in chat · M10 profile button in chat header · M11 forgot password calls a reset service, Back goes one step · M12 setup "Edit..." returns to preview · M13 Android uses opaque cards (no grey shadow box) · M14 offline banner can be hidden · M15 sheets lift above keyboard · M16 KeyboardAvoidingView only pads on iOS · M17 your own actions no longer fire phone banners · M18 chat replies and a nearby alert now notify (respecting toggles) · M19 picked photos are copied to document storage · M20 search follows Show me, radius and hidden people, autofocus · M21 date of birth locks once saved · M22 Save explains why it is disabled.

## Low (fixed)
L1 `id` prop on navigators · L2 onboarding avatars are local (demo people still use randomuser.me, offline shows an icon) · L3 +not-found and ErrorBoundary · L4 dead code removed · L5 L6 tab bar · L8 L9 refresh toast and skeleton · L10 stale selection · L11 L12 L13 L18 L30 accessibility · L15 profile banner under status bar · L16 L17 settings confirm + confirm-password · L19 L20 signup autocapitalize, DD-MM-YYYY date entry · L21 Retry re-checks the network · L22 gutters · L23 L24 header and delete-X · L25 radar offset + distance labels on rings · L26 L27 L28 sheet buttons, photo tiles, photo viewer close · L29 one photo per demo profile · L31 honest feedback toast · L32 handle cleaner · L33 heading cleared · L34 interest duplicates · L35 checklist deduped · L36 stale invite notification · L37 L38 distance and time text.

## Still open (needs a decision or a backend)
- Demo images still load from randomuser.me; bundle or host your own before release.
- L7 tap active tab to scroll to top · L21 `session`/`suspended` status screens are unused · pending-email state in change-email · real auth, chat, push, presence, moderation, photo upload.
- Zoom in the photo viewer (Android has no built-in pinch zoom in a plain ScrollView).
