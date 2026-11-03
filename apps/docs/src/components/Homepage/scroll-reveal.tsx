import React, { useEffect, useRef, useState } from 'react';
import styles from './styles/scroll-reveal.module.css';

export interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function ScrollReveal({
  children,
  delay = 0,
  className = '',
  style = {},
}: ScrollRevealProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
    if (!ref.current) return;

    if (
      typeof window === 'undefined' ||
      !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setIsRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -30px 0px',
      },
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);

  // Before hydration / if JS is disabled, content remains visible by default.
  // Once hydrated and observer is attached, non-revealed sections receive the hidden class until scrolled into view.
  const isHidden = isClient && !isRevealed;

  return (
    <div
      ref={ref}
      className={`${styles.revealWrapper} ${isHidden ? styles.hidden : styles.visible} ${className}`}
      style={{
        ...style,
        transitionDelay: isRevealed && delay > 0 ? `${delay}ms` : undefined,
      }}
    >
      {children}
    </div>
  );
}
