import {
  usePageBuilderStore,
  CTA_BANNER_DEFAULTS,
} from '../stores/pageBuilderStore';

export default function CtaBannerSettings(props: {
  targetComponentId: string;
}) {
  console.log('CtaBannerSettings props:', props);
  const { targetComponentId } = props;
  const s = usePageBuilderStore(
    (state) => state.ctaBanner[targetComponentId] ?? CTA_BANNER_DEFAULTS,
  );
  const set = usePageBuilderStore((state) => state.setCtaBanner);
  const u = (patch: Partial<typeof s>) => set(targetComponentId, patch);

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '0.875rem',
    outline: 'none',
    backgroundColor: '#ffffff',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#4a5568',
    marginBottom: '4px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  };

  const sectionStyle = {
    marginBottom: '16px',
  };

  return (
    <div
      style={{
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={sectionStyle}>
        <label style={labelStyle}>Title</label>
        <input
          style={inputStyle}
          value={s.title}
          onChange={(e) => u({ title: e.target.value })}
          placeholder="CTA title"
        />
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>Subtitle</label>
        <input
          style={inputStyle}
          value={s.subtitle}
          onChange={(e) => u({ subtitle: e.target.value })}
          placeholder="CTA subtitle"
        />
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>Alignment</label>
        <select
          style={inputStyle}
          value={s.alignment}
          onChange={(e) =>
            u({ alignment: e.target.value as 'left' | 'center' | 'right' })
          }
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>

      <div
        style={{
          ...sectionStyle,
          borderTop: '1px solid #e2e8f0',
          paddingTop: '12px',
        }}
      >
        <label
          style={{
            ...labelStyle,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <input
            type="checkbox"
            checked={s.showButton}
            onChange={(e) => u({ showButton: e.target.checked })}
          />
          Show Button
        </label>
      </div>

      {s.showButton && (
        <>
          <div style={sectionStyle}>
            <label style={labelStyle}>Button Text</label>
            <input
              style={inputStyle}
              value={s.buttonText}
              onChange={(e) => u({ buttonText: e.target.value })}
              placeholder="Start Free Trial"
            />
          </div>
          <div style={sectionStyle}>
            <label style={labelStyle}>Button URL</label>
            <input
              style={inputStyle}
              value={s.buttonUrl}
              onChange={(e) => u({ buttonUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </>
      )}

      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
        <label style={labelStyle}>Colors</label>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
          }}
        >
          <div>
            <label style={{ ...labelStyle, fontSize: '0.7rem' }}>
              Background
            </label>
            <input
              type="color"
              style={{
                width: '100%',
                height: '32px',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              value={s.backgroundColor}
              onChange={(e) => u({ backgroundColor: e.target.value })}
            />
          </div>
          <div>
            <label style={{ ...labelStyle, fontSize: '0.7rem' }}>Text</label>
            <input
              type="color"
              style={{
                width: '100%',
                height: '32px',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              value={s.textColor}
              onChange={(e) => u({ textColor: e.target.value })}
            />
          </div>
          <div>
            <label style={{ ...labelStyle, fontSize: '0.7rem' }}>Button</label>
            <input
              type="color"
              style={{
                width: '100%',
                height: '32px',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              value={s.buttonColor}
              onChange={(e) => u({ buttonColor: e.target.value })}
            />
          </div>
          <div>
            <label style={{ ...labelStyle, fontSize: '0.7rem' }}>
              Button Text
            </label>
            <input
              type="color"
              style={{
                width: '100%',
                height: '32px',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              value={s.buttonTextColor}
              onChange={(e) => u({ buttonTextColor: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
