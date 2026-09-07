import { forwardRef, useLayoutEffect, useState, useEffect } from 'react';
import { usePageBuilderStore, HERO_DEFAULTS } from '../stores/pageBuilderStore';

interface HeroSectionProps {
  componentId: string;
}

const HeroSection = forwardRef<HTMLDivElement, HeroSectionProps>(
  (props, ref) => {
    const id = props.componentId ?? 'default';
    const s = usePageBuilderStore((state) => state.hero[id] ?? HERO_DEFAULTS);

    const [isBuilder, setIsBuilder] = useState(true);

    useEffect(() => {
      const el = document.getElementById(id);
      if (el) {
        setIsBuilder(true);
      }
    }, [id]);

    // Initial Mount Sync: Load JSON data safely
    useLayoutEffect(() => {
      const el = document.getElementById(id);
      if (!el) return;
      const saved = el.getAttribute('data-pb-settings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          usePageBuilderStore.getState().setHero(id, parsed);
        } catch {
          /* ignore invalid JSON */
        }
      }
    }, [id]);

    // Fixed: Adding proper dependency arrays saves browser thread from dying
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

    return (
      <div
        ref={ref}
        id={id}
        data-pb-settings={JSON.stringify(s)}
        style={{
          background: s.backgroundColor || '#667eea',
          color: s.textColor || '#ffffff',
          padding: '80px 24px',
          textAlign: s.alignment,
          display: 'flex',
          flexDirection: 'column',
          alignItems: alignmentMap[s.alignment] || 'center',
          justifyContent: 'center',
          minHeight: '320px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            pointerEvents: isBuilder ? 'none' : 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: alignmentMap[s.alignment] || 'center',
          }}
        >
          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              margin: '0 0 16px',
              color: s.titleColor || '#ffffff',
              lineHeight: 1.2,
              maxWidth: '700px',
            }}
          >
            {s.title || 'Click to change title'}
          </h1>
          <p
            style={{
              fontSize: '1.125rem',
              margin: '0 0 32px',
              color: s.subtitleColor || '#e2e8f0',
              maxWidth: '600px',
              lineHeight: 1.6,
            }}
          >
            {s.subtitle || 'Click to change subtitle'}
          </p>
          {s.showButton && (
            <a
              href={s.buttonUrl || '#'}
              style={{
                display: 'inline-block',
                padding: '14px 32px',
                backgroundColor: s.buttonColor || '#ffffff',
                color: s.buttonTextColor || '#1a202c',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {s.buttonText || 'Learn More'}
            </a>
          )}
        </div>
      </div>
    );
  },
);

HeroSection.displayName = 'HeroSection';
export default HeroSection;
