import React from 'react';
import { forwardRef, useLayoutEffect, useState, useEffect } from 'react';
import {
  usePageBuilderStore,
  BUTTON_GROUP_DEFAULTS,
} from '../stores/pageBuilderStore';

interface ButtonGroupProps {
  componentId: string;
}

export const ButtonGroup = forwardRef<HTMLElement, ButtonGroupProps>(
  (props, ref) => {
    const id = props.componentId ?? 'preview';
    const s = usePageBuilderStore(
      (state) => state.buttonGroup[id] ?? BUTTON_GROUP_DEFAULTS,
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
          usePageBuilderStore.getState().setButtonGroup(id, JSON.parse(saved));
        } catch (_e) {
          /* ignore */
        }
      }
    }, [id]);

    useLayoutEffect(() => {
      const el = document.getElementById(id);
      if (el) el.setAttribute('data-pb-settings', JSON.stringify(s));
    }, [id, s]);

    if (!s || s.buttons.length === 0) return null;

    const { buttons, alignment, layout, gap } = s;

    return (
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        id={id}
        data-pb-settings={JSON.stringify(s)}
        style={{
          width: '100%',
          padding: '24px',
          display: 'flex',
          flexDirection: layout,
          justifyContent:
            alignment === 'left'
              ? 'flex-start'
              : alignment === 'right'
                ? 'flex-end'
                : 'center',
          alignItems:
            alignment === 'left'
              ? 'flex-start'
              : alignment === 'right'
                ? 'flex-end'
                : 'center',
          gap: `${gap}px`,
          pointerEvents: isBuilder ? 'none' : 'auto',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {buttons.map((btn) => {
          const isSolid = btn.variant === 'solid';
          const isOutline = btn.variant === 'outline';

          return (
            <a
              key={btn.id}
              href={btn.url}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: 500,
                fontSize: '1rem',
                textDecoration: 'none',
                transition: 'all 0.2s',
                backgroundColor: isSolid ? btn.color : 'transparent',
                color: isSolid ? '#ffffff' : btn.color,
                border: `2px solid ${isOutline || isSolid ? btn.color : 'transparent'}`,
                opacity: 0.9,
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.opacity = '1';
                if (!isSolid) {
                  e.currentTarget.style.backgroundColor = `${btn.color}15`; // Add light background on hover for ghost/outline
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.opacity = '0.9';
                if (!isSolid) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {btn.text}
            </a>
          );
        })}
      </div>
    );
  },
);

ButtonGroup.displayName = 'ButtonGroup';
