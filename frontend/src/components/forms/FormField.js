import React from 'react';
import styles from './FormField.module.css';

export default function FormField({ 
  label, 
  type = 'text', 
  name, 
  value, 
  onChange, 
  error, 
  placeholder,
  required = false,
  options = [], 
  rows = 4, 
  disabled = false
}) {
  const renderInput = () => {
    if (type === 'select') {
      return (
        <select 
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          className={`${styles.input} ${styles.select} ${error ? styles.inputError : ''}`}
          disabled={disabled}
        >
          <option value="" disabled>{placeholder || 'Select an option'}</option>
          {options.map((opt, i) => (
            <option key={i} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      );
    }

    if (type === 'textarea') {
      return (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          className={`${styles.input} ${styles.textarea} ${error ? styles.inputError : ''}`}
          disabled={disabled}
        />
      );
    }

    return (
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${styles.input} ${error ? styles.inputError : ''}`}
        disabled={disabled}
      />
    );
  };

  return (
    <div className={styles.fieldContainer}>
      {label && (
        <label htmlFor={name} className={styles.label}>
          {label} {required && <span className={styles.required}>*</span>}
        </label>
      )}
      {renderInput()}
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
}
