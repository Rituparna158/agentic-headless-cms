import { forwardRef, useLayoutEffect, useState, useEffect } from 'react';
import { usePageBuilderStore, FAQ_DEFAULTS } from '../stores/pageBuilderStore';

interface FAQProps {
  componentId: string;
}

export const FAQ = forwardRef<HTMLElement, FAQProps>((props, ref) => {
  const id = props.componentId ?? 'preview';
  const s = usePageBuilderStore((state) => state.faq[id] ?? FAQ_DEFAULTS);
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
        usePageBuilderStore.getState().setFAQ(id, JSON.parse(saved));
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

  const {
    title,
    description,
    items,
    backgroundColor,
    textColor,
    accordionColor,
  } = s;

  return (
    <section
      ref={ref}
      id={id}
      data-pb-settings={JSON.stringify(s)}
      style={{
        width: '100%',
        backgroundColor,
        padding: '80px 24px',
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
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2
            style={{
              color: textColor,
              fontSize: '2.5rem',
              fontWeight: 800,
              margin: '0 0 16px 0',
            }}
          >
            {title}
          </h2>
          {description && (
            <p
              style={{
                color: textColor,
                opacity: 0.8,
                fontSize: '1.125rem',
                margin: 0,
              }}
            >
              {description}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {items.map((item) => (
            <details
              key={item.id}
              style={{
                backgroundColor: accordionColor,
                borderRadius: '12px',
                boxShadow:
                  '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                overflow: 'hidden',
              }}
            >
              <summary
                style={{
                  padding: '24px',
                  fontWeight: 600,
                  fontSize: '1.125rem',
                  color: textColor,
                  cursor: 'pointer',
                  listStyle: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  outline: 'none',
                }}
              >
                {item.question}
                <svg
                  style={{
                    width: '20px',
                    height: '20px',
                    flexShrink: 0,
                    opacity: 0.5,
                  }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </summary>
              <div
                style={{
                  padding: '0 24px 24px 24px',
                  color: textColor,
                  opacity: 0.8,
                  lineHeight: 1.6,
                }}
              >
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
});

FAQ.displayName = 'FAQ';
