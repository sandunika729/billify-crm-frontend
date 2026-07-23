import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

let _accessToken = null;

export const setAccessToken = (token) => { _accessToken = token; };
export const getAccessToken = () => _accessToken;

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    if (_accessToken) {
      config.headers.Authorization = `Bearer ${_accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let _isRefreshing = false;
let _failedQueue = [];

const processQueue = (error, token = null) => {
  _failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  _failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isAuthError = error.response?.status === 401;
    const isRetry = originalRequest._retry;
    const isLoginUrl = originalRequest.url?.includes('/auth/login');
    const isRefreshUrl = originalRequest.url?.includes('/auth/refresh');

    if (!isAuthError || isRetry || isLoginUrl || isRefreshUrl) {
      return Promise.reject(error);
    }

    if (_isRefreshing) {
      return new Promise((resolve, reject) => {
        _failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    _isRefreshing = true;

    try {
      const res = await axios.post(
        `${API_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );
      const { accessToken } = res.data.data;
      setAccessToken(accessToken);
      processQueue(null, accessToken);
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      setAccessToken(null);
      processQueue(refreshError, null);
      if (typeof window !== 'undefined') {
        document.cookie = "is_session_active=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        window.location.href = '/login';
      }
      return Promise.reject(refreshError);
    } finally {
      _isRefreshing = false;
    }
  }
);

export default api;
