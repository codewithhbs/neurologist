import { createContext, useContext, useEffect, useState } from 'react';
import client, { setAdminToken, clearAdminToken, getAdminToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) { setLoading(false); return; }
    client.get('/auth/me')
      .then((res) => setAdmin(res.data.admin))
      .catch(() => clearAdminToken())
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await client.post('/auth/login', { email, password });
    setAdminToken(res.data.token);
    setAdmin(res.data.admin);
    return res.data.admin;
  };

  const logout = () => {
    clearAdminToken();
    setAdmin(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
