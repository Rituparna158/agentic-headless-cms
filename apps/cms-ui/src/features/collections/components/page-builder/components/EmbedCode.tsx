import { forwardRef, useLayoutEffect, useState } from 'react';
import {
  usePageBuilderStore,
  EMBED_CODE_DEFAULTS,
} from '../stores/pageBuilderStore';

interface EmbedCodeProps {
  componentId: string;
  isPreview?: boolean;
}

export const EmbedCode = forwardRef<HTMLDivElement, EmbedCodeProps>(
  (props, ref) => {
    const id = props.componentId ?? 'preview';
    const s = usePageBuilderStore(
      (state) => state.embedCode[id] ?? EMBED_CODE_DEFAULTS,
    );
    const [isBuilder] = useState(
      !(
        (window as { __IS_CMS_PREVIEW__?: boolean }).__IS_CMS_PREVIEW__ ||
        window.location.pathname.startsWith('/preview')
      ),
    );

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
        ref={ref}
        id={id}
        data-pb-settings={JSON.stringify(s)}
        style={{
          width: '100%',
          position: 'relative',
        }}
      >
        <div style={{ pointerEvents: isBuilder ? 'none' : 'auto' }}>
          <iframe
            title="embed-content"
            sandbox="allow-scripts allow-same-origin"
            style={{ width: '100%', border: 'none', minHeight: '100px' }}
            srcDoc={s.htmlContent}
          />
        </div>
      </div>
    );
  },
);

EmbedCode.displayName = 'EmbedCode';
