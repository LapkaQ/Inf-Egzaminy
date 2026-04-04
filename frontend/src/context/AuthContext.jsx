import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { authService } from '../services/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true podczas sprawdzania tokena przy starcie

  // Przy ładowaniu aplikacji sprawdź czy mamy token i pobierz dane usera
  useEffect(() => {
    const initAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const me = await api.get('/auth/me');
          setUser(me);
        } catch {
          // Token nieważny lub wygasł – wyloguj
          authService.logout();
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    await authService.login(email, password);
    const me = await api.get('/auth/me');
    setUser(me);
    return me;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth musi być użyty wewnątrz AuthProvider');
  return ctx;
};
