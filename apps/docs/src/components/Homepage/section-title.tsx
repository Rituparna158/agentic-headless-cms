import React from 'react';

export function SectionTitleCapsule({
  children,
  highlight,
  align = 'center',
  caseInsensitive = false,
  style,
}: {
  children: React.ReactNode;
  highlight?: string;
  align?: 'left' | 'center';
  caseInsensitive?: boolean;
  style?: React.CSSProperties;
}) {
  const headingStyle: React.CSSProperties = {
    fontSize: 'clamp(2.1rem, 3.8vw, 2.85rem)',
    fontWeight: 800,
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
    color: 'var(--foreground)',
    textAlign: align,
    margin: '0 auto 0.85rem',
    ...style,
  };

  if (typeof children !== 'string' || !highlight || highlight.length === 0) {
    return (
      <h2 style={headingStyle}>
        {children}
      </h2>
    );
  }

  const source = children;
  const needle = caseInsensitive ? highlight.toLowerCase() : highlight;
  const haystack = caseInsensitive ? source.toLowerCase() : source;

  if (!haystack.includes(needle)) {
    return (
      <h2 style={headingStyle}>
        {children}
      </h2>
    );
  }

  const parts: React.ReactNode[] = [];
  let start = 0;
  let keyIdx = 0;

  while (true) {
    const idx = haystack.indexOf(needle, start);
    if (idx === -1) {
      parts.push(source.slice(start));
      break;
    }
    if (idx > start) {
      parts.push(source.slice(start, idx));
    }
    const match = source.slice(idx, idx + highlight.length);
    parts.push(
      <span
        key={`h-${keyIdx++}`}
        style={{
          color: '#ff0000',
          fontWeight: 800,
        }}
      >
        {match}
      </span>
    );
    start = idx + highlight.length;
  }

  return (
    <h2 style={headingStyle}>
      {parts}
    </h2>
  );
}
