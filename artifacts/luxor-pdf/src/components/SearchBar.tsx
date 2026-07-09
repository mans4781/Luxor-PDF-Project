import { useRef, useEffect } from "react";

interface SearchBarProps {
  query: string;
  matchIndex: number;
  totalMatches: number;
  onQueryChange: (q: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  /** True when the document appears to be scanned (no text layer). */
  unsearchable?: boolean;
}

export default function SearchBar({
  query, matchIndex, totalMatches,
  onQueryChange, onPrev, onNext, onClose,
  unsearchable = false,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.shiftKey ? onPrev() : onNext(); }
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="search-bar">
      <svg className="search-bar-icon" width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>

      <input
        ref={inputRef}
        className="search-bar-input"
        placeholder="Find in document…"
        value={query}
        onChange={e => onQueryChange(e.target.value)}
        onKeyDown={handleKey}
        spellCheck={false}
      />

      {query && (
        <span className="search-bar-count">
          {totalMatches === 0
            ? (unsearchable ? "Scanned document — no searchable text" : "No matches")
            : `${matchIndex + 1} of ${totalMatches}`}
        </span>
      )}

      <button
        className="search-bar-nav"
        onClick={onPrev}
        disabled={totalMatches === 0}
        title="Previous match (Shift+Enter)"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15"/>
        </svg>
      </button>

      <button
        className="search-bar-nav"
        onClick={onNext}
        disabled={totalMatches === 0}
        title="Next match (Enter)"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      <button className="search-bar-close" onClick={onClose} title="Close (Escape)">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}
