'use client';

import { useState, useEffect } from 'react';
import { subscribeToAlerts } from '@/utils/alertService';
import Button from '@/components/ui/Button';

export default function GlobalAlert() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToAlerts((payload) => {
      setAlerts((prev) => [...prev, { ...payload, id: Date.now().toString() }]);
    });
    return unsubscribe;
  }, []);

  if (alerts.length === 0) return null;

  // We only show the top-most alert to avoid stacking modals weirdly
  const currentAlert = alerts[0];

  const handleClose = (confirmed) => {
    if (confirmed && currentAlert.onConfirm) currentAlert.onConfirm();
    if (!confirmed && currentAlert.onCancel) currentAlert.onCancel();
    
    // Remove the current alert from the queue
    setAlerts((prev) => prev.slice(1));
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>{currentAlert.title || 'Alert'}</h3>
        </div>
        <div style={styles.body}>
          <p style={styles.message}>{currentAlert.message}</p>
        </div>
        <div style={styles.footer}>
          {currentAlert.type === 'confirm' && (
            <Button variant="secondary" onClick={() => handleClose(false)}>
              Cancel
            </Button>
          )}
          <Button variant="primary" onClick={() => handleClose(true)}>
            OK
          </Button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(4px)',
    zIndex: 99999, // Ensure it's on top of everything
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  modal: {
    backgroundColor: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: '16px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '420px',
    overflow: 'hidden',
    animation: 'modalSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  header: {
    padding: '20px 24px 12px 24px',
  },
  title: {
    margin: 0,
    fontSize: '1.15rem',
    fontWeight: '600',
    color: 'var(--color-text)',
  },
  body: {
    padding: '0 24px 24px 24px',
  },
  message: {
    margin: 0,
    fontSize: '0.95rem',
    color: 'var(--color-text-muted)',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap', // Respect newlines in messages
  },
  footer: {
    padding: '16px 24px',
    backgroundColor: 'var(--color-bg-alt)',
    borderTop: '1px solid var(--color-border)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  }
};
