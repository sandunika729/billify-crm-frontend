'use client';

import { useState, useEffect } from 'react';
import { subscribeToAlerts } from '@/utils/alertService';
import styles from './GlobalAlert.module.css';

export default function GlobalAlert() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToAlerts((payload) => {
      setAlerts((prev) => [...prev, { ...payload, id: Date.now().toString() }]);
    });
    return unsubscribe;
  }, []);

  if (alerts.length === 0) return null;

  const current = alerts[0];
  const isConfirm = current.type === 'confirm';

  const handleClose = (confirmed) => {
    if (confirmed && current.onConfirm) current.onConfirm();
    if (!confirmed && current.onCancel) current.onCancel();
    setAlerts((prev) => prev.slice(1));
  };

  const icon = isConfirm ? (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="rgba(245,158,11,0.15)" stroke="rgba(245,158,11,0.8)" strokeWidth="1.5"/>
      <path d="M12 8v4m0 4h.01" stroke="rgba(245,158,11,1)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ) : (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="rgba(99,102,241,0.15)" stroke="rgba(99,102,241,0.8)" strokeWidth="1.5"/>
      <path d="M12 8v4m0 4h.01" stroke="rgba(99,102,241,1)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );

  const title = current.title || (isConfirm ? 'Confirm Action' : 'Alert');

  return (
    <div
      className={styles.overlay}
      onClick={(e) => { if (e.target === e.currentTarget && !isConfirm) handleClose(true); }}
    >
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="global-alert-title">
        <div className={styles.body}>
          <span className={styles.icon}>{icon}</span>
          <div>
            <h3 className={styles.title} id="global-alert-title">{title}</h3>
            <p className={styles.message}>{current.message}</p>
          </div>
        </div>
        <div className={styles.footer}>
          {isConfirm && (
            <button className={styles.btnCancel} onClick={() => handleClose(false)}>
              Cancel
            </button>
          )}
          <button className={styles.btnOk} autoFocus onClick={() => handleClose(true)}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
