import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import useFCM from '../hooks/useFCM';

// Inner component so the hook is only mounted when the user is authenticated
const FCMRegistrar = () => {
  useFCM();
  return null;
};

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await authAPI.getMe();
      setUser(response.data.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials) => {
    const response = await authAPI.login(credentials);
    const { user, token } = response.data.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    setUser(user);
    setIsAuthenticated(true);

    return user;
  };

  const register = async (data) => {
    const response = await authAPI.register(data);
    const { user, token } = response.data.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    setUser(user);
    setIsAuthenticated(true);

    return user;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {isAuthenticated && <FCMRegistrar />}
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
