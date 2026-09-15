/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import {
  usePageBuilderStore,
  DynamicFormField,
} from '../stores/pageBuilderStore';

interface DynamicFormSettingsProps {
  targetComponentId: string;
}

const DEFAULT_STATE = {
  title: 'Custom Form',
  subtitle: 'Please fill out this form.',
  fields: [] as DynamicFormField[],
  buttonText: 'Submit',
  backgroundColor: '#ffffff',
  textColor: '#1a202c',
  inputBackgroundColor: '#f7fafc',
  inputBorderColor: '#e2e8f0',
  buttonColor: '#667eea',
  buttonTextColor: '#ffffff',
  alignment: 'center' as const,
};

export default function DynamicFormSettings({
  targetComponentId,
}: DynamicFormSettingsProps) {
  const s = usePageBuilderStore(
    (state) => state.dynamicForm[targetComponentId] ?? DEFAULT_STATE,
  );
  const set = usePageBuilderStore((state) => state.setDynamicForm);
  const u = (patch: Partial<typeof s>) => set(targetComponentId, patch);

  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null);

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '0.875rem',
    outline: 'none',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box' as const,
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

  const updateField = (id: string, patch: Partial<DynamicFormField>) => {
    const newFields = s.fields.map((f) =>
      f.id === id ? { ...f, ...patch } : f,
    );
    u({ fields: newFields });
  };

  const addField = () => {
    const newField: DynamicFormField = {
      id: `field-${Date.now()}`,
      type: 'text',
      label: 'New Field',
      placeholder: '',
      required: false,
    };
    u({ fields: [...(s.fields || []), newField] });
    setExpandedFieldId(newField.id);
  };

  const removeField = (id: string) => {
    u({ fields: s.fields.filter((f) => f.id !== id) });
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
          value={s.title || ''}
          onChange={(e) => u({ title: e.target.value })}
          placeholder="Form Title"
        />
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>Subtitle</label>
        <textarea
          style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
          value={s.subtitle || ''}
          onChange={(e) => u({ subtitle: e.target.value })}
          placeholder="Form Subtitle"
        />
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>Alignment</label>
        <select
          style={inputStyle}
          value={s.alignment || 'center'}
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
          borderTop: '1px solid #e2e8f0',
          paddingTop: '16px',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <label style={{ ...labelStyle, margin: 0 }}>Fields Builder</label>
          <button
            onClick={addField}
            style={{
              padding: '6px 12px',
              backgroundColor: '#4299e1',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              fontWeight: 600,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            + Add Field
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {s.fields?.map((field) => (
            <div
              key={field.id}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  backgroundColor: '#f7fafc',
                  cursor: 'pointer',
                  borderBottom:
                    expandedFieldId === field.id ? '1px solid #e2e8f0' : 'none',
                }}
                onClick={() =>
                  setExpandedFieldId(
                    expandedFieldId === field.id ? null : field.id,
                  )
                }
              >
                <span
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#2d3748',
                  }}
                >
                  {field.label || 'Unnamed Field'}{' '}
                  <span style={{ opacity: 0.5, fontWeight: 'normal' }}>
                    ({field.type})
                  </span>
                </span>
                <span style={{ fontSize: '0.75rem', color: '#a0aec0' }}>
                  {expandedFieldId === field.id ? '▲' : '▼'}
                </span>
              </div>

              {expandedFieldId === field.id && (
                <div
                  style={{
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div>
                    <label style={labelStyle}>Label</label>
                    <input
                      style={inputStyle}
                      value={field.label}
                      onChange={(e) =>
                        updateField(field.id, { label: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Type</label>
                    <select
                      style={inputStyle}
                      value={field.type}
                      onChange={(e) =>
                        updateField(field.id, { type: e.target.value as any })
                      }
                    >
                      <option value="text">Short Text</option>
                      <option value="email">Email</option>
                      <option value="textarea">Long Text</option>
                      <option value="select">Dropdown (Select)</option>
                      <option value="radio">Radio Buttons</option>
                      <option value="checkbox">Checkboxes</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Placeholder (optional)</label>
                    <input
                      style={inputStyle}
                      value={field.placeholder || ''}
                      onChange={(e) =>
                        updateField(field.id, { placeholder: e.target.value })
                      }
                    />
                  </div>

                  {['select', 'radio', 'checkbox'].includes(field.type) && (
                    <div>
                      <label style={labelStyle}>
                        Options (comma separated)
                      </label>
                      <input
                        style={inputStyle}
                        value={field.options?.join(', ') || ''}
                        onChange={(e) => {
                          const options = e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean);
                          updateField(field.id, { options });
                        }}
                        placeholder="Option 1, Option 2, Option 3"
                      />
                    </div>
                  )}

                  <div>
                    <label
                      style={{
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) =>
                          updateField(field.id, { required: e.target.checked })
                        }
                      />
                      Required Field
                    </label>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      marginTop: '8px',
                    }}
                  >
                    <button
                      onClick={() => removeField(field.id)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#fed7d7',
                        color: '#c53030',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Delete Field
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {(!s.fields || s.fields.length === 0) && (
            <p
              style={{
                fontSize: '0.875rem',
                color: '#a0aec0',
                textAlign: 'center',
                margin: '16px 0',
              }}
            >
              No fields added yet.
            </p>
          )}
        </div>
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>Button Text</label>
        <input
          style={inputStyle}
          value={s.buttonText || ''}
          onChange={(e) => u({ buttonText: e.target.value })}
          placeholder="Submit"
        />
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
