import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}

export function SparklesIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      style={{ width: `${size}px`, height: `${size}px`, flexShrink: 0, ...style }}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

export function DatabaseIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      style={{ width: `${size}px`, height: `${size}px`, flexShrink: 0, ...style }}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

export function LayersIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      style={{ width: `${size}px`, height: `${size}px`, flexShrink: 0, ...style }}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

export function ShieldIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      style={{ width: `${size}px`, height: `${size}px`, flexShrink: 0, ...style }}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

export function GlobeIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      style={{ width: `${size}px`, height: `${size}px`, flexShrink: 0, ...style }}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export function ActivityIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      style={{ width: `${size}px`, height: `${size}px`, flexShrink: 0, ...style }}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

export function ArrowRightIcon({ className, size = 15, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      style={{ width: `${size}px`, height: `${size}px`, flexShrink: 0, ...style }}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export function CheckIcon({ className, size = 15, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      style={{ width: `${size}px`, height: `${size}px`, flexShrink: 0, ...style }}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function CopyIcon({ className, size = 15, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      style={{ width: `${size}px`, height: `${size}px`, flexShrink: 0, ...style }}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function TerminalIcon({ className, size = 16, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      style={{ width: `${size}px`, height: `${size}px`, flexShrink: 0, ...style }}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

export function GitHubIcon({ className, size = 18, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      style={{ width: `${size}px`, height: `${size}px`, flexShrink: 0, ...style }}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export function CodeIcon({ className, size = 16, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      style={{ width: `${size}px`, height: `${size}px`, flexShrink: 0, ...style }}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}
