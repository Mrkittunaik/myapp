// DEMO MODE ONLY. These are fictional people. Photos: randomuser.me portraits (free demo images).
// They need internet; FadeImage shows a person icon when they cannot load. Replace with bundled images or
// your own storage before release.
import { Profile, Message } from '@/types';
const p = (g: string, n: number) => `https://randomuser.me/api/portraits/${g}/${n}.jpg`;
const mk = (id: string, name: string, age: number, g: string, n: number, bio: string, interests: string[], intentions: string[], socials: any[] = []): Profile => ({
  id, name, age, gender: g === 'women' ? 'Woman' : 'Man', bio, photo: p(g, n), photos: [p(g, n)], interests, intentions, languages: ['English', 'Hindi'], socials,
});
export const DEMO_USERS: Profile[] = [
  mk('u1', 'Aisha', 26, 'women', 44, 'Coffee, climbing and bad puns. New in town.', ['travel', 'fitness', 'food'], ['new_friends', 'friendship'], [{ key: 'instagram', handle: 'aisha.demo', visible: true }]),
  mk('u2', 'Rohan', 29, 'men', 32, 'Indie game dev. Always up for a board game night.', ['gaming', 'tech', 'music'], ['friendship', 'meaningful']),
  mk('u3', 'Meera', 27, 'women', 65, 'Sketchbook in my bag, always. Let us visit a gallery.', ['art', 'books', 'photo'], ['meaningful', 'dating'], [{ key: 'linkedin', handle: 'meera-demo', visible: true }]),
  mk('u4', 'Kabir', 31, 'men', 75, 'Weekend hiker and amateur chef.', ['nature', 'food', 'travel'], ['new_friends'], [{ key: 'youtube', handle: 'kabirtrails', visible: false }]),
  mk('u5', 'Sana', 24, 'women', 12, 'Film student. Ask me about my favourite director.', ['movies', 'music', 'art'], ['dating', 'exploring']),
  mk('u6', 'Dev', 28, 'men', 52, 'Runner. Looking for a training partner.', ['sports', 'fitness', 'tech'], ['friendship']),
  mk('u7', 'Tara', 30, 'women', 90, 'Photographer. Golden hour is my religion.', ['photo', 'travel', 'nature'], ['exploring', 'new_friends']),
];
// distance (m) and bearing (deg) from the current user; real coordinates are derived in discovery.ts
export const DEMO_OFFSETS: Record<string, [number, number]> = {
  u1: [80, 20], u2: [210, 110], u3: [340, 200], u4: [520, 285], u5: [150, 330], u6: [780, 60], u7: [1400, 160],
};
export const DEMO_INCOMING = ['u3', 'u5'];
export const DEMO_CONNECTED = ['u2'];
export const DEMO_MESSAGES: Record<string, Message[]> = {
  u2: [
    { id: 'm1', mine: false, text: 'Hey! Saw we both like board games', at: Date.now() - 3600e3 },
    { id: 'm2', mine: true, text: 'Yes! Any favourites?', at: Date.now() - 3500e3 },
    { id: 'm3', mine: false, text: 'Wingspan, hands down.', at: Date.now() - 3400e3 },
  ],
};
