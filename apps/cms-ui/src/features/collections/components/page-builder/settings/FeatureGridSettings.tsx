import {
  usePageBuilderStore,
  FEATURE_GRID_DEFAULTS,
  type FeatureItem,
} from '../stores/pageBuilderStore';

interface FeatureGridSettingsProps {
  targetComponentId: string;
}

export default function FeatureGridSettings({
  targetComponentId,
}: FeatureGridSettingsProps) {
  const s = usePageBuilderStore(
    (state) => state.featureGrid[targetComponentId] ?? FEATURE_GRID_DEFAULTS,
  );
  const set = usePageBuilderStore((state) => state.setFeatureGrid);
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

  const updateFeature = (index: number, patch: Partial<FeatureItem>) => {
    const newFeatures = [...s.features];
    newFeatures[index] = { ...newFeatures[index], ...patch } as FeatureItem;
    u({ features: newFeatures });
  };

  const addFeature = () => {
    if (s.features.length >= 6) return;
    u({
      features: [
        ...s.features,
        {
          icon: '✨',
          title: 'New Feature',
          description: 'Description goes here',
        },
      ],
    });
  };

  const removeFeature = (index: number) => {
    if (s.features.length <= 1) return;
    const newFeatures = s.features.filter((_, i) => i !== index);
    u({ features: newFeatures });
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
      {/* Header */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Section Title</label>
        <input
          style={inputStyle}
          value={s.title}
          onChange={(e) => u({ title: e.target.value })}
          placeholder="Features title"
        />
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>Subtitle</label>
        <input
          style={inputStyle}
          value={s.subtitle}
          onChange={(e) => u({ subtitle: e.target.value })}
          placeholder="Features subtitle"
        />
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>Columns</label>
        <select
          style={inputStyle}
          value={s.columns}
          onChange={(e) => u({ columns: Number(e.target.value) as 2 | 3 | 4 })}
        >
          <option value={2}>2 Columns</option>
          <option value={3}>3 Columns</option>
          <option value={4}>4 Columns</option>
        </select>
      </div>

      {/* Features */}
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <label style={labelStyle}>Features ({s.features.length})</label>
          <button
            onClick={addFeature}
            disabled={s.features.length >= 6}
            style={{
              padding: '4px 8px',
              fontSize: '0.75rem',
              backgroundColor: '#667eea',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: s.features.length >= 6 ? 'not-allowed' : 'pointer',
              opacity: s.features.length >= 6 ? 0.5 : 1,
            }}
          >
            + Add
          </button>
        </div>

        {s.features.map((feature, index) => (
          <div
            key={index}
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '8px',
              backgroundColor: '#f7fafc',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#4a5568',
                }}
              >
                Feature {index + 1}
              </span>
              {s.features.length > 1 && (
                <button
                  onClick={() => removeFeature(index)}
                  style={{
                    padding: '2px 6px',
                    fontSize: '0.7rem',
                    backgroundColor: '#fed7d7',
                    color: '#c53030',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Remove
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                style={{ ...inputStyle, width: '60px' }}
                value={feature.icon}
                onChange={(e) => updateFeature(index, { icon: e.target.value })}
                placeholder="Icon"
              />
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={feature.title}
                onChange={(e) =>
                  updateFeature(index, { title: e.target.value })
                }
                placeholder="Title"
              />
            </div>
            <input
              style={inputStyle}
              value={feature.description}
              onChange={(e) =>
                updateFeature(index, { description: e.target.value })
              }
              placeholder="Description"
            />
          </div>
        ))}
      </div>

      {/* Colors */}
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
            <label style={{ ...labelStyle, fontSize: '0.7rem' }}>Cards</label>
            <input
              type="color"
              style={{
                width: '100%',
                height: '32px',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              value={s.cardBackgroundColor}
              onChange={(e) => u({ cardBackgroundColor: e.target.value })}
            />
          </div>
          <div>
            <label style={{ ...labelStyle, fontSize: '0.7rem' }}>Title</label>
            <input
              type="color"
              style={{
                width: '100%',
                height: '32px',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              value={s.titleColor}
              onChange={(e) => u({ titleColor: e.target.value })}
            />
          </div>
          <div>
            <label style={{ ...labelStyle, fontSize: '0.7rem' }}>Icons</label>
            <input
              type="color"
              style={{
                width: '100%',
                height: '32px',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              value={s.iconColor}
              onChange={(e) => u({ iconColor: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>
          Card Border Radius: {s.cardBorderRadius}px
        </label>
        <input
          type="range"
          min={0}
          max={32}
          value={s.cardBorderRadius}
          onChange={(e) => u({ cardBorderRadius: Number(e.target.value) })}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
}
