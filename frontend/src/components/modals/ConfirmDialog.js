import React from 'react';
import Modal from './Modal';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import styles from './ConfirmDialog.module.css';

export default function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action', 
  message = 'Are you sure you want to proceed?', 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  type = 'warning', 
  isLoading = false
}) {
  const getIcon = () => {
    switch(type) {
      case 'danger': return <AlertTriangle size={32} className={styles.iconDanger} />;
      case 'warning': return <AlertTriangle size={32} className={styles.iconWarning} />;
      case 'success': return <CheckCircle size={32} className={styles.iconSuccess} />;
      default: return <Info size={32} className={styles.iconInfo} />;
    }
  };

  const getConfirmBtnClass = () => {
    switch(type) {
      case 'danger': return styles.btnDanger;
      case 'warning': return styles.btnWarning;
      case 'success': return styles.btnSuccess;
      default: return styles.btnPrimary;
    }
  };

  const footer = (
    <>
      <button 
        className={styles.btnCancel} 
        onClick={onClose}
        disabled={isLoading}
      >
        {cancelText}
      </button>
      <button 
        className={`${styles.btnConfirm} ${getConfirmBtnClass()}`} 
        onClick={onConfirm}
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : confirmText}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer} maxWidth="450px">
      <div className={styles.dialogContent}>
        <div className={styles.iconContainer}>
          {getIcon()}
        </div>
        <p className={styles.message}>{message}</p>
      </div>
    </Modal>
  );
}
