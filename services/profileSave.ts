import { api, ServerMe } from './api';
import { USE_BACKEND } from './config';
import { MyProfile } from '@/types';

const isLocal = (u: string) => !!u && !/^https?:\/\//.test(u);
// Uploads any photo still on this phone, then saves the profile on the server. Returns the server's version (photos become server links).
export async function saveProfile(me: MyProfile): Promise<ServerMe | null> {
  if (!USE_BACKEND) return null;
  const photos: string[] = [];
  for (const p of me.photos) photos.push(isLocal(p) ? await api.upload(p) : p);
  const r = await api.putMe({ name: me.name, dob: me.dob, bio: me.bio, photos, interests: me.interests, intentions: me.intentions, languages: me.languages, socials: me.socials, visibility: me.visibility, interestedIn: me.interestedIn, gender: me.gender });
  return r.me;
}
// Chat photo: upload and return its server link.
export const uploadImage = (uri: string) => api.upload(uri);
