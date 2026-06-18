'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setAccessToken } from '../services/api';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
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
      } catch {
        
        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  
  const login = async (email, password, tenantSlug) => {
    try {
      const res = await api.post('/auth/login', { email, password, tenantSlug });
      const { accessToken, user: userData, tenant } = res.data.data;

      
      
      setAccessToken(accessToken);
      setUser({ ...userData, tenant });

      router.push('/crm');
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please check your credentials.',
      };
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
      router.push('/login');
    }
  };

  const value = {
    user,
    loading,
    login,
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
