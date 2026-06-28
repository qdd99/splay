// Category accent palette from the Splay design language. Each accent ships as
// a trio so it works as a dot (base), a letter-tile background (soft), and the
// tile letter / accent text (deep).
export interface Accent {
  name: string;
  base: string;
  soft: string;
  deep: string;
}

export const ACCENTS: Accent[] = [
  { name: 'indigo', base: '#5b73c4', soft: '#e9ecf8', deep: '#41569f' },
  { name: 'teal', base: '#2f9e9b', soft: '#e1f0ef', deep: '#1f7a77' },
  { name: 'plum', base: '#c2638f', soft: '#f6e7ef', deep: '#a44b73' },
  { name: 'clay', base: '#bf8a4e', soft: '#f3ecdd', deep: '#946531' },
  { name: 'sky', base: '#5b9bd6', soft: '#e4eff8', deep: '#3f78ad' },
  { name: 'sage', base: '#5d9568', soft: '#e5efe6', deep: '#3f7350' },
  { name: 'violet', base: '#8a6fc0', soft: '#efe9f7', deep: '#684aa0' },
];

// Pinned Bookmarks Bar uses indigo; system folders (Other / Mobile) use a warm
// neutral so they read as built-in rather than user categories.
export const PINNED_ACCENT: Accent = ACCENTS[0];
export const NEUTRAL_ACCENT: Accent = {
  name: 'neutral',
  base: '#8b8693',
  soft: '#efece7',
  deep: '#6f6a77',
};

export function accentByName(name: string): Accent | undefined {
  return ACCENTS.find((a) => a.name === name);
}

// Inline custom properties published on a card so its dot, letter tiles, folder
// headers, and highlights all inherit the accent trio.
export function accentVars(accent: Accent): Record<string, string> {
  return {
    '--accent': accent.base,
    '--accent-soft': accent.soft,
    '--accent-deep': accent.deep,
  };
}
