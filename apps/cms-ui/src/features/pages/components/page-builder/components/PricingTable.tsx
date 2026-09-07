import { forwardRef, useLayoutEffect, useState, useEffect } from 'react';
import {
  usePageBuilderStore,
  PRICING_DEFAULTS,
} from '../stores/pageBuilderStore';

interface PricingProps {
  componentId: string;
}

export const PricingTable = forwardRef<HTMLElement, PricingProps>(
  (props, ref) => {
    const id = props.componentId ?? 'preview';
    const s = usePageBuilderStore(
      (state) => state.pricing[id] ?? PRICING_DEFAULTS,
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
          usePageBuilderStore.getState().setPricing(id, JSON.parse(saved));
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

    const { tiers, backgroundColor, textColor, cardColor, accentColor } = s;

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
            maxWidth: '1280px',
            margin: '0 auto',
            pointerEvents: isBuilder ? 'none' : 'auto',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2
              style={{
                color: textColor,
                fontSize: '2.5rem',
                fontWeight: 800,
                margin: '0 0 16px 0',
              }}
            >
              Simple, transparent pricing
            </h2>
            <p
              style={{
                color: textColor,
                opacity: 0.8,
                fontSize: '1.125rem',
                margin: 0,
              }}
            >
              No hidden fees. No surprise charges.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '32px',
              alignItems: 'stretch',
            }}
          >
            {tiers.map((tier) => (
              <div
                key={tier.id}
                style={{
                  backgroundColor: cardColor,
                  borderRadius: '16px',
                  padding: '40px 32px',
                  width: '100%',
                  maxWidth: '360px',
                  boxShadow: tier.isPopular
                    ? `0 0 0 2px ${accentColor}, 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)`
                    : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {tier.isPopular && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-16px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: accentColor,
                      color: '#ffffff',
                      padding: '4px 16px',
                      borderRadius: '9999px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Most Popular
                  </div>
                )}

                <h3
                  style={{
                    color: textColor,
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    margin: '0 0 8px 0',
                  }}
                >
                  {tier.name}
                </h3>
                <p
                  style={{
                    color: textColor,
                    opacity: 0.7,
                    fontSize: '0.875rem',
                    minHeight: '40px',
                    margin: '0 0 24px 0',
                  }}
                >
                  {tier.description}
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    marginBottom: '32px',
                  }}
                >
                  <span
                    style={{
                      color: textColor,
                      fontSize: '3rem',
                      fontWeight: 800,
                      letterSpacing: '-0.025em',
                    }}
                  >
                    {tier.price}
                  </span>
                  <span
                    style={{
                      color: textColor,
                      opacity: 0.7,
                      fontSize: '1rem',
                      marginLeft: '4px',
                    }}
                  >
                    {tier.cycle}
                  </span>
                </div>

                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '0 0 32px 0',
                    flexGrow: 1,
                  }}
                >
                  {tier.features.map((feature) => (
                    <li
                      key={feature.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        marginBottom: '16px',
                      }}
                    >
                      <svg
                        style={{
                          width: '20px',
                          height: '20px',
                          flexShrink: 0,
                          marginRight: '12px',
                          color: feature.included ? accentColor : '#9ca3af',
                        }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        {feature.included ? (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        ) : (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        )}
                      </svg>
                      <span
                        style={{
                          color: textColor,
                          opacity: feature.included ? 1 : 0.5,
                          fontSize: '0.95rem',
                        }}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <a
                  href={tier.buttonUrl}
                  onClick={(e) => isBuilder && e.preventDefault()}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'center',
                    backgroundColor: tier.isPopular
                      ? accentColor
                      : 'transparent',
                    color: tier.isPopular ? '#ffffff' : accentColor,
                    border: `1px solid ${accentColor}`,
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {tier.buttonText}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  },
);

PricingTable.displayName = 'PricingTable';
