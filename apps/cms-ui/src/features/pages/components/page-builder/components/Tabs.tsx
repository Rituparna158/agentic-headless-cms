import { forwardRef, useLayoutEffect, useState, useEffect } from 'react';
import { usePageBuilderStore, TABS_DEFAULTS } from '../stores/pageBuilderStore';

interface TabsProps {
  componentId: string;
}

export const Tabs = forwardRef<HTMLElement, TabsProps>((props, ref) => {
  const id = props.componentId ?? 'preview';
  const s = usePageBuilderStore((state) => state.tabs[id] ?? TABS_DEFAULTS);
  const [isBuilder, setIsBuilder] = useState(true);
  const [activeTab, setActiveTab] = useState(s.items[0]?.id || '');

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
        usePageBuilderStore.getState().setTabs(id, JSON.parse(saved));
      } catch (_e) {
        /* ignore */
      }
    }
  }, [id]);

  useLayoutEffect(() => {
    const el = document.getElementById(id);
    if (el) el.setAttribute('data-pb-settings', JSON.stringify(s));
  }, [id, s]);

  useEffect(() => {
    if (s.items.length > 0 && !s.items.find((t) => t.id === activeTab)) {
      setActiveTab(s.items[0]?.id || '');
    }
  }, [s.items, activeTab]);

  if (!s) return null;

  const { items, backgroundColor, textColor, activeColor, inactiveColor } = s;
  const currentTabContent =
    items.find((t) => t.id === activeTab)?.content || '';

  return (
    <section
      ref={ref}
      id={id}
      data-pb-settings={JSON.stringify(s)}
      style={{
        width: '100%',
        backgroundColor,
        padding: '48px 24px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          pointerEvents: isBuilder ? 'none' : 'auto',
        }}
      >
        {/* Tab Headers */}
        <div
          style={{
            display: 'flex',
            borderBottom: `2px solid ${inactiveColor}`,
            marginBottom: '24px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          {items.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 24px',
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${isActive ? activeColor : 'transparent'}`,
                  marginBottom: '-2px',
                  color: isActive ? activeColor : textColor,
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
              >
                {tab.title}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div
          style={{
            color: textColor,
            lineHeight: 1.6,
            fontSize: '1.125rem',
          }}
        >
          {currentTabContent}
        </div>
      </div>
    </section>
  );
});

Tabs.displayName = 'Tabs';
