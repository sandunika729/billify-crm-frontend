import React from 'react';
import styles from './StatusBadge.module.css';
import { getStatusColor, getStatusBgColor, getPriorityColor, getPriorityBgColor } from '../../utils/formatters';

export default function StatusBadge({ status, type = 'status', label }) {
  const displayLabel = label || (status ? status.replace(/_/g, ' ') : 'Unknown');
  
  const textColor = type === 'priority' ? getPriorityColor(status) : getStatusColor(status);
  const bgColor = type === 'priority' ? getPriorityBgColor(status) : getStatusBgColor(status);

  return (
    <span 
      className={styles.badge} 
      style={{ 
        color: textColor, 
        backgroundColor: bgColor,
        borderColor: textColor
      }}
    >
      {displayLabel}
    </span>
  );
}
