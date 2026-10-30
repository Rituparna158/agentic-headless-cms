import React, { useState, useEffect } from 'react';
import styles from './styles/typewriter.module.css';

export interface TypewriterProps {
  words: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  className?: string;
}

export function Typewriter({
  words,
  typingSpeed = 90,
  deletingSpeed = 45,
  pauseDuration = 2200,
  className = '',
}: TypewriterProps) {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState(words && words.length > 0 ? words[0] : '');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!words || words.length === 0) return;

    const currentWord = words[wordIndex % words.length];

    if (!isDeleting && text === currentWord) {
      const pauseTimer = setTimeout(() => {
        setIsDeleting(true);
      }, pauseDuration);
      return () => clearTimeout(pauseTimer);
    }

    const timer = setTimeout(
      () => {
        if (!isDeleting) {
          const nextText = currentWord.slice(0, text.length + 1);
          setText(nextText);
        } else {
          const nextText = currentWord.slice(0, text.length - 1);
          setText(nextText);

          if (nextText === '') {
            setIsDeleting(false);
            setWordIndex((prev) => (prev + 1) % words.length);
          }
        }
      },
      isDeleting ? deletingSpeed : typingSpeed,
    );

    return () => clearTimeout(timer);
  }, [text, isDeleting, wordIndex, words, typingSpeed, deletingSpeed, pauseDuration]);

  return (
    <span className={styles.typewriterWrapper}>
      <span className={className}>{text || '\u00A0'}</span>
      <span className={styles.cursor} aria-hidden="true">|</span>
    </span>
  );
}
