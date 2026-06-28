import { useEffect, useState } from 'react';
import type { ColumnSetting } from '../lib/settings';

// Effective number of masonry columns. A fixed setting (1–4) is used as-is;
// "Auto" (0) adapts to the viewport width with the same breakpoints the CSS
// multi-column layout used before.
function autoColumns(): number {
  if (typeof window === 'undefined') return 3;
  const w = window.innerWidth;
  if (w <= 700) return 1;
  if (w <= 1100) return 2;
  return 3;
}

export function useColumnCount(setting: ColumnSetting): number {
  const [auto, setAuto] = useState(autoColumns);

  useEffect(() => {
    if (setting > 0) return;
    const onResize = () => setAuto(autoColumns());
    setAuto(autoColumns());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [setting]);

  return setting > 0 ? setting : auto;
}
