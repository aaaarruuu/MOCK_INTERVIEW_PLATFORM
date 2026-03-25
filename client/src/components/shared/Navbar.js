import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };
  const active = path => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/dashboard" className="navbar-brand">
          <span className="brand-icon">⬡</span>
          <span className="brand-text">InterviewAI</span>
        </Link>

        <div className="navbar-links">
          <Link to="/dashboard" className={`nav-link ${active('/dashboard')}`}>Dashboard</Link>
          <Link to="/history"   className={`nav-link ${active('/history')}`}>History</Link>
          <Link to="/setup"     className="btn btn-primary btn-sm">New Interview</Link>
        </div>

        <div className="navbar-user">
          <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <span className="user-name">{user?.name}</span>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </nav>
  );
}
