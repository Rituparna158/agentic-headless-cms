import React from 'react';
import styles from './styles/background-animation.module.css';

export function BackgroundAnimation() {
  return (
    <div className={styles.backgroundContainer} aria-hidden="true">
      <div className={styles.gridPattern} />
      <div className={styles.auraCenter} />
      <div className={styles.orbPrimary} />
      <div className={styles.orbSecondary} />
      <div className={styles.orbTertiary} />
    </div>
  );
}
