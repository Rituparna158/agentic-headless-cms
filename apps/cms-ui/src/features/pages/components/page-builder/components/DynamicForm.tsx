import { forwardRef, useLayoutEffect, useState, useEffect } from 'react';
import {
  usePageBuilderStore,
  DYNAMIC_FORM_DEFAULTS,
} from '../stores/pageBuilderStore';

interface DynamicFormProps {
  componentId: string;
}

const DynamicForm = forwardRef<HTMLDivElement, DynamicFormProps>(
  (props, ref) => {
    const id = props.componentId ?? 'default';
    const s = usePageBuilderStore(
      (state) => state.dynamicForm[id] ?? DYNAMIC_FORM_DEFAULTS,
    );

    const [isBuilder, setIsBuilder] = useState(true);

    useEffect(() => {
      const el = document.getElementById(id);
      if (el) {
        setIsBuilder(true);
      }
    }, [id]);

    useLayoutEffect(() => {
      const el = document.getElementById(id);
      if (!el) return;
      const saved = el.getAttribute('data-pb-settings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          usePageBuilderStore.getState().setDynamicForm(id, parsed);
        } catch {
          // ignore
        }
      }
    }, [id]);

    useLayoutEffect(() => {
      const el = document.getElementById(id);
      if (el) {
        el.setAttribute('data-pb-settings', JSON.stringify(s));
      }
    }, [id, s]);

    const alignmentMap = {
      left: 'flex-start',
      center: 'center',
      right: 'flex-end',
    };

    const textAlignmentMap = {
      left: 'left' as const,
      center: 'center' as const,
      right: 'right' as const,
    };

    const inputStyle = {
      width: '100%',
      padding: '12px 16px',
      backgroundColor: s.inputBackgroundColor || '#f7fafc',
      border: `1px solid ${s.inputBorderColor || '#e2e8f0'}`,
      borderRadius: '8px',
      fontSize: '1rem',
      color: s.textColor || '#1a202c',
      outline: 'none',
      boxSizing: 'border-box' as const,
      pointerEvents: isBuilder ? ('none' as const) : ('auto' as const),
    };

    const labelStyle = {
      display: 'block',
      fontSize: '0.875rem',
      fontWeight: 600,
      marginBottom: '8px',
      color: s.textColor || '#1a202c',
    };

    const renderField = (field: (typeof s.fields)[0]) => {
      switch (field.type) {
        case 'textarea':
          return (
            <textarea
              placeholder={field.placeholder}
              required={field.required}
              readOnly={isBuilder}
              style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
            />
          );
        case 'select':
          return (
            <select
              required={field.required}
              style={inputStyle}
              disabled={isBuilder}
            >
              <option value="">
                {field.placeholder || 'Select an option'}
              </option>
              {field.options?.map((opt, i) => (
                <option key={i} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          );
        case 'radio':
          return (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              {field.options?.map((opt, i) => (
                <label
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '1rem',
                    color: s.textColor,
                  }}
                >
                  <input
                    type="radio"
                    name={field.id}
                    value={opt}
                    required={field.required}
                    readOnly={isBuilder}
                    style={{ pointerEvents: isBuilder ? 'none' : 'auto' }}
                  />
                  {opt}
                </label>
              ))}
            </div>
          );
        case 'checkbox':
          return (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              {field.options?.map((opt, i) => (
                <label
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '1rem',
                    color: s.textColor,
                  }}
                >
                  <input
                    type="checkbox"
                    name={`${field.id}[]`}
                    value={opt}
                    readOnly={isBuilder}
                    style={{ pointerEvents: isBuilder ? 'none' : 'auto' }}
                  />
                  {opt}
                </label>
              ))}
            </div>
          );
        case 'email':
        case 'text':
        default:
          return (
            <input
              type={field.type}
              placeholder={field.placeholder}
              required={field.required}
              readOnly={isBuilder}
              style={inputStyle}
            />
          );
      }
    };

    return (
      <div
        ref={ref}
        id={id}
        data-pb-settings={JSON.stringify(s)}
        style={{
          backgroundColor: s.backgroundColor || '#ffffff',
          padding: '60px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: alignmentMap[s.alignment] || 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '600px',
            textAlign: textAlignmentMap[s.alignment] || 'center',
            pointerEvents: isBuilder ? 'none' : 'auto',
          }}
        >
          {s.title && (
            <h2
              style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                marginBottom: '16px',
                color: s.textColor || '#1a202c',
              }}
            >
              {s.title}
            </h2>
          )}
          {s.subtitle && (
            <p
              style={{
                fontSize: '1.125rem',
                color: s.textColor,
                opacity: 0.8,
                marginBottom: '40px',
                lineHeight: 1.6,
              }}
            >
              {s.subtitle}
            </p>
          )}

          <form
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              textAlign: 'left',
            }}
            onSubmit={(e) => {
              if (isBuilder) e.preventDefault();
            }}
          >
            {!s.fields || s.fields.length === 0 ? (
              <div
                style={{
                  padding: '24px',
                  border: '2px dashed #cbd5e0',
                  borderRadius: '8px',
                  textAlign: 'center',
                  backgroundColor: '#f7fafc',
                  color: '#718096',
                  fontSize: '1rem',
                }}
              >
                <p style={{ margin: '0 0 8px 0', fontWeight: 600 }}>
                  This form is currently empty.
                </p>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>
                  Select this component and use the{' '}
                  <strong>Fields Builder</strong> in the Settings panel to add
                  your custom fields.
                </p>
              </div>
            ) : (
              <>
                {s.fields.map((field) => (
                  <div key={field.id}>
                    <label style={labelStyle}>
                      {field.label}{' '}
                      {field.required && (
                        <span style={{ color: '#e53e3e' }}>*</span>
                      )}
                    </label>
                    {renderField(field)}
                  </div>
                ))}

                <div
                  style={{
                    marginTop: '12px',
                    textAlign: textAlignmentMap[s.alignment] || 'center',
                  }}
                >
                  <button
                    type="submit"
                    style={{
                      padding: '14px 32px',
                      backgroundColor: s.buttonColor || '#667eea',
                      color: s.buttonTextColor || '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '1rem',
                      cursor: isBuilder ? 'default' : 'pointer',
                      transition: 'opacity 0.2s',
                      pointerEvents: isBuilder ? 'none' : 'auto',
                      width: s.alignment === 'center' ? '100%' : 'auto',
                    }}
                  >
                    {s.buttonText || 'Submit'}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    );
  },
);

DynamicForm.displayName = 'DynamicForm';
export default DynamicForm;
