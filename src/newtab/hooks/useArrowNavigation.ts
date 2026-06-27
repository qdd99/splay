import { useEffect } from 'react';

const ARROWS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

// Spatial arrow-key navigation between bookmark links. Tab/Shift+Tab and Enter
// already work natively on the anchors; this adds 2-D movement: from the focused
// link, focus the nearest visible link in the pressed direction. Inert unless a
// link currently holds focus, so typing in the search box is unaffected.
export function useArrowNavigation(): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!ARROWS.includes(e.key) || e.metaKey || e.ctrlKey || e.altKey) return;
      const active = document.activeElement as HTMLElement | null;
      if (!active || !active.classList.contains('nav-item')) return;

      e.preventDefault();
      const links = Array.from(document.querySelectorAll<HTMLElement>('a.nav-item'));
      const cur = active.getBoundingClientRect();
      const cx = cur.left + cur.width / 2;
      const cy = cur.top + cur.height / 2;
      const horizontal = e.key === 'ArrowLeft' || e.key === 'ArrowRight';

      let best: HTMLElement | null = null;
      let bestScore = Infinity;

      for (const link of links) {
        if (link === active) continue;
        const r = link.getBoundingClientRect();
        const dx = r.left + r.width / 2 - cx;
        const dy = r.top + r.height / 2 - cy;

        if (e.key === 'ArrowRight' && dx <= 1) continue;
        if (e.key === 'ArrowLeft' && dx >= -1) continue;
        if (e.key === 'ArrowDown' && dy <= 1) continue;
        if (e.key === 'ArrowUp' && dy >= -1) continue;

        // Favor closeness along the travel axis, penalize cross-axis drift.
        const primary = horizontal ? Math.abs(dx) : Math.abs(dy);
        const cross = horizontal ? Math.abs(dy) : Math.abs(dx);
        const score = primary + cross * 2;
        if (score < bestScore) {
          bestScore = score;
          best = link;
        }
      }

      best?.focus();
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);
}
