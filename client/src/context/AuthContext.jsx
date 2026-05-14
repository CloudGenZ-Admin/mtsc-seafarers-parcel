import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

function parseToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch { return null; }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = parseToken(token);
    if (!payload) return null;
    
    // Merge with station context from localStorage if available
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    return { ...payload, ...storedUser };
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !parseToken(token)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser({ ...parseToken(token), ...userData });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isSeafarer: user?.role === 'seafarer', 
      isStaff: user?.role === 'staff',
      isAdmin: user?.role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
