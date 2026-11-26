import React from 'react';

export interface FieldShellProps {
  id: string;
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * FieldShell provides standard accessible layout for labels, descriptions, and error alerts.
 */
export const FieldShell: React.FC<FieldShellProps> = ({
  id,
  label,
  error,
  description,
  required,
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="block text-sm font-medium text-foreground tracking-tight select-none"
        >
          {label}
          {required && (
            <span className="text-destructive ml-1" aria-hidden="true">
              *
            </span>
          )}
        </label>
      </div>
      {children}
      {description && !error && (
        <p id={`${id}-description`} className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          aria-live="assertive"
          className="text-xs text-destructive font-medium flex items-center gap-1 mt-1"
        >
          {error}
        </p>
      )}
    </div>
  );
};
