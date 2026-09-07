import { forwardRef, useLayoutEffect, useState, useEffect } from 'react';
import {
  usePageBuilderStore,
  NAVBAR_DEFAULTS,
} from '../stores/pageBuilderStore';

interface NavbarProps {
  componentId: string;
}

export const Navbar = forwardRef<HTMLElement, NavbarProps>((props, ref) => {
  const id = props.componentId ?? 'preview';
  const s = usePageBuilderStore((state) => state.navbar[id] ?? NAVBAR_DEFAULTS);
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
        usePageBuilderStore.getState().setNavbar(id, parsed);
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
    links,
    ctaText,
    ctaUrl,
    backgroundColor,
    textColor,
    ctaButtonColor,
    ctaButtonTextColor,
    layout,
    isSticky,
  } = s;

  const navStyles: React.CSSProperties = {
    backgroundColor,
    color: textColor,
    position: isSticky ? 'sticky' : 'relative',
    top: 0,
    zIndex: 50,
  };

  const ctaStyles: React.CSSProperties = {
    backgroundColor: ctaButtonColor,
    color: ctaButtonTextColor,
  };

  return (
    <nav
      ref={ref}
      id={id}
      data-pb-settings={JSON.stringify(s)}
      style={{
        ...navStyles,
        width: '100%',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ pointerEvents: isBuilder ? 'none' : 'auto' }}>
        <div
          style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              height: '64px',
            }}
          >
            {/* Brand/Logo */}
            <div
              style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                marginRight: layout === 'left' ? '32px' : '0',
              }}
            >
              <a
                href="#"
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  letterSpacing: '-0.025em',
                  color: textColor,
                  textDecoration: 'none',
                }}
              >
                {brandText}
              </a>
            </div>

            {/* Links - center or left */}
            {layout !== 'right' && (
              <div
                style={{
                  display: 'flex',
                  flex: 1,
                  gap: '32px',
                  justifyContent: layout === 'center' ? 'center' : 'flex-start',
                }}
              >
                {links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    style={{
                      color: textColor,
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      padding: '4px',
                    }}
                    onClick={(e) => isBuilder && e.preventDefault()}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Right aligned links */}
              {layout === 'right' && (
                <div
                  style={{ display: 'flex', gap: '32px', marginRight: '16px' }}
                >
                  {links.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      style={{
                        color: textColor,
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        padding: '4px',
                      }}
                      onClick={(e) => isBuilder && e.preventDefault()}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              )}

              {/* CTA Button */}
              {ctaText && (
                <a
                  href={ctaUrl}
                  style={{
                    ...ctaStyles,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                  onClick={(e) => isBuilder && e.preventDefault()}
                >
                  {ctaText}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
});

Navbar.displayName = 'Navbar';
