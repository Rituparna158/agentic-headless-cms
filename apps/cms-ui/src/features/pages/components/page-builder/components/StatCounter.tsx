import { forwardRef, useLayoutEffect, useState, useEffect } from 'react';
import {
  usePageBuilderStore,
  STAT_COUNTER_DEFAULTS,
} from '../stores/pageBuilderStore';

interface StatCounterProps {
  componentId: string;
}

export const StatCounter = forwardRef<HTMLElement, StatCounterProps>(
  (props, ref) => {
    const id = props.componentId ?? 'preview';
    const s = usePageBuilderStore(
      (state) => state.statCounter[id] ?? STAT_COUNTER_DEFAULTS,
    );
    const [isBuilder, setIsBuilder] = useState(true);

    useEffect(() => {
      const el = document.getElementById(id);
      if (el) setIsBuilder(true);
    }, [id]);

    useLayoutEffect(() => {
      const el = document.getElementById(id);
      if (!el) return;
      const saved = el.getAttribute('data-pb-settings');
      if (saved) {
        try {
          usePageBuilderStore.getState().setStatCounter(id, JSON.parse(saved));
        } catch (_e) {
          /* ignore */
        }
      }
    }, [id]);

    useLayoutEffect(() => {
      const el = document.getElementById(id);
      if (el) el.setAttribute('data-pb-settings', JSON.stringify(s));
    }, [id, s]);

    if (!s) return null;

    const { items, backgroundColor, textColor, valueColor } = s;

    return (
      <section
        ref={ref}
        id={id}
        data-pb-settings={JSON.stringify(s)}
        style={{
          width: '100%',
          backgroundColor,
          padding: '64px 24px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            pointerEvents: isBuilder ? 'none' : 'auto',
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(${Math.max(200, 1000 / items.length)}px, 1fr))`,
            gap: '32px',
            textAlign: 'center',
          }}
        >
          {items.map((item) => (
            <div key={item.id} style={{ padding: '16px' }}>
              <div
                style={{
                  fontSize: '3.5rem',
                  fontWeight: 800,
                  color: valueColor,
                  lineHeight: 1,
                  letterSpacing: '-0.025em',
                  marginBottom: '8px',
                }}
              >
                {item.prefix}
                {item.value}
                {item.suffix}
              </div>
              <div
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 500,
                  color: textColor,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  },
);

StatCounter.displayName = 'StatCounter';
