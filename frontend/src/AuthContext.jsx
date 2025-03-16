import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = sessionStorage.getItem('access_token');
      const storedUser = sessionStorage.getItem('user');

      if (token) {
        if (storedUser) {
          setAuth(true);
          setUser(JSON.parse(storedUser));
          setIsLoading(false);
        } else {
          try {
            const response = await axios.get('https://super-palm-tree-h366.onrender.com/user', {
              headers: { Authorization: `Bearer ${token}` },
            });
            const userData = response.data;
            setUser(userData);
            sessionStorage.setItem('user', JSON.stringify(userData));
            setAuth(true);
          } catch (err) {
            console.error('Error fetching user data:', err);
            logout();
          }
        }
      }
      setIsLoading(false);
    };

    checkAuth();

    const handleStorageChange = () => {
      const token = sessionStorage.getItem('access_token');
      const storedUser = sessionStorage.getItem('user');
      setAuth(!!token);
      setUser(storedUser ? JSON.parse(storedUser) : null);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (token) => {
    sessionStorage.setItem('access_token', token);
    try {
      const response = await axios.get('https://super-palm-tree-h366.onrender.com/user', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = response.data;
      setUser(userData);
      sessionStorage.setItem('user', JSON.stringify(userData));
      setAuth(true);
    } catch (err) {
      console.error('Error fetching user data:', err);
      logout();
    }
  };

  const logout = () => {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('user');
    setAuth(false);
    setUser(null);
  };

  if (isLoading) {
    return <div>Loading...</div>; // Add a loading spinner here
  }

  return (
    <AuthContext.Provider value={{ auth, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);