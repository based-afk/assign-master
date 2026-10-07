import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { StorageService } from '../services/storage';
import { mobileApi, onUnauthorized } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  authMessage: string | null;
  clearAuthMessage: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedToken = await StorageService.getToken();
        const savedUser = await StorageService.getUser();

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(savedUser);

          // Verify with backend
          try {
            const res = await mobileApi.getMe();
            if (res?.data?.user) {
              setUser(res.data.user);
              await StorageService.saveUser(res.data.user);
            }
          } catch {
            // Ignore temporary network errors on start
          }
        }
      } catch (err) {
        console.error('Failed to restore session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();

    // Listen to token expiration
    const unsubscribe = onUnauthorized((msg) => {
      setUser(null);
      setToken(null);
      setAuthMessage(msg);
    });

    return () => unsubscribe();
  }, []);

  const login = async (newToken: string, newUser: User) => {
    await StorageService.saveToken(newToken);
    await StorageService.saveUser(newUser);
    setToken(newToken);
    setUser(newUser);
    setAuthMessage(null);
  };

  const logout = async () => {
    try {
      await mobileApi.logout().catch(() => {});
    } finally {
      await StorageService.clear();
      setToken(null);
      setUser(null);
    }
  };

  const clearAuthMessage = () => setAuthMessage(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        authMessage,
        clearAuthMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
