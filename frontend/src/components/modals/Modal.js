import React, { useEffect } from 'react';
import styles from './Modal.module.css';
import { X } from 'lucide-react';

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer, 
  maxWidth = '500px',
  showClose = true,
  alignTop = false,
  hideScrollbar = false,
  noHeaderBorder = false
}) {
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className={`${styles.overlay} ${alignTop ? styles.alignTop : ''}`} 
      onClick={onClose}
    >
      <div 
        className={styles.modal} 
        style={{ maxWidth }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className={styles.header} 
          style={{ 
            ...(noHeaderBorder ? { borderBottom: 'none', paddingBottom: '0' } : {}),
            justifyContent: 'center'
          }}
        >
          {title && <h2 className={styles.title}>{title}</h2>}
          {showClose && (
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
              <X size={20} />
            </button>
          )}
        </div>
        
        <div className={`${styles.content} ${hideScrollbar ? styles.hideScrollbar : ''}`}>
          {children}
        </div>
        
        {footer && (
          <div className={styles.footer}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
