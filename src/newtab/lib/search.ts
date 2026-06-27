import type { BookmarkNode } from '../types';
import { fuzzyMatchBookmark } from './fuzzyMatch';

export interface SearchResult {
  node: BookmarkNode;
  matchIndices: number[] | null; // title highlight positions, or null when matched via URL
  path: string[]; // breadcrumb of ancestor folder names
  score: number;
}

// Flattens the whole tree into a single relevance-ranked list of matching
// bookmarks. Unlike the directory view, results are sorted globally by fuzzy
// score (best first), not kept in their original folder order. Loose links on
// the Bookmarks Bar have no breadcrumb; Other/Mobile bookmarks are prefixed with
// their section name.
export function searchBookmarks(root: BookmarkNode, query: string): SearchResult[] {
  if (!query) return [];
  const results: SearchResult[] = [];

  const walk = (node: BookmarkNode, path: string[]) => {
    for (const child of node.children ?? []) {
      if (child.url) {
        const m = fuzzyMatchBookmark(child, query);
        if (m) {
          results.push({
            node: child,
            matchIndices: m.field === 'title' ? m.indices : null,
            path,
            score: m.score,
          });
        }
      } else if (child.children) {
        walk(child, [...path, child.title]);
      }
    }
  };

  const top = root.children ?? [];
  for (const section of top) {
    if (!section.children) continue;
    // Bookmarks Bar (id "1") is the implicit home — no breadcrumb prefix.
    const prefix = section.id === '1' ? [] : [section.title];
    walk(section, prefix);
  }

  return results.sort(
    (a, b) => b.score - a.score || (a.node.title?.length ?? 0) - (b.node.title?.length ?? 0),
  );
}
