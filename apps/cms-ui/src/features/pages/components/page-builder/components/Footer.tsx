import { forwardRef, useLayoutEffect, useState, useEffect } from 'react';
import {
  usePageBuilderStore,
  FOOTER_DEFAULTS,
} from '../stores/pageBuilderStore';

interface FooterProps {
  componentId: string;
}

export const Footer = forwardRef<HTMLElement, FooterProps>((props, ref) => {
  const id = props.componentId ?? 'preview';
  const s = usePageBuilderStore((state) => state.footer[id] ?? FOOTER_DEFAULTS);
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
        usePageBuilderStore.getState().setFooter(id, parsed);
      } catch {
        /* ignore invalid JSON */
      }
    }
  }, [id]);

  // Sync settings back to DOM so builder can extract it
  useLayoutEffect(() => {
    const el = document.getElementById(id);
    if (el) {
      el.setAttribute('data-pb-settings', JSON.stringify(s));
    }
  }, [id, s]);

  if (!s) return null;

  const {
    brandText,
    description,
    copyrightText,
    links,
    backgroundColor,
    textColor,
    dividerColor,
  } = s;

  return (
    <footer
      ref={ref}
      id={id}
      data-pb-settings={JSON.stringify(s)}
      style={{
        backgroundColor,
        color: textColor,
        width: '100%',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        paddingTop: '64px',
        paddingBottom: '32px',
      }}
    >
      <div style={{ pointerEvents: isBuilder ? 'none' : 'auto' }}>
        <div
          style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              gap: '32px',
              marginBottom: '48px',
            }}
          >
            {/* Brand and Description */}
            <div style={{ flex: '1 1 300px' }}>
              <a
                href="#"
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  letterSpacing: '-0.025em',
                  color: textColor,
                  textDecoration: 'none',
                  display: 'block',
                  marginBottom: '16px',
                }}
              >
                {brandText}
              </a>
              <p
                style={{
                  fontSize: '1rem',
                  lineHeight: 1.5,
                  color: textColor,
                  opacity: 0.8,
                  maxWidth: '400px',
                  margin: 0,
                }}
              >
                {description}
              </p>
            </div>

            {/* Links */}
            {links.length > 0 && (
              <div style={{ flex: '0 1 auto', minWidth: '150px' }}>
                <h3
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    marginBottom: '16px',
                    color: textColor,
                  }}
                >
                  Links
                </h3>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {links.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      style={{
                        color: textColor,
                        opacity: 0.8,
                        textDecoration: 'none',
                        fontSize: '0.95rem',
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.opacity = '1')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.opacity = '0.8')
                      }
                      onClick={(e) => isBuilder && e.preventDefault()}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Divider and Copyright */}
          <div
            style={{
              borderTop: `1px solid ${dividerColor}`,
              paddingTop: '32px',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.7 }}>
              {copyrightText}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';
