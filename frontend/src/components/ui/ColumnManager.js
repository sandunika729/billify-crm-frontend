import React, { useState, useEffect, useRef } from 'react';
import styles from './ColumnManager.module.css';
import { Columns } from 'lucide-react';

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
        <Columns size={16} />
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
