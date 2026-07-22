import React, { useState, useEffect, useRef } from 'react';
import styles from './ColumnManager.module.css';

// Custom column manager SVG icon
const ColumnIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="2" width="3.5" height="11" rx="1" stroke="currentColor" strokeWidth="1.3"/>
    <rect x="5.75" y="2" width="3.5" height="11" rx="1" stroke="currentColor" strokeWidth="1.3"/>
    <rect x="10.5" y="2" width="3.5" height="11" rx="1" stroke="currentColor" strokeWidth="1.3"/>
  </svg>
);

export default function ColumnManager({ columns, visibleColumns, onColumnToggle }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button 
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        title="Manage Columns"
      >
        <ColumnIcon />
      </button>
      
      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>Columns</div>
          <div className={styles.columnList}>
            {columns.map(col => (
              <label key={col.id} className={`${styles.columnItem} ${col.required ? styles.required : ''}`}>
                <input 
                  type="checkbox" 
                  checked={visibleColumns.includes(col.id)}
                  onChange={() => {
                    if (!col.required) {
                      onColumnToggle(col.id);
                    }
                  }}
                  disabled={col.required}
                  className={styles.checkbox}
                />
                <span className={styles.columnName}>{col.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
