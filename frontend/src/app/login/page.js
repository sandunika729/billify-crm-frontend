'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './page.module.css';

export default function LoginPage() {
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password, tenantSlug);
    
    if (!result.success) {
      setError(result.message);
      setLoading(false);
    }
    
  };

  const isSubmitDisabled = !tenantSlug.trim() || !email.trim() || !password.trim() || loading;

  return (
    <div className={styles.loginContainer}>
      <div className={styles.glassPanel}>
        <div className={styles.brandHeader}>
          <h1>Billify CRM</h1>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <div className={styles.inputGroup}>
            <label>Business Name</label>
            <div className={styles.inputWrapper}>
              <input 
                type="text" 
                value={tenantSlug}
                onChange={(e) => setTenantSlug(e.target.value)}
                placeholder="Enter business name"
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Email Address</label>
            <div className={styles.inputWrapper}>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email or username"
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Password</label>
            <div className={styles.inputWrapper}>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className={`${styles.submitButton} ${loading ? styles.loading : ''}`}
            disabled={isSubmitDisabled}
          >
            <span>{loading ? 'Authenticating...' : 'Login'}</span>
          </button>
        </form>


      </div>
    </div>
  );
}
