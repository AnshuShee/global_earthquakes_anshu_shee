import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('accessToken'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If we have a token, we could fetch user profile here.
    // For now, if there is a token, we'll assume the user is logged in.
    if (token) {
      // In a real app, you would verify the token via a /me endpoint
      try {
        // Decode JWT payload to get user info without a network request
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ id: payload.id, role: payload.role });
      } catch (e) {
        logout();
      }
    }
    setIsLoading(false);
  }, [token]);

  const login = (newToken, userData) => {
    localStorage.setItem('accessToken', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
