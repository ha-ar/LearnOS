import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AuthApi, isLoggedIn as checkLoggedIn } from '../auth';
import { User } from '../types';

interface AuthContextValue {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(checkLoggedIn());
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('learnos_admin_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (email: string, password: string) => {
    const loggedInUser = await AuthApi.login(email, password);
    setIsAuthenticated(true);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const logout = () => {
    AuthApi.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
