export type Social = { key: string; handle: string; visible: boolean };
export type Profile = {
  id: string; name: string; age?: number; gender?: string; bio: string; photo: string; photos: string[];
  interests: string[]; intentions: string[]; languages: string[]; socials: Social[];
  // Set by the backend after the face scan. When `verified` is true, gender and age are the scan result, not what the person typed.
  verified?: boolean; pronoun?: 'he' | 'she'; ageEstimated?: boolean;
};
export type MyProfile = Omit<Profile, 'id' | 'age' | 'gender' | 'verified' | 'pronoun' | 'ageEstimated'> & { dob: string; visibility: 'everyone' | 'connections' | 'nobody'; language: string; gender: string; interestedIn: string };
export type FaceStatus = 'none' | 'verified' | 'rejected';
export type FaceState = { status: FaceStatus; gender: string | null; age: number | null };
export type ReqState = 'none' | 'sent' | 'incoming' | 'connected';
export type Nearby = { user: Profile; distance: number; bearing: number; rel: number };
export type Message = { id: string; mine: boolean; text: string; at: number; image?: string; pending?: boolean; failed?: boolean };
export type NotifKind = 'nearby' | 'requests' | 'messages' | 'system';
export type Notif = { id: string; kind: NotifKind; icon: string; t: string; at: number; read: boolean; to: string };
export type Report = { id: string; reason: string; at: number };
