import React from 'react';
import styles from './Button.module.css';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary', 
  size = 'md', 
  className = '',
  disabled = false,
  isLoading = false,
  icon: Icon = null,
  iconSize = null,
  fullWidth = false,
  ...props
}) {
  const baseClasses = styles.btn;
  const variantClasses = styles[variant] || styles.primary;
  const sizeClasses = styles[size] || styles.md;
  const widthClass = fullWidth ? styles.fullWidth : '';
  const loadingClass = isLoading ? styles.loading : '';

  const combinedClasses = `${baseClasses} ${variantClasses} ${sizeClasses} ${widthClass} ${loadingClass} ${className}`.trim();

  return (
    <button
      type={type}
      className={combinedClasses}
      onClick={onClick}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className={styles.spinner} size={iconSize || (size === 'sm' ? 14 : size === 'lg' ? 20 : 18)} />
      ) : Icon ? (
        <Icon className={styles.icon} size={iconSize || (size === 'sm' ? 14 : size === 'lg' ? 20 : 18)} />
      ) : null}

      {children && <span className={styles.content}>{children}</span>}
    </button>
  );
}
