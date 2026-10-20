import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';
import type { LiveAnnouncerContextValue, LiveStatusBannerProps } from './types';

export type { LiveAnnouncerContextValue, LiveStatusBannerProps };

const LiveAnnouncerContext = createContext<LiveAnnouncerContextValue>({
  announce: () => {},
});

export const useLiveAnnouncer = () => useContext(LiveAnnouncerContext);

export const LiveAnnouncerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');

  const announce = useCallback(
    (message: string, politeness: 'polite' | 'assertive' = 'polite') => {
      if (politeness === 'assertive') {
        setAssertiveMessage('');
        setTimeout(() => setAssertiveMessage(message), 50);
      } else {
        setPoliteMessage('');
        setTimeout(() => setPoliteMessage(message), 50);
      }
    },
    [],
  );

  const value = useMemo(() => ({ announce }), [announce]);

  return (
    <LiveAnnouncerContext.Provider value={value}>
      {children}
      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
        role="status"
        data-testid="live-region-polite"
      >
        {politeMessage}
      </div>
      <div
        className="sr-only"
        aria-live="assertive"
        aria-atomic="true"
        role="alert"
        data-testid="live-region-assertive"
      >
        {assertiveMessage}
      </div>
    </LiveAnnouncerContext.Provider>
  );
};

export const LiveStatusBanner: React.FC<LiveStatusBannerProps> = ({
  message,
  politeness = 'polite',
  className = '',
  visible = false,
}) => {
  if (!message) return null;

  return (
    <div
      role={politeness === 'assertive' ? 'alert' : 'status'}
      aria-live={politeness}
      aria-atomic="true"
      className={visible ? className : `sr-only ${className}`}
    >
      {message}
    </div>
  );
};
