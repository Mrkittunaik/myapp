import React from 'react';
import { useRouter } from 'expo-router';
import { Banner } from './ui';
import { useApp } from '@/services/store';
import { USE_BACKEND } from '@/services/config';
// Shown on Home for anyone whose face has not been verified by the backend yet.
export default function FaceBanner() {
  const r = useRouter(); const a = useApp();
  if (!USE_BACKEND || a.face.status === 'verified') return null;
  return <Banner icon="scan" tone="warn" text={a.face.status === 'rejected' ? 'Your face scan could not be verified.' : 'Your face is not verified yet. Scan your face to appear nearby, connect and chat.'} action="Scan now" onAction={() => r.push('/face-scan')} />;
}
