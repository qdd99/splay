import type { BookmarkNode } from '../types';

export interface FuzzyResult {
  score: number;
  indices: number[];
}

export interface BookmarkMatch extends FuzzyResult {
  field: 'title' | 'url';
}

// fzf-style fuzzy match: characters of `pattern` must appear in `text` in order
// but not necessarily consecutively. Scoring rewards consecutive runs and
// word-start matches so that "ghb" ranks GitHub above other incidental matches.
export function fuzzyMatch(pattern: string, text: string): FuzzyResult | null {
  if (!pattern) return null;
  const p = pattern.toLowerCase();
  const t = text.toLowerCase();
  let pi = 0;
  let score = 0;
  let prevMatch = -2;
  const indices: number[] = [];

  for (let ti = 0; ti < t.length && pi < p.length; ti++) {
    if (t[ti] === p[pi]) {
      indices.push(ti);
      score += 1; // base
      if (prevMatch === ti - 1) score += 5; // consecutive bonus
      if (ti === 0 || /[\s\-_/.:]/.test(text[ti - 1])) score += 3; // word-start bonus
      prevMatch = ti;
      pi++;
    }
  }

  if (pi < p.length) return null;
  return { score, indices };
}

// Best fuzzy match across a bookmark's title and URL. Title is preferred; the
// URL is a fallback so "vercel.com" still matches even when the title differs.
export function fuzzyMatchBookmark(node: BookmarkNode, query: string): BookmarkMatch | null {
  if (!query) return { score: 0, indices: [], field: 'title' };
  const titleMatch = node.title ? fuzzyMatch(query, node.title) : null;
  const urlMatch = node.url ? fuzzyMatch(query, node.url) : null;

  if (titleMatch && urlMatch) {
    return titleMatch.score >= urlMatch.score
      ? { ...titleMatch, field: 'title' }
      : { ...urlMatch, field: 'url' };
  }
  if (titleMatch) return { ...titleMatch, field: 'title' };
  if (urlMatch) return { ...urlMatch, field: 'url' };
  return null;
}

// Total number of bookmarks (leaf links) under a node.
export function countAll(node: BookmarkNode): number {
  if (node.url) return 1;
  return (node.children ?? []).reduce((sum, c) => sum + countAll(c), 0);
}
