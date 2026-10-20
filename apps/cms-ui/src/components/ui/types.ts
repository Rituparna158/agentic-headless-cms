import type { LucideIcon } from 'lucide-react';

export interface InlineErrorAlertProps {
  title?: string;
  message?: string | Error | null;
  onRetry?: () => void;
  isRetrying?: boolean;
  onBack?: () => void;
  backText?: string;
  className?: string;
}

export interface EmptyStateCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  tip?: string;
  className?: string;
}

export interface LiveAnnouncerContextValue {
  announce: (message: string, politeness?: 'polite' | 'assertive') => void;
}

export interface LiveStatusBannerProps {
  message: string;
  politeness?: 'polite' | 'assertive';
  className?: string;
  visible?: boolean;
}
