import React, { useEffect, useRef } from 'react';
import styles from './ContextMenu.module.css';

export default function ContextMenu({ isOpen, position, actions, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const menuWidth = 160;
  const menuHeight = actions.filter(Boolean).length * 32 + 8; // estimate height
  
  let posX = position.x;
  let posY = position.y;
  
  if (typeof window !== 'undefined') {
    if (posX + menuWidth > window.innerWidth) {
      posX = window.innerWidth - menuWidth - 8;
    }
    if (posY + menuHeight > window.innerHeight) {
      posY = window.innerHeight - menuHeight - 8;
    }
  }

  return (
    <div 
      ref={menuRef}
      className={styles.menu} 
      style={{ top: `${posY}px`, left: `${posX}px` }}
    >
      {actions.map((action, index) => {
        if (!action) return null;
        const Icon = action.icon;
        return (
          <button 
            key={index} 
            className={`${styles.menuItem} ${action.danger ? styles.danger : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
              onClose();
            }}
          >
            {Icon && <Icon size={14} />}
            <span>{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
