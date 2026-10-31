import React, { useEffect, useState } from 'react';
import { Field } from './ui';
import { dobError, formatDobInput, isoToDisplay, displayToStored } from '@/services/dob';
// Date of birth typed as DD-MM-YYYY; the app stores YYYY-MM-DD.
export default function DobField({ value, onChange, editable = true, hint }: { value: string; onChange: (stored: string) => void; editable?: boolean; hint?: string }) {
  const [disp, setDisp] = useState(isoToDisplay(value));
  useEffect(() => { if (displayToStored(disp) !== value) setDisp(isoToDisplay(value)); }, [value]);
  const err = dobError(value) || (hint && !value ? hint : undefined);
  return <Field label="Date of birth" value={disp} editable={editable} onChangeText={(v) => { const d = formatDobInput(v); setDisp(d); onChange(displayToStored(d)); }} placeholder="DD-MM-YYYY" keyboardType="number-pad" maxLength={10} error={err} />;
}
