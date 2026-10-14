import { usePageBuilderStore } from '../stores/pageBuilderStore';

interface SearchBarSettingsProps {
  targetComponentId: string;
}

const DEFAULT_SEARCH_BAR_STATE = {
  placeholder: 'Search for anything...',
  buttonText: 'Search',
  backgroundColor: '#ffffff',
  textColor: '#1a202c',
  buttonColor: '#667eea',
  buttonTextColor: '#ffffff',
  showButton: true,
  borderRadius: 8,
  iconColor: '#a0aec0',
  alignment: 'center' as const,
  maxWidth: '600px',
};

export default function SearchBarSettings({
  targetComponentId,
}: SearchBarSettingsProps) {
  const s = usePageBuilderStore(
    (state) => state.searchBar[targetComponentId] ?? DEFAULT_SEARCH_BAR_STATE,
  );
  const set = usePageBuilderStore((state) => state.setSearchBar);
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
        <label style={labelStyle}>Placeholder Text</label>
        <input
          style={inputStyle}
          value={s.placeholder}
          onChange={(e) => u({ placeholder: e.target.value })}
          placeholder="Search..."
        />
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>Max Width</label>
        <input
          style={inputStyle}
          value={s.maxWidth}
          onChange={(e) => u({ maxWidth: e.target.value })}
          placeholder="e.g. 600px or 100%"
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

      <div style={sectionStyle}>
        <label style={labelStyle}>Border Radius (px)</label>
        <input
          type="number"
          style={inputStyle}
          value={s.borderRadius}
          onChange={(e) => u({ borderRadius: parseInt(e.target.value) || 0 })}
          min="0"
          max="100"
        />
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
        <div style={sectionStyle}>
          <label style={labelStyle}>Button Text</label>
          <input
            style={inputStyle}
            value={s.buttonText}
            onChange={(e) => u({ buttonText: e.target.value })}
            placeholder="Search"
          />
        </div>
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
            <label style={{ ...labelStyle, fontSize: '0.7rem' }}>Icon</label>
            <input
              type="color"
              style={{
                width: '100%',
                height: '32px',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              value={s.iconColor || '#a0aec0'}
              onChange={(e) => u({ iconColor: e.target.value })}
            />
          </div>
          {s.showButton && (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
