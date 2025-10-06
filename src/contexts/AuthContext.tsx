import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/users';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // BYPASS AUTH: Always authenticated, no backend required
  const [isAuthenticated] = useState(true);
  const [isLoading] = useState(false);

  const checkAuth = () => {};
  const login = async () => {};
  const logout = () => {};

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
