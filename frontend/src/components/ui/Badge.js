import React from 'react';
import styles from './Badge.module.css';

export default function Badge({ children, variant = 'default', style, className = '' }) {
  return (
    <span
      className={`${styles.badge} ${styles[variant] || styles.default} ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}
