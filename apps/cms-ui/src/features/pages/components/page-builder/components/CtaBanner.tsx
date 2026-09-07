import { forwardRef, useLayoutEffect, useState, useEffect } from 'react';
import {
  usePageBuilderStore,
  CTA_BANNER_DEFAULTS,
} from '../stores/pageBuilderStore';

interface CtaBannerProps {
  componentId: string;
}

const CtaBanner = forwardRef<HTMLDivElement, CtaBannerProps>((props, ref) => {
  const id = props.componentId ?? 'default';
  const s = usePageBuilderStore(
    (state) => state.ctaBanner[id] ?? CTA_BANNER_DEFAULTS,
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
        usePageBuilderStore.getState().setCtaBanner(id, parsed);
      } catch {
        /* ignore */
      }
    }
  }, [id]);

  useLayoutEffect(() => {
    const el = document.getElementById(id);
    el?.setAttribute('data-pb-settings', JSON.stringify(s));
  });

  const alignmentMap = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
  };

  return (
    <div
      ref={ref}
      id={id}
      data-pb-settings={JSON.stringify(s)}
      style={{
        backgroundColor: s.backgroundColor,
        color: s.textColor,
        padding: '64px 24px',
        textAlign: s.alignment,
        display: 'flex',
        flexDirection: 'column',
        alignItems: alignmentMap[s.alignment],
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          pointerEvents: isBuilder ? 'none' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: alignmentMap[s.alignment],
        }}
      >
        <h2
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            margin: '0 0 12px',
            color: s.textColor,
          }}
        >
          {s.title}
        </h2>
        <p
          style={{
            fontSize: '1.125rem',
            margin: '0 0 32px',
            opacity: 0.9,
            maxWidth: '600px',
          }}
        >
          {s.subtitle}
        </p>
        {s.showButton && (
          <a
            href={s.buttonUrl}
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              backgroundColor: s.buttonColor,
              color: s.buttonTextColor,
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {s.buttonText}
          </a>
        )}
      </div>
    </div>
  );
});

CtaBanner.displayName = 'CtaBanner';
export default CtaBanner;
