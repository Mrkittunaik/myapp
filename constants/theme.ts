import { Platform } from 'react-native';
export const colors = {
  navy: '#1B1B4B', violet: '#6C4DF6', violetSoft: '#EFEBFF', bg: '#F6F5FB', surface: '#FFFFFF',
  text: '#15152B', muted: '#6B6B85', border: '#E6E4F2',
  success: '#1FA971', warning: '#E8A317', error: '#D9455F',
  online: '#1FA971', friendship: '#1FA971', connection: '#6C4DF6', dating: '#E0488B', exploring: '#6B6B85',
};
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
export const radius = { sm: 5, md: 5, lg: 5, pill: 5 };
export const gradients = {
  primary: ['#7C5CFF', '#5B3DEB'] as [string, string],
  hero: ['#6C4DF6', '#1B1B4B'] as [string, string],
  bg: ['#E9E4FF', '#F4F2FC', '#FFFFFF'] as [string, string, string],
};
export const type = {
  display: { fontSize: 28, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.6 },
  title: { fontSize: 20, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.3 },
  section: { fontSize: 16, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 15, color: colors.text, lineHeight: 22 },
  secondary: { fontSize: 13.5, color: colors.muted, lineHeight: 20 },
  caption: { fontSize: 12, color: colors.muted },
  button: { fontSize: 15.5, fontWeight: '700' as const, letterSpacing: 0.1 },
  distance: { fontSize: 13, fontWeight: '700' as const, fontVariant: ['tabular-nums'] as any },
};
export const shadow = { shadowColor: '#3B2AA8', shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 4 };
// Glass look: translucent white + light border + soft shadow (put over the tinted gradient background)
// Android: an opaque fill, because elevation shadows show through a translucent fill as a grey box.
export const glass = { backgroundColor: Platform.OS === 'android' ? '#FFFFFF' : 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', ...shadow };
export const INTENTS = [
  { key: 'friendship', label: 'Open to Friendship', short: 'Friendship', icon: 'people-outline', color: colors.friendship },
  { key: 'new_friends', label: 'Looking for New Friends', short: 'New friends', icon: 'hand-left-outline', color: '#2B8CE6' },
  { key: 'meaningful', label: 'Open to Meaningful Connections', short: 'Connections', icon: 'heart-outline', color: colors.connection },
  { key: 'dating', label: 'Open to Dating', short: 'Dating', icon: 'heart-circle-outline', color: colors.dating },
  { key: 'exploring', label: 'Just Exploring', short: 'Exploring', icon: 'compass-outline', color: colors.exploring },
];
export const INTERESTS = [
  ['tech','Technology','laptop-outline'],['music','Music','musical-notes-outline'],['movies','Movies','film-outline'],['sports','Sports','football-outline'],['gaming','Gaming','game-controller-outline'],
  ['travel','Travel','airplane-outline'],['food','Food','restaurant-outline'],['fitness','Fitness','barbell-outline'],['art','Art','color-palette-outline'],['books','Books','book-outline'],['photo','Photography','camera-outline'],['nature','Hiking','trail-sign-outline'],
].map(([key, label, icon]) => ({ key, label, icon }));
export const RADII = [100, 250, 500, 1000, 2000];
export const SOCIALS = [
  { key: 'instagram', label: 'Instagram', icon: 'logo-instagram', url: (h: string) => `https://instagram.com/${h}` },
  { key: 'facebook', label: 'Facebook', icon: 'logo-facebook', url: (h: string) => `https://facebook.com/${h}` },
  { key: 'youtube', label: 'YouTube', icon: 'logo-youtube', url: (h: string) => `https://youtube.com/@${h}` },
  { key: 'linkedin', label: 'LinkedIn', icon: 'logo-linkedin', url: (h: string) => `https://linkedin.com/in/${h}` },
];
export const intentOf = (k: string) => INTENTS.find((i) => i.key === k) || INTENTS[4];
export const interestOf = (k: string) => INTERESTS.find((i) => i.key === k) || (k.startsWith('custom:') ? { key: k, label: k.slice(7), icon: 'pricetag-outline' } : undefined);
export const GENDERS = ['Woman', 'Man', 'Non-binary', 'Prefer not to say'];
export const SHOW_ME = ['Everyone', 'Women', 'Men'];
export const LANGS = ['English', 'Hindi', 'Telugu', 'Spanish', 'French'];
// Set EXPO_PUBLIC_SUPPORT_EMAIL (in .env or EAS env) to your real support address. While it is empty,
// the support buttons tell the person it is not set up instead of emailing a placeholder address.
export const SUPPORT_EMAIL: string = process.env.EXPO_PUBLIC_SUPPORT_EMAIL || '';
