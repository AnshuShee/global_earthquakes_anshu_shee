import React from 'react';
import Sidebar from './Sidebar';
import { Outlet, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Layout = () => {
  const { token, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <div className="loading-screen">Loading...</div>;
  }

  // Protected route logic at the layout level
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
