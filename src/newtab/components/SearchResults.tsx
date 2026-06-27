import { useState } from 'react';
import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react';
import type { BookmarkNode } from '../types';
import type { SearchResult } from '../lib/search';
import { faviconURL } from '../lib/favicon';
import { HighlightedText } from './HighlightedText';

function hostOf(url?: string): string {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function ResultRow({
  result,
  onContextMenu,
}: {
  result: SearchResult;
  onContextMenu: (e: ReactMouseEvent, node: BookmarkNode) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const url = result.node.url ?? '';
  const label = result.node.title || url;
  const fav = faviconURL(url, 32);
  const meta = result.path.length ? result.path.join(' › ') : hostOf(url);

  return (
    <a
      className="result nav-item"
      href={url}
      title={url}
      onContextMenu={(e) => onContextMenu(e, result.node)}
    >
      {fav && !imgError ? (
        <img
          className="link-fav"
          src={fav}
          width={16}
          height={16}
          alt=""
          loading="lazy"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="link-fav link-fav--letter" aria-hidden="true">
          {(label[0] ?? '?').toUpperCase()}
        </span>
      )}
      <span className="result-title">
        <HighlightedText text={label} indices={result.matchIndices} />
      </span>
      {meta && <span className="result-meta">{meta}</span>}
    </a>
  );
}

// The search view: a single relevance-ranked list that replaces the directory
// while a query is active. Uses the neutral search-focus accent for highlights.
export function SearchResults({
  results,
  onBookmarkContextMenu,
}: {
  results: SearchResult[];
  onBookmarkContextMenu: (e: ReactMouseEvent, node: BookmarkNode) => void;
}) {
  return (
    <div className="results" style={{ ['--accent']: 'var(--search-focus)' } as CSSProperties}>
      {results.map((r) => (
        <ResultRow key={r.node.id} result={r} onContextMenu={onBookmarkContextMenu} />
      ))}
    </div>
  );
}
