import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

import Login     from './pages/Login';
import Register  from './pages/Register';
import Dashboard from './pages/Dashboard';
import Setup     from './pages/Setup';
import Interview from './pages/Interview';
import Results   from './pages/Results';
import History   from './pages/History';

const Private = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-center"><div className="spinner"/></div>;
  return user ? children : <Navigate to="/login" replace />;
};

const Public = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-center"><div className="spinner"/></div>;
  return !user ? children : <Navigate to="/dashboard" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"          element={<Navigate to="/dashboard" replace />} />
          <Route path="/login"     element={<Public><Login /></Public>} />
          <Route path="/register"  element={<Public><Register /></Public>} />
          <Route path="/dashboard" element={<Private><Dashboard /></Private>} />
          <Route path="/setup"     element={<Private><Setup /></Private>} />
          <Route path="/interview/:id" element={<Private><Interview /></Private>} />
          <Route path="/results/:id"   element={<Private><Results /></Private>} />
          <Route path="/history"   element={<Private><History /></Private>} />
          <Route path="*"          element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
