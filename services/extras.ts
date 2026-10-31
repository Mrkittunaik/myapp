import { MyProfile, Profile } from '@/types';
import { interestOf } from '@/constants/theme';

// Same checklist as the Profile tab, shared so Home can show the next step too.
export function profileChecks(me: MyProfile): [string, boolean][] {
  return [['Add your name', me.name.trim().length >= 2], ['Add your date of birth', me.dob.length === 10], ['Add a photo', me.photos.length >= 1], ['Write a short bio', me.bio.trim().length >= 10], ['Pick 3 interests', me.interests.length >= 3], ['Add a social link', me.socials.length >= 1]];
}

export const SAFETY_TIPS = [
  'Meet in a busy public place the first time, and tell a friend where you are going.',
  'Keep chatting in the app until you feel comfortable. You never have to share your number or socials.',
  'Nearby shows how far away people are. Do not share your home address or workplace with new people.',
  'If someone makes you uncomfortable, block and report them. It takes two taps.',
  'Trust your instincts. You can leave a conversation or a meeting at any time.',
  'Arrange your own transport to and from a meetup so you can leave when you want.',
];
export const tipOfDay = () => SAFETY_TIPS[Math.floor(Date.now() / 86400000) % SAFETY_TIPS.length];

// Conversation starters: shared interests first, then friendly generic ones.
export function icebreakers(them: Profile, me: MyProfile): string[] {
  const shared = them.interests.filter((i) => me.interests.includes(i)).map((i) => interestOf(i)?.label).filter(Boolean) as string[];
  const out: string[] = [];
  if (shared[0]) out.push(`I saw we both like ${shared[0].toLowerCase()}. What got you into it?`);
  if (shared[1]) out.push(`Fellow ${shared[1].toLowerCase()} fan here. Any recommendations?`);
  out.push(`Hi ${them.name}! What are you up to today?`, 'Any good places around here you would recommend?', 'Hey! Nice to connect. How is your week going?');
  return out.slice(0, 4);
}

// Turns whatever was typed or pasted (a full link, @name, name?x=1) into just the username.
export function cleanHandle(t: string) {
  let v = t.trim().replace(/^https?:\/\//i, '').replace(/^(www\.|m\.)?(instagram\.com|facebook\.com|youtube\.com|linkedin\.com)\//i, '').replace(/^(in|company)\//i, '');
  v = v.split(/[?#]/)[0].replace(/\/+$/, '').replace(/^@/, '');
  return v.replace(/[^A-Za-z0-9._-]/g, '').slice(0, 40);
}
