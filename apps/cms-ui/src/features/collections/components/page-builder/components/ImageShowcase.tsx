import { forwardRef, useLayoutEffect, useState, useEffect } from 'react';
import {
  usePageBuilderStore,
  useShallow,
  IMAGE_SHOWCASE_DEFAULTS,
} from '../stores/pageBuilderStore';
import type { ImageShowcaseProps } from '@/features/collections/types/page-builder.types';
import { getOptimizedImageUrl, getResponsiveSrcSet } from '@/utils/imageUrl';

export const ImageShowcase = forwardRef<HTMLElement, ImageShowcaseProps>(
  (props, ref) => {
    const id = props.componentId ?? 'preview';
    const s = usePageBuilderStore(
      useShallow((state) => state.imageShowcase[id] ?? IMAGE_SHOWCASE_DEFAULTS),
    );
    const [isBuilder, setIsBuilder] = useState(
      !(
        (window as { __IS_CMS_PREVIEW__?: boolean }).__IS_CMS_PREVIEW__ ||
        window.location.pathname.startsWith('/preview')
      ),
    );

    useEffect(() => {
      const el = document.getElementById(id);
      if (el) {
        setIsBuilder(
          !(
            (window as { __IS_CMS_PREVIEW__?: boolean }).__IS_CMS_PREVIEW__ ||
            window.location.pathname.startsWith('/preview')
          ),
        );
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
          usePageBuilderStore.getState().setImageShowcase(id, parsed);
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
      layout,
      images,
      backgroundColor,
      textColor,
      borderRadius,
      gap,
      overlayOpacity,
    } = s;

    // Helper to render an individual image block based on layout constraints
    const renderImageBlock = (
      img: (typeof images)[0],
      forceHeight?: string,
    ) => {
      return (
        <div
          key={img.id}
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            breakInside: 'avoid',
            marginBottom: layout === 'masonry' ? gap + 'px' : '0',
          }}
        >
          <div
            style={{
              width: '100%',
              height: forceHeight || 'auto',
              borderRadius: borderRadius + 'px',
              overflow: 'hidden',
              backgroundColor: '#e5e7eb',
            }}
          >
            <img
              src={getOptimizedImageUrl(img.url, {
                width: 800,
                format: 'webp',
                quality: 80,
              })}
              srcSet={
                getResponsiveSrcSet(img.url, [320, 640, 960], {
                  format: 'webp',
                  quality: 80,
                }) || undefined
              }
              sizes="(max-width: 768px) 100vw, 50vw"
              alt={img.alt}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
              loading="lazy"
              decoding="async"
            />
          </div>
          {img.caption && (
            <p
              style={{
                marginTop: '12px',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: textColor,
                textAlign: 'center',
              }}
            >
              {img.caption}
            </p>
          )}
        </div>
      );
    };

    if (layout === 'hero') {
      const heroImage = images[0];
      return (
        <section
          ref={ref}
          id={id}
          data-pb-settings={JSON.stringify(s)}
          style={{
            position: 'relative',
            width: '100%',
            minHeight: '600px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            overflow: 'hidden',
            backgroundColor,
          }}
        >
          {/* Background Image */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 1,
            }}
          >
            {heroImage && (
              <img
                src={getOptimizedImageUrl(heroImage.url, {
                  width: 1600,
                  format: 'webp',
                  quality: 80,
                })}
                srcSet={
                  getResponsiveSrcSet(heroImage.url, [640, 1024, 1600], {
                    format: 'webp',
                    quality: 80,
                  }) || undefined
                }
                sizes="100vw"
                alt={heroImage.alt}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
                loading="lazy"
                decoding="async"
              />
            )}
          </div>

          {/* Overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: '#000000',
              opacity: overlayOpacity,
              zIndex: 2,
              pointerEvents: 'none',
            }}
          />

          {/* Content */}
          <div
            style={{
              position: 'relative',
              zIndex: 3,
              textAlign: 'center',
              maxWidth: '800px',
              padding: '0 24px',
              pointerEvents: isBuilder ? 'none' : 'auto',
            }}
          >
            <h1
              style={{
                color: '#ffffff',
                fontSize: '4rem',
                fontWeight: 800,
                marginBottom: '24px',
                textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                letterSpacing: '-0.02em',
              }}
            >
              {heroImage?.caption || 'Hero Title'}
            </h1>
            <p
              style={{
                color: '#f3f4f6',
                fontSize: '1.25rem',
                lineHeight: 1.6,
                textShadow: '0 1px 4px rgba(0,0,0,0.4)',
              }}
            >
              {heroImage?.alt || 'This is the hero description overlay.'}
            </p>
          </div>
        </section>
      );
    }

    if (layout === 'slider') {
      return (
        <section
          ref={ref}
          id={id}
          data-pb-settings={JSON.stringify(s)}
          style={{
            width: '100%',
            backgroundColor,
            padding: '64px 24px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              pointerEvents: isBuilder ? 'none' : 'auto',
              maxWidth: '1280px',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: gap + 'px',
                overflowX: 'auto',
                scrollSnapType: 'x mandatory',
                paddingBottom: '24px', // Space for scrollbar
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {images.map((img) => (
                <div
                  key={img.id}
                  style={{
                    flex: '0 0 auto',
                    width: '300px',
                    scrollSnapAlign: 'start',
                  }}
                >
                  {renderImageBlock(img, '400px')}
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (layout === 'masonry') {
      return (
        <section
          ref={ref}
          id={id}
          data-pb-settings={JSON.stringify(s)}
          style={{
            width: '100%',
            backgroundColor,
            padding: '64px 24px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              pointerEvents: isBuilder ? 'none' : 'auto',
              maxWidth: '1280px',
              margin: '0 auto',
            }}
          >
            <div style={{ columnCount: 3, columnGap: gap + 'px' }}>
              {images.map((img) => renderImageBlock(img))}
            </div>
          </div>
        </section>
      );
    }

    // Default: Grid layout
    return (
      <section
        ref={ref}
        id={id}
        data-pb-settings={JSON.stringify(s)}
        style={{
          width: '100%',
          backgroundColor,
          padding: '64px 24px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            pointerEvents: isBuilder ? 'none' : 'auto',
            maxWidth: '1280px',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: gap + 'px',
            }}
          >
            {images.map((img) => renderImageBlock(img, '280px'))}
          </div>
        </div>
      </section>
    );
  },
);

ImageShowcase.displayName = 'ImageShowcase';
