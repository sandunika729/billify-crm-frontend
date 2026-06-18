import React from 'react';
import { Search } from 'lucide-react';
import styles from './SearchBar.module.css';

export default function SearchBar({
  value = '',
  onChange,
  placeholder = 'Search...',
  label = 'Search',
  id,
  className = '',
}) {
  const showLabel = label !== '' && label != null;
  return (
    <div className={`${styles.searchGroup} ${className}`}>
      {showLabel && <label className={styles.label} htmlFor={id}>{label}</label>}
      <div className={styles.inputWrapper}>
        <input
          id={id}
          type="text"
          className={styles.input}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <Search className={styles.icon} size={16} />
      </div>
    </div>
  );
}
