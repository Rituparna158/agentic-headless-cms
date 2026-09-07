import React from 'react';
import { forwardRef, useLayoutEffect, useState, useEffect } from 'react';
import {
  usePageBuilderStore,
  EMBED_CODE_DEFAULTS,
} from '../stores/pageBuilderStore';

interface EmbedCodeProps {
  componentId: string;
}

export const EmbedCode = forwardRef<HTMLElement, EmbedCodeProps>(
  (props, ref) => {
    const id = props.componentId ?? 'preview';
    const s = usePageBuilderStore(
      (state) => state.embedCode[id] ?? EMBED_CODE_DEFAULTS,
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
          usePageBuilderStore.getState().setEmbedCode(id, JSON.parse(saved));
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
          style={{ pointerEvents: isBuilder ? 'none' : 'auto' }}
          dangerouslySetInnerHTML={{ __html: s.htmlContent }}
        />
      </div>
    );
  },
);

EmbedCode.displayName = 'EmbedCode';
