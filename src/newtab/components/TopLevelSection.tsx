import type { CSSProperties } from 'react';
import type { BookmarkNode } from '../types';
import { NEUTRAL_ACCENT, accentVars } from '../lib/accent';
import { countAll } from '../lib/fuzzyMatch';
import { ChevronIcon } from './Icons';
import { LinkGrid } from './LinkGrid';
import { CollapsibleFolder } from './CollapsibleFolder';
import { useDrag } from './DragProvider';
import { useCollapse } from './CollapseProvider';
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
  const drag = useDrag();
  const collapse = useCollapse();
  const collapsed = collapse.isCollapsed(section.id, false);

  if (countAll(section) === 0) return null;

  const children = section.children ?? [];
  const directLinks = children.filter((c) => c.url);
  const subFolders = children.filter((c) => !c.url && c.children).filter((f) => countAll(f) > 0);

  const headerClass =
    'card-header' + (drag.isFolderDropTarget(section.id) ? ' card-header--drop' : '');

  return (
    <div className="card" style={accentVars(NEUTRAL_ACCENT) as CSSProperties}>
      <div
        className={headerClass}
        onClick={() => collapse.toggle(section.id, false)}
        {...drag.folderDropProps(section.id)}
      >
        <div className="card-header-left">
          <span className="card-dot" />
          <span className="card-title">{label}</span>
        </div>
        <div className="card-header-right">
          <ChevronIcon collapsed={collapsed} />
        </div>
      </div>
      {!collapsed && (
        <div className="card-body">
          <LinkGrid
            bookmarks={directLinks}
            parent={section}
            onBookmarkContextMenu={actions.onBookmarkContextMenu}
          />
          {directLinks.length > 0 && subFolders.length > 0 && <div className="card-sep" />}
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
