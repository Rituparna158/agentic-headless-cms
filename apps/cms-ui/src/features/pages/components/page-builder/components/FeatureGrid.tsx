import { forwardRef, useEffect, useLayoutEffect, useState } from 'react';
import {
  usePageBuilderStore,
  FEATURE_GRID_DEFAULTS,
} from '../stores/pageBuilderStore';

interface FeatureGridProps {
  componentId: string;
}

const FeatureGrid = forwardRef<HTMLDivElement, FeatureGridProps>(
  (props, ref) => {
    const id = props.componentId ?? 'default';
    const s = usePageBuilderStore(
      (state) => state.featureGrid[id] ?? FEATURE_GRID_DEFAULTS,
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
          usePageBuilderStore.getState().setFeatureGrid(id, parsed);
        } catch {
          /* ignore invalid JSON */
        }
      }
    }, [id]);

    useLayoutEffect(() => {
      const el = document.getElementById(id);
      el?.setAttribute('data-pb-settings', JSON.stringify(s));
    });

    const gridStyle = {
      display: 'grid',
      gridTemplateColumns: `repeat(${s.columns}, 1fr)`,
      gap: '24px',
    };

    return (
      <div
        ref={ref}
        id={id}
        data-pb-settings={JSON.stringify(s)}
        style={{
          backgroundColor: s.backgroundColor,
          padding: '64px 24px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            pointerEvents: isBuilder ? 'none' : 'auto',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2
              style={{
                fontSize: '2rem',
                fontWeight: 700,
                color: s.titleColor,
                margin: '0 0 12px',
              }}
            >
              {s.title}
            </h2>
            <p
              style={{
                fontSize: '1.125rem',
                color: s.subtitleColor,
                margin: 0,
              }}
            >
              {s.subtitle}
            </p>
          </div>

          {/* Features Grid */}
          <div style={gridStyle}>
            {s.features.map((feature, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: s.cardBackgroundColor,
                  border: `1px solid ${s.cardBorderColor}`,
                  borderRadius: `${s.cardBorderRadius}px`,
                  padding: '24px',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow =
                    '0 8px 24px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {s.showIcons && (
                  <div
                    style={{
                      marginBottom: '16px',
                      color: s.iconColor,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    dangerouslySetInnerHTML={{ __html: feature.icon }}
                  />
                )}
                <h3
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: s.titleColor,
                    margin: '0 0 8px',
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    fontSize: '0.9375rem',
                    color: s.subtitleColor,
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
);

FeatureGrid.displayName = 'FeatureGrid';
export default FeatureGrid;
