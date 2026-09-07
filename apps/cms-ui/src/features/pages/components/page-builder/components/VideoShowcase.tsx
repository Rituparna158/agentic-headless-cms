import { forwardRef, useLayoutEffect, useState, useEffect } from 'react';
import {
  usePageBuilderStore,
  VIDEO_SHOWCASE_DEFAULTS,
} from '../stores/pageBuilderStore';

interface VideoShowcaseProps {
  componentId: string;
}

const isYouTube = (url: string) => {
  return url.includes('youtube.com') || url.includes('youtu.be');
};

const getYouTubeEmbedUrl = (url: string) => {
  if (url.includes('embed')) return url;
  try {
    const urlObj = new URL(url);
    let videoId = '';
    if (url.includes('youtu.be')) {
      videoId = urlObj.pathname.slice(1);
    } else {
      videoId = urlObj.searchParams.get('v') || '';
    }
    return `https://www.youtube.com/embed/${videoId}`;
  } catch {
    return url;
  }
};

export const VideoShowcase = forwardRef<HTMLElement, VideoShowcaseProps>(
  (props, ref) => {
    const id = props.componentId ?? 'preview';
    const s = usePageBuilderStore(
      (state) => state.videoShowcase[id] ?? VIDEO_SHOWCASE_DEFAULTS,
    );
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
          usePageBuilderStore.getState().setVideoShowcase(id, parsed);
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

    const { layout, videos, backgroundColor, textColor, overlayOpacity } = s;

    // Helper to render the actual video element
    const renderVideo = (
      video: (typeof videos)[0],
      extraStyles: React.CSSProperties = {},
      isMutedAndAutoplay = false,
    ) => {
      const isYT = isYouTube(video.url);

      if (isYT) {
        const embedUrl =
          getYouTubeEmbedUrl(video.url) +
          (isMutedAndAutoplay ? '?autoplay=1&mute=1&loop=1&controls=0' : '');
        return (
          <iframe
            src={embedUrl}
            title={video.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              ...extraStyles,
            }}
          />
        );
      }

      // MP4 fallback
      return (
        <video
          src={video.url}
          controls={!isMutedAndAutoplay}
          autoPlay={isMutedAndAutoplay}
          muted={isMutedAndAutoplay}
          loop={isMutedAndAutoplay}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            ...extraStyles,
          }}
        />
      );
    };

    if (layout === 'hero') {
      const bgVideo = videos[0];
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
          }}
        >
          {/* Background Video */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 1,
              pointerEvents: 'none',
            }}
          >
            {bgVideo && renderVideo(bgVideo, { transform: 'scale(1.1)' }, true)}
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
                fontSize: '3.5rem',
                fontWeight: 800,
                marginBottom: '24px',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              {bgVideo?.title || 'Hero Video Title'}
            </h1>
            <p
              style={{
                color: '#f3f4f6',
                fontSize: '1.25rem',
                lineHeight: 1.6,
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              }}
            >
              {bgVideo?.description ||
                'This is the hero video description overlay.'}
            </p>
          </div>
        </section>
      );
    }

    if (layout === 'grid') {
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
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '32px',
              }}
            >
              {videos.map((video) => (
                <div
                  key={video.id}
                  style={{ display: 'flex', flexDirection: 'column' }}
                >
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '16/9',
                      backgroundColor: '#000',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      marginBottom: '16px',
                    }}
                  >
                    {renderVideo(video)}
                  </div>
                  <h3
                    style={{
                      color: textColor,
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      margin: '0 0 8px 0',
                    }}
                  >
                    {video.title}
                  </h3>
                  <p
                    style={{
                      color: textColor,
                      opacity: 0.8,
                      fontSize: '0.95rem',
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    {video.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    // Default: Single layout
    const mainVideo = videos[0];
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
            maxWidth: '1000px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          {mainVideo && (
            <>
              <div
                style={{
                  width: '100%',
                  aspectRatio: '16/9',
                  backgroundColor: '#000',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  marginBottom: '32px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                }}
              >
                {renderVideo(mainVideo)}
              </div>
              <h2
                style={{
                  color: textColor,
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  margin: '0 0 16px 0',
                }}
              >
                {mainVideo.title}
              </h2>
              <p
                style={{
                  color: textColor,
                  opacity: 0.8,
                  fontSize: '1.125rem',
                  maxWidth: '700px',
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                {mainVideo.description}
              </p>
            </>
          )}
        </div>
      </section>
    );
  },
);

VideoShowcase.displayName = 'VideoShowcase';
