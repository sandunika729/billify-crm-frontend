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
  const [touched, setTouched] = useState({ tenantSlug: false, email: false, password: false });

  const handleBlur = (field) => setTouched((prev) => ({ ...prev, [field]: true }));

  const getEmailError = () => {
    if (!touched.email) return '';
    if (!email.trim()) return 'Email address is required.';
    if (!email.includes('@')) return "Please include an '@' in the email address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a complete email address.";
    return '';
  };

  const fieldErrors = {
    tenantSlug: touched.tenantSlug && !tenantSlug.trim() ? 'Business name is required.' : '',
    email: getEmailError(),
    password: touched.password && !password.trim() ? 'Password is required.' : '',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password, tenantSlug);
    
    if (!result.success) {
      setError('Invalid business name, email, or password.');
      setLoading(false);
    }
    
  };

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isSubmitDisabled = !tenantSlug.trim() || !isEmailValid || !password.trim() || loading;

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
                onBlur={() => handleBlur('tenantSlug')}
                placeholder="Enter business name"
                className={fieldErrors.tenantSlug ? styles.inputError : ''}
                required
              />
            </div>
            {fieldErrors.tenantSlug && <span className={styles.fieldError}>{fieldErrors.tenantSlug}</span>}
          </div>

          <div className={styles.inputGroup}>
            <label>Email Address</label>
            <div className={styles.inputWrapper}>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur('email')}
                placeholder="Enter email or username"
                className={fieldErrors.email ? styles.inputError : ''}
                required
              />
            </div>
            {fieldErrors.email && <span className={styles.fieldError}>{fieldErrors.email}</span>}
          </div>

          <div className={styles.inputGroup}>
            <label>Password</label>
            <div className={styles.inputWrapper}>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur('password')}
                placeholder="Enter password"
                className={fieldErrors.password ? styles.inputError : ''}
                required
              />
            </div>
            {fieldErrors.password && <span className={styles.fieldError}>{fieldErrors.password}</span>}
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
