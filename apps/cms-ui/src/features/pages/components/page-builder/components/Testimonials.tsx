import { forwardRef, useLayoutEffect, useState, useEffect } from 'react';
import {
  usePageBuilderStore,
  TESTIMONIAL_DEFAULTS,
} from '../stores/pageBuilderStore';

interface TestimonialProps {
  componentId: string;
}

export const Testimonials = forwardRef<HTMLElement, TestimonialProps>(
  (props, ref) => {
    const id = props.componentId ?? 'preview';
    const s = usePageBuilderStore(
      (state) => state.testimonials[id] ?? TESTIMONIAL_DEFAULTS,
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
          usePageBuilderStore.getState().setTestimonial(id, JSON.parse(saved));
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

    const { layout, reviews, backgroundColor, textColor, cardColor } = s;

    const renderStars = (rating: number) => {
      return (
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              style={{
                width: '20px',
                height: '20px',
                color: star <= rating ? '#eab308' : '#e5e7eb',
              }}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
      );
    };

    const renderCard = (review: (typeof reviews)[0]) => (
      <div
        key={review.id}
        style={{
          backgroundColor: cardColor,
          padding: '32px',
          borderRadius: '16px',
          boxShadow:
            '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minWidth: layout === 'slider' ? '350px' : 'auto',
          scrollSnapAlign: 'start',
        }}
      >
        <div>
          {renderStars(review.rating)}
          <p
            style={{
              color: textColor,
              fontSize: '1.125rem',
              lineHeight: 1.6,
              marginBottom: '24px',
              fontStyle: 'italic',
            }}
          >
            &quot;{review.quote}&quot;
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {review.avatar && (
            <img
              src={review.avatar}
              alt={review.name}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          )}
          <div>
            <h4
              style={{
                color: textColor,
                fontSize: '1rem',
                fontWeight: 600,
                margin: 0,
              }}
            >
              {review.name}
            </h4>
            <p
              style={{
                color: textColor,
                opacity: 0.7,
                fontSize: '0.875rem',
                margin: '4px 0 0 0',
              }}
            >
              {review.role}
            </p>
          </div>
        </div>
      </div>
    );

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
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2
              style={{
                color: textColor,
                fontSize: '2.5rem',
                fontWeight: 800,
                margin: '0 0 16px 0',
              }}
            >
              What Our Customers Say
            </h2>
            <p
              style={{
                color: textColor,
                opacity: 0.8,
                fontSize: '1.125rem',
                margin: 0,
              }}
            >
              Don&apos;t just take our word for it.
            </p>
          </div>

          {layout === 'grid' ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '32px',
              }}
            >
              {reviews.map(renderCard)}
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                gap: '24px',
                overflowX: 'auto',
                scrollSnapType: 'x mandatory',
                paddingBottom: '24px',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {reviews.map(renderCard)}
            </div>
          )}
        </div>
      </section>
    );
  },
);

Testimonials.displayName = 'Testimonials';
