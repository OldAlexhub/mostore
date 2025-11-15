import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const res = await api.get('/api/auth/me');
      setUser(res.data.user);
    } catch (err) {
      // try silent refresh if available
      try {
        const r = await api.post('/api/auth/refresh');
        if (r && r.ok) {
          // refresh succeeded, now fetch /me again
          const res2 = await api.get('/api/auth/me');
          setUser(res2.data.user);
          return;
        }
      } catch (e) {
        // ignore
      }
      setUser(null);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchMe(); }, []);

  // allow consumers to refresh the current user (e.g., after profile update)
  const refresh = async () => { await fetchMe(); };

  const login = async (username, password) => {
    const res = await api.post('/api/users/login', { username, password });
      // server sets token and refresh cookies. If the response includes user info,
    // update context immediately so UI reflects login without waiting for fetch.
    if (res.data && res.data.user) setUser(res.data.user);
    // Do not call fetchMe() immediately — some browsers may not have stored
    // the httpOnly cookie yet on the follow-up request. We rely on the
    // returned user object for immediate UI update; the initial fetchMe on
    // app load will validate the session.
    return res.data;
  };

  const register = async (payload) => {
    const res = await api.post('/api/users', payload);
    if (res.data && res.data.user) setUser(res.data.user);
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      // ignore errors from logout call (e.g., token already expired)
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
