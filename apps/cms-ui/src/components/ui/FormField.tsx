import React from 'react';
import { FieldShell } from './FieldShell';

export type SelectOption = {
  label: string;
  value: string;
};

export type BaseFormFieldProps = {
  name: string;
  id?: string;
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  autoComplete?: string;
};

export type TextInputFieldProps = BaseFormFieldProps & {
  type: 'text' | 'email' | 'password' | 'number';
  value: string | number;
  placeholder?: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
};

export type SelectFieldProps = BaseFormFieldProps & {
  type: 'select';
  value: string;
  options: SelectOption[];
  placeholder?: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
};

export type CheckboxOrSwitchFieldProps = BaseFormFieldProps & {
  type: 'checkbox' | 'switch';
  checked: boolean;
  onChange: (checked: boolean) => void;
  onBlur?: () => void;
};

export type TextAreaFieldProps = BaseFormFieldProps & {
  type: 'textarea';
  value: string;
  rows?: number;
  placeholder?: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
};

export type FormFieldProps =
  | TextInputFieldProps
  | SelectFieldProps
  | CheckboxOrSwitchFieldProps
  | TextAreaFieldProps;

/**
 * Universal FormField primitive with discriminated union on `props.type`.
 * Ensures full WCAG AA accessibility, aria-invalid, aria-describedby,
 * and Enter-to-submit behavior.
 */
export const FormField: React.FC<FormFieldProps> = (props) => {
  const {
    name,
    id = name,
    label,
    error,
    description,
    required = false,
    disabled = false,
    className = '',
  } = props;

  const describedBy = error
    ? `${id}-error`
    : description
      ? `${id}-description`
      : undefined;

  const baseInputClasses =
    'w-full px-3 py-2 text-sm rounded-lg border bg-background text-foreground transition-colors duration-150 ' +
    'placeholder:text-muted-foreground/60 ' +
    'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ' +
    'disabled:opacity-50 disabled:cursor-not-allowed ' +
    (error ? 'border-destructive focus:ring-destructive' : 'border-border');

  if (props.type === 'checkbox' || props.type === 'switch') {
    return (
      <div className={`space-y-1 ${className}`}>
        <div className="flex items-center gap-2.5">
          <input
            id={id}
            name={name}
            type="checkbox"
            checked={props.checked}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            onChange={(e) => props.onChange(e.target.checked)}
            onBlur={props.onBlur}
            className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50 cursor-pointer"
          />
          <label
            htmlFor={id}
            className="text-sm font-medium text-foreground select-none cursor-pointer"
          >
            {label}
            {required && (
              <span className="text-destructive ml-1" aria-hidden="true">
                *
              </span>
            )}
          </label>
        </div>
        {description && !error && (
          <p
            id={`${id}-description`}
            className="text-xs text-muted-foreground ml-6"
          >
            {description}
          </p>
        )}
        {error && (
          <p
            id={`${id}-error`}
            role="alert"
            aria-live="assertive"
            className="text-xs text-destructive font-medium ml-6 mt-1"
          >
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <FieldShell
      id={id}
      label={label}
      error={error}
      description={description}
      required={required}
      className={className}
    >
      {props.type === 'select' ? (
        <select
          id={id}
          name={name}
          value={props.value}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          onChange={(e) => props.onChange(e.target.value)}
          onBlur={props.onBlur}
          className={`${baseInputClasses} cursor-pointer`}
        >
          {props.placeholder && (
            <option value="" disabled>
              {props.placeholder}
            </option>
          )}
          {props.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : props.type === 'textarea' ? (
        <textarea
          id={id}
          name={name}
          value={props.value}
          rows={props.rows ?? 4}
          placeholder={props.placeholder}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          onChange={(e) => props.onChange(e.target.value)}
          onBlur={props.onBlur}
          className={baseInputClasses}
        />
      ) : props.type === 'text' ||
        props.type === 'email' ||
        props.type === 'password' ||
        props.type === 'number' ? (
        <input
          id={id}
          name={name}
          type={props.type}
          value={props.value}
          placeholder={props.placeholder}
          autoComplete={props.autoComplete}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          onChange={(e) => props.onChange(e.target.value)}
          onBlur={props.onBlur}
          className={baseInputClasses}
        />
      ) : null}
    </FieldShell>
  );
};
