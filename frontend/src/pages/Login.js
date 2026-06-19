import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const from = location.state?.from?.pathname || null;

  const getDashboard = (role) => ({
    admin: '/admin/dashboard',
    agent: '/agent/dashboard',
    investor: '/investor/dashboard',
    user: '/user/dashboard',
  }[role] || '/');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.token) {
        login(res.data.token, res.data.user);
        toast.success(`Welcome back, ${res.data.user.name?.split(' ')[0]}!`);
        navigate(from || getDashboard(res.data.user.role), { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path d="M3 9.5L12 3L21 9.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 21V12h6v9" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your PakRealty account</p>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              className="form-control"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <div className="input-with-action">
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button type="button" className="input-eye-btn" onClick={() => setShowPass(s => !s)}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? <span className="btn-spinner" /> : null}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="auth-footer-text">
          Don't have an account? <Link to="/register" className="auth-link">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
