import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { BookmarkNode } from '../types';
import { countAll } from '../lib/fuzzyMatch';
import { ChevronIcon } from './Icons';
import { LinkGrid } from './LinkGrid';
import { CollapsibleFolder } from './CollapsibleFolder';
import { useDrag } from './DragProvider';
import type { BookmarkActions } from '../hooks/useBookmarkActions';

// Other Bookmarks / Mobile Bookmarks → a muted section below the divider, in a
// 2-column layout. Uses the neutral section accent rather than a category color.
export function TopLevelSection({
  section,
  label,
  actions,
}: {
  section: BookmarkNode;
  label: string;
  actions: BookmarkActions;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const drag = useDrag();

  if (countAll(section) === 0) return null;

  const children = section.children ?? [];
  const directLinks = children.filter((c) => c.url);
  const subFolders = children.filter((c) => !c.url && c.children).filter((f) => countAll(f) > 0);

  const headerClass =
    'card-header' +
    (collapsed ? ' card-header--collapsed' : '') +
    (drag.isFolderDropTarget(section.id) ? ' card-header--drop' : '');

  return (
    <div className="card" style={{ ['--accent']: 'var(--section-accent)' } as CSSProperties}>
      <div
        className={headerClass}
        onClick={() => setCollapsed((c) => !c)}
        {...drag.folderDropProps(section.id)}
      >
        <div className="card-header-left">
          <span className="card-title card-title--section">{label}</span>
        </div>
        <ChevronIcon collapsed={collapsed} />
      </div>
      {!collapsed && (
        <div className="card-body">
          <LinkGrid
            bookmarks={directLinks}
            parent={section}
            onBookmarkContextMenu={actions.onBookmarkContextMenu}
          />
          {subFolders.map((sf) => (
            <CollapsibleFolder
              key={sf.id}
              folder={sf}
              depth={2}
              defaultOpen={true}
              actions={actions}
            />
          ))}
        </div>
      )}
    </div>
  );
}
