import { forwardRef, useLayoutEffect, useState, useEffect } from 'react';
import {
  usePageBuilderStore,
  NEWSLETTER_FORM_DEFAULTS,
} from '../stores/pageBuilderStore';

interface NewsletterFormProps {
  componentId: string;
}

const NewsletterForm = forwardRef<HTMLDivElement, NewsletterFormProps>(
  (props, ref) => {
    const id = props.componentId ?? 'default';
    const s = usePageBuilderStore(
      (state) => state.newsletterForm[id] ?? NEWSLETTER_FORM_DEFAULTS,
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
          usePageBuilderStore.getState().setNewsletterForm(id, parsed);
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

    const isInline = s.layout === 'inline';

    return (
      <div
        ref={ref}
        id={id}
        data-pb-settings={JSON.stringify(s)}
        style={{
          backgroundColor: s.backgroundColor || '#f7fafc',
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
                fontSize: '2rem',
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
                marginBottom: '32px',
                lineHeight: 1.6,
              }}
            >
              {s.subtitle}
            </p>
          )}

          <form
            style={{
              display: 'flex',
              flexDirection: isInline ? 'row' : 'column',
              gap: isInline ? '12px' : '16px',
              alignItems: isInline ? 'stretch' : 'stretch',
              width: '100%',
            }}
            onSubmit={(e) => {
              if (isBuilder) e.preventDefault();
            }}
          >
            <input
              type="email"
              placeholder={s.placeholder || 'Enter your email address'}
              readOnly={isBuilder}
              style={{
                flex: 1,
                padding: '14px 16px',
                backgroundColor: s.inputBackgroundColor || '#ffffff',
                border: `1px solid ${s.inputBorderColor || '#e2e8f0'}`,
                borderRadius: '8px',
                fontSize: '1rem',
                color: s.textColor || '#1a202c',
                outline: 'none',
                boxSizing: 'border-box',
                pointerEvents: isBuilder ? 'none' : 'auto',
              }}
            />
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
                whiteSpace: 'nowrap',
              }}
            >
              {s.buttonText || 'Subscribe'}
            </button>
          </form>
        </div>
      </div>
    );
  },
);

NewsletterForm.displayName = 'NewsletterForm';
export default NewsletterForm;
