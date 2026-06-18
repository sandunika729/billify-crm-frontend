import React from 'react';
import styles from './PageHeader.module.css';

export default function PageHeader({ title, description, actions, children }) {
  return (
    <div className={styles.headerContainer}>
      <div className={styles.titleSection}>
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
        {children}
      </div>
      {actions && (
        <div className={styles.actionsSection}>
          {actions}
        </div>
      )}
    </div>
  );
}
