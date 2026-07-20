'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import styles from './page.module.css';

export default function LoginPage() {
  const { login, selectCompany, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/crm/dashboard');
    }
  }, [isAuthenticated, router]);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  
  // Multi-company selection state
  const [needsCompanySelection, setNeedsCompanySelection] = useState(false);
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [selectionToken, setSelectionToken] = useState(null);

  const handleBlur = (field) => setTouched((prev) => ({ ...prev, [field]: true }));

  const getEmailError = () => {
    if (!touched.email) return '';
    if (!email.trim()) return 'Email address is required.';
    if (!email.includes('@')) return "Please include an '@' in the email address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a complete email address.";
    return '';
  };

  const fieldErrors = {
    email: getEmailError(),
    password: touched.password && !password.trim() ? 'Password is required.' : '',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);
    
    if (result.success) {
      if (result.requiresCompanySelection) {
        setNeedsCompanySelection(true);
        setAvailableCompanies(result.companies);
        setSelectionToken(result.selectionToken);
        setLoading(false);
      }
      // If not requiring selection, AuthContext already handles redirect
    } else {
      setError(result.message || 'Invalid email or password.');
      setLoading(false);
    }
  };

  const handleSelectCompany = async (tenantId) => {
    setLoading(true);
    setError('');
    
    const result = await selectCompany(selectionToken, tenantId);
    if (!result.success) {
      setError(result.message || 'Failed to select company.');
      setLoading(false);
    }
  };

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isSubmitDisabled = !isEmailValid || !password.trim() || loading;

  return (
    <div className={styles.loginContainer}>
      <div className={styles.glassPanel}>
        <div className={styles.brandHeader}>
          <h1>CRM System</h1>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        {!needsCompanySelection ? (
          <form onSubmit={handleSubmit} className={styles.loginForm}>
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
        ) : (
          <div className={styles.companySelection}>
            <h2>Select a Company</h2>
            <p>You have access to multiple companies. Please choose one to continue.</p>
            <div className={styles.companyList}>
              {availableCompanies.map((company) => (
                <button
                  key={company.id}
                  className={styles.companyButton}
                  onClick={() => handleSelectCompany(company.id)}
                  disabled={loading}
                >
                  <div className={styles.companyName}>{company.name}</div>
                  <div className={styles.companyRole}>Role: {company.role}</div>
                </button>
              ))}
            </div>
            <button 
              className={styles.cancelButton}
              onClick={() => {
                setNeedsCompanySelection(false);
                setSelectionToken(null);
                setAvailableCompanies([]);
              }}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
