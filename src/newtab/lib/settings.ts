// User settings, persisted in chrome.storage.sync so they roam across devices.

export type ColumnSetting = 0 | 1 | 2 | 3 | 4; // 0 = responsive auto
export type Density = 'compact' | 'default' | 'comfortable';

export interface Settings {
  columns: ColumnSetting;
  density: Density;
  showPinned: boolean;
  showOther: boolean;
  showMobile: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  columns: 0,
  density: 'default',
  showPinned: true,
  showOther: true,
  showMobile: true,
};

export const SETTINGS_KEY = 'settings';

const DENSITY_SCALE: Record<Density, number> = {
  compact: 0.92,
  default: 1,
  comfortable: 1.12,
};

export function densityScale(density: Density): number {
  return DENSITY_SCALE[density] ?? 1;
}
