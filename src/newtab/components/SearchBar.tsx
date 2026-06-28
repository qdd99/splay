import type { RefObject } from 'react';
import { SearchIcon } from './Icons';

export function SearchBar({
  query,
  onChange,
  onClear,
  inputRef,
  count,
}: {
  query: string;
  onChange: (value: string) => void;
  onClear: () => void;
  inputRef: RefObject<HTMLInputElement>;
  count?: number;
}) {
  const placeholder =
    count != null ? `Search ${count.toLocaleString()} bookmarks…` : 'Search bookmarks…';

  return (
    <div className="search">
      <div className="search-icon">
        <SearchIcon />
      </div>
      <input
        ref={inputRef}
        className="search-input"
        type="text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        aria-label="Search bookmarks"
      />
      {query && (
        <button type="button" className="search-clear" onClick={onClear} aria-label="Clear search">
          ×
        </button>
      )}
    </div>
  );
}
