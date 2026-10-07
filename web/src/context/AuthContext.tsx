import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { api, getAuthToken, setAuthToken, clearAuthToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('pm_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getAuthToken();
      if (storedToken) {
        try {
          const res = await api.getMe();
          if (res?.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('pm_user', JSON.stringify(res.data.user));
          }
        } catch {
          // Token is invalid/expired
          clearAuthToken();
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();

    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('pm:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('pm:unauthorized', handleUnauthorized);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setAuthToken(newToken);
    localStorage.setItem('pm_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    try {
      if (token) {
        await api.logout().catch(() => {});
      }
    } finally {
      clearAuthToken();
      setToken(null);
      setUser(null);
    }
  };

  const updateUser = (updated: User) => {
    setUser(updated);
    localStorage.setItem('pm_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
