import type { BookmarkNode } from '../types';

// Locating Chrome's permanent top-level folders (Bookmarks Bar, Other, Mobile).
//
// Older Chrome gave them fixed ids "1" / "2" / "3". Newer Chrome keeps a signed-in
// account's bookmarks in a separate set of permanent folders with arbitrary ids
// (e.g. "924"), possibly alongside the device-only "1" / "2" / "3" — or with no
// device-only folders at all. The reliable signal is `folderType`; the fixed ids
// are only a fallback for Chrome < 134 and the dev mock.

export type RootKind = 'bookmarks-bar' | 'other' | 'mobile';

const LEGACY_IDS: Record<string, RootKind> = {
  '1': 'bookmarks-bar',
  '2': 'other',
  '3': 'mobile',
};

export function rootKind(node: BookmarkNode): RootKind | null {
  const type = node.folderType;
  if (type === 'bookmarks-bar' || type === 'other' || type === 'mobile') return type;
  if (type === undefined) return LEGACY_IDS[node.id] ?? null;
  return null; // 'managed'
}

// Every top-level folder of a kind, synced (account) folders first.
export function rootsOfKind(topLevel: BookmarkNode[], kind: RootKind): BookmarkNode[] {
  return topLevel
    .filter((n) => rootKind(n) === kind)
    .sort((a, b) => Number(!!b.syncing) - Number(!!a.syncing));
}

// When a kind has both an account and a device-only folder, mark the device-only
// one so the two sections are distinguishable.
export function rootLabel(node: BookmarkNode, group: BookmarkNode[], base: string): string {
  return group.length > 1 && !node.syncing ? `${base} (this device)` : base;
}
