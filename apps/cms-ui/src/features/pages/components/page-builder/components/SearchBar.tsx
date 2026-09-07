import { forwardRef, useLayoutEffect, useState, useEffect } from 'react';
import {
  usePageBuilderStore,
  SEARCH_BAR_DEFAULTS,
} from '../stores/pageBuilderStore';

interface SearchBarProps {
  componentId: string;
}

const SearchBar = forwardRef<HTMLDivElement, SearchBarProps>((props, ref) => {
  const id = props.componentId ?? 'default';
  const s = usePageBuilderStore(
    (state) => state.searchBar[id] ?? SEARCH_BAR_DEFAULTS,
  );

  const [isBuilder, setIsBuilder] = useState(true);

  useEffect(() => {
    const el = document.getElementById(id);
    if (el) {
      setIsBuilder(true);
    }
  }, [id]);

  useLayoutEffect(() => {
    const el = document.getElementById(id);
    if (!el) return;
    const saved = el.getAttribute('data-pb-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        usePageBuilderStore.getState().setSearchBar(id, parsed);
      } catch {
        // ignore
      }
    }
  }, [id]);

  useLayoutEffect(() => {
    const el = document.getElementById(id);
    if (el) {
      el.setAttribute('data-pb-settings', JSON.stringify(s));
    }
  }, [id, s]);

  const alignmentMap = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
  };

  const [isFocused, setIsFocused] = useState(false);

  return (
    <div
      ref={ref}
      id={id}
      data-pb-settings={JSON.stringify(s)}
      style={{
        width: '100%',
        padding: '24px 16px',
        display: 'flex',
        justifyContent: alignmentMap[s.alignment] || 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          maxWidth: s.maxWidth || '600px',
          backgroundColor: s.backgroundColor || '#ffffff',
          borderRadius: `${s.borderRadius}px`,
          padding: '4px 8px',
          boxShadow: isFocused
            ? '0 0 0 3px rgba(102, 126, 234, 0.3)'
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e2e8f0',
          transition: 'box-shadow 0.2s',
        }}
      >
        <div
          style={{
            padding: '0 12px',
            color: s.iconColor || '#a0aec0',
            display: 'flex',
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <input
          type="text"
          placeholder={s.placeholder || 'Search...'}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          readOnly={isBuilder}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            padding: '12px 0',
            fontSize: '1rem',
            backgroundColor: 'transparent',
            color: s.textColor || '#1a202c',
            pointerEvents: isBuilder ? 'none' : 'auto',
          }}
        />
        {s.showButton && (
          <button
            style={{
              padding: '10px 24px',
              backgroundColor: s.buttonColor || '#667eea',
              color: s.buttonTextColor || '#ffffff',
              border: 'none',
              borderRadius: `${Math.max(0, s.borderRadius - 4)}px`,
              fontWeight: 600,
              cursor: isBuilder ? 'default' : 'pointer',
              fontSize: '0.875rem',
              marginLeft: '8px',
              transition: 'opacity 0.2s',
              pointerEvents: isBuilder ? 'none' : 'auto',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {s.buttonText || 'Search'}
          </button>
        )}
      </div>
    </div>
  );
});

SearchBar.displayName = 'SearchBar';
export default SearchBar;
