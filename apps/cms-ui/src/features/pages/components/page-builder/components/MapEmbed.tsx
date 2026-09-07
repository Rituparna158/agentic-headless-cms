import React from 'react';
import { forwardRef, useLayoutEffect, useState, useEffect } from 'react';
import {
  usePageBuilderStore,
  MAP_EMBED_DEFAULTS,
} from '../stores/pageBuilderStore';

interface MapEmbedProps {
  componentId: string;
}

export const MapEmbed = forwardRef<HTMLElement, MapEmbedProps>((props, ref) => {
  const id = props.componentId ?? 'preview';
  const s = usePageBuilderStore(
    (state) => state.mapEmbed[id] ?? MAP_EMBED_DEFAULTS,
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
        usePageBuilderStore.getState().setMapEmbed(id, JSON.parse(saved));
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

  const { address, height, zoom } = s;

  // Use Google Maps embedded URL format
  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=${zoom}&ie=UTF8&iwloc=&output=embed`;

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      id={id}
      data-pb-settings={JSON.stringify(s)}
      style={{
        width: '100%',
        position: 'relative',
      }}
    >
      <div
        style={{
          pointerEvents: isBuilder ? 'none' : 'auto',
          width: '100%',
          height: `${height}px`,
        }}
      >
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={mapUrl}
          title="Google Map"
          style={{ border: 0 }}
          allowFullScreen
        />
      </div>
    </div>
  );
});

MapEmbed.displayName = 'MapEmbed';
