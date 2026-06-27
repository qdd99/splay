import { useState } from 'react';
import type { HTMLAttributes, MouseEvent as ReactMouseEvent } from 'react';
import type { BookmarkNode } from '../types';
import { faviconURL } from '../lib/favicon';

// A single bookmark link in the directory. Left click navigates the current
// (new) tab; right click opens the bookmark context menu. The favicon comes from
// Chrome's local cache, falling back to a colored letter avatar.
export function BookmarkLink({
  node,
  onContextMenu,
  dragProps,
  dropIndicator,
}: {
  node: BookmarkNode;
  onContextMenu: (e: ReactMouseEvent, node: BookmarkNode) => void;
  dragProps?: HTMLAttributes<HTMLElement> & { draggable?: boolean };
  dropIndicator?: 'before' | 'after' | null;
}) {
  const [imgError, setImgError] = useState(false);
  const url = node.url ?? '';
  const label = node.title || url;
  const fav = faviconURL(url, 32);

  const className =
    'link nav-item' +
    (dropIndicator === 'before' ? ' link--drop-before' : '') +
    (dropIndicator === 'after' ? ' link--drop-after' : '');

  return (
    <a
      className={className}
      href={url}
      title={url}
      onContextMenu={(e) => onContextMenu(e, node)}
      {...dragProps}
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
      <span className="hl-text">{label}</span>
    </a>
  );
}
