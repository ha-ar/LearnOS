import React, { useState, createContext, useContext } from 'react';
import { api, isLoggedIn as checkLoggedIn, clearToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(checkLoggedIn());
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('learnos_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (email, password) => {
    const data = await api.login(email, password);
    setIsAuthenticated(true);
    const userInfo = data.user || { name: 'Ms. Nadia', role: 'mentor' };
    setUser(userInfo);
    localStorage.setItem('learnos_user', JSON.stringify(userInfo));
    return data;
  };

  const logout = () => {
    api.logout();
    clearToken();
    localStorage.removeItem('learnos_user');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
