import type { BookmarkNode } from '../types';
import { countAll } from './fuzzyMatch';

// A rough, collapse-independent estimate of a card's *expanded* height, in row
// units, used only to balance the masonry columns. It depends on content, not on
// rendered height, so a card's weight never changes when it is collapsed or
// expanded — which keeps the greedy distribution stable (no column-jumping).
export function estimateCardWeight(node: BookmarkNode, linkColumns: number): number {
  const cols = linkColumns > 0 ? linkColumns : 2; // assume ~2 when auto
  let rows = 1; // card header

  const walk = (n: BookmarkNode) => {
    const children = n.children ?? [];
    const links = children.filter((c) => c.url);
    const folders = children.filter((c) => !c.url && c.children && countAll(c) > 0);
    rows += Math.ceil(links.length / cols);
    for (const folder of folders) {
      rows += 1; // folder header row
      walk(folder);
    }
  };
  walk(node);

  return rows;
}

// Greedy "shortest column" distribution: each card, in order, is placed in the
// column with the least accumulated weight (the most empty space). Ties go to the
// lowest-index column. Returns, per column, the original indices it received.
export function distributeGreedy(weights: number[], numColumns: number): number[][] {
  const columns: number[][] = Array.from({ length: numColumns }, () => []);
  const heights = new Array<number>(numColumns).fill(0);

  weights.forEach((weight, index) => {
    let shortest = 0;
    for (let c = 1; c < numColumns; c++) {
      if (heights[c] < heights[shortest]) shortest = c;
    }
    columns[shortest].push(index);
    heights[shortest] += weight;
  });

  return columns;
}
