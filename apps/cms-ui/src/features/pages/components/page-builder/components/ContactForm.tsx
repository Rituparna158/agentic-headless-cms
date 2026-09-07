import { forwardRef, useLayoutEffect, useState, useEffect } from 'react';
import {
  usePageBuilderStore,
  CONTACT_FORM_DEFAULTS,
} from '../stores/pageBuilderStore';

interface ContactFormProps {
  componentId: string;
}

const ContactForm = forwardRef<HTMLDivElement, ContactFormProps>(
  (props, ref) => {
    const id = props.componentId ?? 'default';
    const s = usePageBuilderStore(
      (state) => state.contactForm[id] ?? CONTACT_FORM_DEFAULTS,
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
          usePageBuilderStore.getState().setContactForm(id, parsed);
        } catch {
          // ignore
        }
      }
    }, [id]);

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

    const textAlignmentMap = {
      left: 'left' as const,
      center: 'center' as const,
      right: 'right' as const,
    };

    const inputStyle = {
      width: '100%',
      padding: '12px 16px',
      backgroundColor: s.inputBackgroundColor || '#f7fafc',
      border: `1px solid ${s.inputBorderColor || '#e2e8f0'}`,
      borderRadius: '8px',
      fontSize: '1rem',
      color: s.textColor || '#1a202c',
      outline: 'none',
      boxSizing: 'border-box' as const,
      pointerEvents: isBuilder ? ('none' as const) : ('auto' as const),
    };

    const labelStyle = {
      display: 'block',
      fontSize: '0.875rem',
      fontWeight: 600,
      marginBottom: '8px',
      color: s.textColor || '#1a202c',
    };

    return (
      <div
        ref={ref}
        id={id}
        data-pb-settings={JSON.stringify(s)}
        style={{
          backgroundColor: s.backgroundColor || '#ffffff',
          padding: '60px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: alignmentMap[s.alignment] || 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '600px',
            textAlign: textAlignmentMap[s.alignment] || 'center',
            pointerEvents: isBuilder ? 'none' : 'auto',
          }}
        >
          {s.title && (
            <h2
              style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                marginBottom: '16px',
                color: s.textColor || '#1a202c',
              }}
            >
              {s.title}
            </h2>
          )}
          {s.subtitle && (
            <p
              style={{
                fontSize: '1.125rem',
                color: s.textColor,
                opacity: 0.8,
                marginBottom: '40px',
                lineHeight: 1.6,
              }}
            >
              {s.subtitle}
            </p>
          )}

          <form
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              textAlign: 'left',
            }}
            onSubmit={(e) => {
              if (isBuilder) e.preventDefault();
            }}
          >
            {s.showName && (
              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  style={inputStyle}
                  readOnly={isBuilder}
                />
              </div>
            )}

            <div>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email"
                placeholder="john@example.com"
                style={inputStyle}
                readOnly={isBuilder}
              />
            </div>

            {s.showPhone && (
              <div>
                <label style={labelStyle}>Phone Number</label>
                <input
                  type="tel"
                  placeholder="(555) 123-4567"
                  style={inputStyle}
                  readOnly={isBuilder}
                />
              </div>
            )}

            {s.showCompany && (
              <div>
                <label style={labelStyle}>Company</label>
                <input
                  type="text"
                  placeholder="Acme Inc."
                  style={inputStyle}
                  readOnly={isBuilder}
                />
              </div>
            )}

            <div>
              <label style={labelStyle}>Message</label>
              <textarea
                placeholder="How can we help you?"
                style={{
                  ...inputStyle,
                  minHeight: '120px',
                  resize: 'vertical',
                }}
                readOnly={isBuilder}
              />
            </div>

            <div
              style={{
                marginTop: '12px',
                textAlign: textAlignmentMap[s.alignment] || 'center',
              }}
            >
              <button
                type="submit"
                style={{
                  padding: '14px 32px',
                  backgroundColor: s.buttonColor || '#667eea',
                  color: s.buttonTextColor || '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: isBuilder ? 'default' : 'pointer',
                  transition: 'opacity 0.2s',
                  pointerEvents: isBuilder ? 'none' : 'auto',
                  width: s.alignment === 'center' ? '100%' : 'auto',
                }}
              >
                {s.buttonText || 'Send Message'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  },
);

ContactForm.displayName = 'ContactForm';
export default ContactForm;
