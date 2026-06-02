import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const normalize = (u) => {
    if (!u) return null;
    const id = u._id || u.id;
    return { ...u, _id: id, id };
  };

  const fetchUser = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await api.get('/auth/me');
        setUser(normalize(res.data));
      } catch {
        localStorage.removeItem('token');
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(normalize(res.data.user));
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('token', res.data.token);
    setUser(normalize(res.data.user));
    return res.data;
  };

  const guruLogin = async (email, password) => {
    const res = await api.post('/auth/guru-login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(normalize(res.data.user));
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const isGuru = () => user && ['guru', 'acharya', 'admin'].includes(user.role);
  const isAdmin = () => user && user.role === 'admin';
  const isAcharya = () => user && ['acharya', 'admin'].includes(user.role);
  const canModerate = () => user && ['guru', 'acharya', 'admin'].includes(user.role);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, guruLogin, logout, isGuru, isAdmin, isAcharya, canModerate, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
