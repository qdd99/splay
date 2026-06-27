// Category accent colors. Cycled per top-level folder and used for the card's
// left border, hover tint, fuzzy-match highlight, and letter avatars.
export const ACCENT_COLORS = [
  '#4361EE', // blue
  '#2EC4B6', // teal
  '#E07A36', // amber
  '#7C3AED', // violet
  '#E05577', // rose
  '#0EA5E9', // sky
  '#84922E', // olive
  '#D946A8', // fuchsia
  '#2563EB', // royal
  '#059669', // emerald
  '#DC2626', // red
] as const;

export function accentFor(index: number): string {
  return ACCENT_COLORS[index % ACCENT_COLORS.length];
}
