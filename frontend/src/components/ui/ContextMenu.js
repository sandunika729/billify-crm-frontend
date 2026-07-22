import React, { useEffect, useRef, useState } from 'react';
import styles from './ContextMenu.module.css';

/**
 * @param {Object} props
 * @param {number} props.x - X coordinate for the menu
 * @param {number} props.y - Y coordinate for the menu
 * @param {Function} props.onClose - Callback to close the menu
 * @param {Array} props.items - Array of objects { label, icon: Icon, onClick, variant, disabled }
 */
export default function ContextMenu({ x, y, onClose, items }) {
  const menuRef = useRef(null);
  const [position, setPosition] = useState({ top: y, left: x });

  useEffect(() => {
    // Adjust position if it goes off-screen
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      let newLeft = x;
      let newTop = y;

      if (x + rect.width > windowWidth) {
        newLeft = windowWidth - rect.width - 10;
      }
      
      if (y + rect.height > windowHeight) {
        newTop = windowHeight - rect.height - 10;
      }

      setPosition({ left: newLeft, top: newTop });
    }
  }, [x, y]);

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <div 
        ref={menuRef}
        className={styles.contextMenu} 
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
      >
        {items.map((item, index) => (
          <button
            key={index}
            className={`${styles.menuItem} ${item.variant === 'danger' ? styles.danger : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!item.disabled) {
                item.onClick(e);
                onClose();
              }
            }}
            disabled={item.disabled}
          >
            {item.icon && <item.icon size={14} className={styles.icon} />}
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}
