import React from 'react';
import styles from './FilterSelect.module.css';

export default function FilterSelect({
  value = '',
  onChange,
  options = [],
  label = 'Filter',
  placeholder = 'All',
  id,
  className = '',
}) {
  const showLabel = label !== '' && label != null;
  return (
    <div className={`${styles.filterGroup} ${className}`}>
      {showLabel && <label className={styles.label} htmlFor={id}>{label}</label>}
      <select
        id={id}
        className={styles.select}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
