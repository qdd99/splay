// User settings, persisted in chrome.storage.sync so they roam across devices.

export type ColumnSetting = 0 | 1 | 2 | 3 | 4; // 0 = responsive auto
export type Density = 'compact' | 'default' | 'comfortable';

export interface Settings {
  columns: ColumnSetting; // page (masonry) columns; 0 = auto
  cardColumns: ColumnSetting; // link columns within each card; 0 = auto
  density: Density;
  showPinned: boolean;
  showOther: boolean;
  showMobile: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  columns: 0,
  cardColumns: 0,
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

// grid-template-columns for a card's link grid. Auto packs responsively;
// a fixed value forces exactly that many columns.
export function linkGridTemplate(cols: ColumnSetting): string {
  return cols > 0
    ? `repeat(${cols}, minmax(0, 1fr))`
    : 'repeat(auto-fill, minmax(150px, 1fr))';
}
