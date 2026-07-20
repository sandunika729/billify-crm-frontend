'use client';

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setAccessToken } from '../services/api';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [activeTenant, setActiveTenant] = useState(null);
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const refreshRes = await api.post('/auth/refresh');
        const { accessToken } = refreshRes.data.data;
        setAccessToken(accessToken);

        const meRes = await api.get('/auth/me');
        setUser(meRes.data.data);
        setActiveTenant(meRes.data.data.tenant);

        const companiesRes = await api.get('/auth/my-companies');
        setAvailableCompanies(companiesRes.data.data);
      } catch {
        setAccessToken(null);
        setUser(null);
        setActiveTenant(null);
        setAvailableCompanies([]);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      
      if (res.data.data.requiresCompanySelection) {
        return {
          success: true,
          requiresCompanySelection: true,
          selectionToken: res.data.data.selectionToken,
          companies: res.data.data.companies,
        };
      }

      const { accessToken, user: userData, tenant } = res.data.data;
      setAccessToken(accessToken);
      setUser({ ...userData, tenant });
      setActiveTenant(tenant);

      const companiesRes = await api.get('/auth/my-companies');
      setAvailableCompanies(companiesRes.data.data);

      router.push('/crm');
      return { success: true, requiresCompanySelection: false };
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please check your credentials.',
      };
    }
  };

  const selectCompany = async (selectionToken, tenantId) => {
    try {
      const res = await api.post('/auth/select-company', { selectionToken, tenantId });
      const { accessToken, user: userData, tenant } = res.data.data;
      setAccessToken(accessToken);
      setUser({ ...userData, tenant });
      setActiveTenant(tenant);

      const companiesRes = await api.get('/auth/my-companies');
      setAvailableCompanies(companiesRes.data.data);

      router.push('/crm');
      return { success: true };
    } catch (error) {
      console.error('Company selection failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to select company.',
      };
    }
  };

  const switchCompany = async (tenantId) => {
    try {
      const res = await api.post('/auth/switch-company', { tenantId });
      const { accessToken, user: userData, tenant } = res.data.data;
      setAccessToken(accessToken);
      setUser({ ...userData, tenant });
      setActiveTenant(tenant);
      
      // Force reload to clear any cached data in state for the old company
      window.location.href = '/crm/dashboard';
      return { success: true };
    } catch (error) {
      console.error('Failed to switch company:', error);
      return { success: false };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAccessToken(null);
      setUser(null);
      setActiveTenant(null);
      setAvailableCompanies([]);
      router.push('/login');
    }
  };

  const value = {
    user,
    activeTenant,
    availableCompanies,
    loading,
    login,
    selectCompany,
    switchCompany,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : <div className="loading-screen">Loading CRM...</div>}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
