import React from 'react';

export function SectionTitleCapsule({
  children,
  highlight,
  align = 'center',
  caseInsensitive = false,
}: {
  children: React.ReactNode;
  highlight?: string;
  align?: 'left' | 'center';
  caseInsensitive?: boolean;
}) {
  const base = 'font-semibold tracking-tight text-3xl sm:text-4xl lg:text-5xl leading-[1.1] text-foreground';
  const alignClass = align === 'center' ? 'text-center' : 'text-left';

  if (typeof children !== 'string' || !highlight || highlight.length === 0) {
    return (
      <h2 className={`${base} ${alignClass}`} style={{ textAlign: align }}>
        {children}
      </h2>
    );
  }

  const source = children;
  const needle = caseInsensitive ? highlight.toLowerCase() : highlight;
  const haystack = caseInsensitive ? source.toLowerCase() : source;

  if (!haystack.includes(needle)) {
    return (
      <h2 className={`${base} ${alignClass}`} style={{ textAlign: align }}>
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
    <h2 className={`${base} ${alignClass}`} style={{ textAlign: align, margin: '0 auto 1rem' }}>
      {parts}
    </h2>
  );
}

