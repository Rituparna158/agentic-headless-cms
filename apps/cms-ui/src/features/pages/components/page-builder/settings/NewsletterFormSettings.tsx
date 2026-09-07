import { usePageBuilderStore } from '../stores/pageBuilderStore';

interface NewsletterFormSettingsProps {
  targetComponentId: string;
}

const DEFAULT_STATE = {
  title: 'Subscribe to our Newsletter',
  subtitle: 'Get the latest news and updates right to your inbox.',
  placeholder: 'Enter your email address',
  buttonText: 'Subscribe',
  backgroundColor: '#f7fafc',
  textColor: '#1a202c',
  inputBackgroundColor: '#ffffff',
  inputBorderColor: '#e2e8f0',
  buttonColor: '#667eea',
  buttonTextColor: '#ffffff',
  alignment: 'center' as const,
  layout: 'inline' as const,
};

export default function NewsletterFormSettings({
  targetComponentId,
}: NewsletterFormSettingsProps) {
  const s = usePageBuilderStore(
    (state) => state.newsletterForm[targetComponentId] ?? DEFAULT_STATE,
  );
  const set = usePageBuilderStore((state) => state.setNewsletterForm);
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
          placeholder="Subscribe..."
        />
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>Subtitle</label>
        <textarea
          style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
          value={s.subtitle}
          onChange={(e) => u({ subtitle: e.target.value })}
          placeholder="Get the latest news..."
        />
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>Placeholder</label>
        <input
          style={inputStyle}
          value={s.placeholder}
          onChange={(e) => u({ placeholder: e.target.value })}
          placeholder="Enter your email address"
        />
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>Button Text</label>
        <input
          style={inputStyle}
          value={s.buttonText}
          onChange={(e) => u({ buttonText: e.target.value })}
          placeholder="Subscribe"
        />
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
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
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Layout</label>
          <select
            style={inputStyle}
            value={s.layout}
            onChange={(e) =>
              u({ layout: e.target.value as 'inline' | 'stacked' })
            }
          >
            <option value="inline">Inline</option>
            <option value="stacked">Stacked</option>
          </select>
        </div>
      </div>

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
              Section BG
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
              value={
                s.backgroundColor?.startsWith('#')
                  ? s.backgroundColor
                  : '#ffffff'
              }
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
              value={s.textColor || '#1a202c'}
              onChange={(e) => u({ textColor: e.target.value })}
            />
          </div>
          <div>
            <label style={{ ...labelStyle, fontSize: '0.7rem' }}>
              Input BG
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
              value={s.inputBackgroundColor || '#f7fafc'}
              onChange={(e) => u({ inputBackgroundColor: e.target.value })}
            />
          </div>
          <div>
            <label style={{ ...labelStyle, fontSize: '0.7rem' }}>
              Input Border
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
              value={s.inputBorderColor || '#e2e8f0'}
              onChange={(e) => u({ inputBorderColor: e.target.value })}
            />
          </div>
          <div>
            <label style={{ ...labelStyle, fontSize: '0.7rem' }}>
              Button BG
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
              value={s.buttonColor || '#667eea'}
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
              value={s.buttonTextColor || '#ffffff'}
              onChange={(e) => u({ buttonTextColor: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
