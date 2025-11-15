import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
});

// attach CSRF header for state-changing requests using double-submit token from cookie
// no CSRF double-submit in use: keep credentials but do not attach X-CSRF-Token header
api.interceptors.request.use(config => config);

// Response interceptor: on 401 try to refresh once then retry request
api.interceptors.response.use(undefined, async (error) => {
  const original = error.config;
  if (!original || original._retry) return Promise.reject(error);
  if (error.response && error.response.status === 401) {
    original._retry = true;
    try {
      await api.post('/api/auth/refresh');
      return api(original);
    } catch (e) {
      // refresh failed, propagate original error
      return Promise.reject(error);
    }
  }
  return Promise.reject(error);
});

export default api;
