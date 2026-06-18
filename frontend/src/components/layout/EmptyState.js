import React from 'react';
import styles from './EmptyState.module.css';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className={styles.emptyStateContainer}>
      <div className={styles.iconWrapper}>
        {Icon && <Icon size={48} />}
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {action && <div className={styles.actionWrapper}>{action}</div>}
    </div>
  );
}
