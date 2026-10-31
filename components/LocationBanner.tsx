import React from 'react';
import { Banner } from './ui';
import { useLocation, useAllowLocation } from '@/services/location';

// Shown on Home / Nearby whenever location is not available, so the person can always fix it in one tap.
export default function LocationBanner() {
  const loc = useLocation(); const allow = useAllowLocation();
  if (loc.status === 'granted' || loc.status === 'loading') return null;
  const needsSettings = (loc.status === 'denied' && !loc.canAskAgain);
  const text = loc.status === 'disabled' ? 'Device location is off. Turn it on to see real distances.'
    : needsSettings ? 'Location access is blocked. Open settings and allow it for Nearby.'
    : 'Allow location so Nearby can measure distance and direction to people around you.';
  return <Banner icon="location" tone="warn" text={text} action={needsSettings || loc.status === 'disabled' ? 'Fix' : 'Allow'} onAction={allow} />;
}
