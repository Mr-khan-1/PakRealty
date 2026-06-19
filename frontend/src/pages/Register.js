import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { User, Home, TrendingUp, Eye, EyeOff } from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'user',     label: <><User size={16} /> Standard User</>, desc: 'Browse, save and inquire about properties' },
  { value: 'agent',    label: <><Home size={16} /> Real Estate Agent</>, desc: 'List and manage your properties' },
  { value: 'investor', label: <><TrendingUp size={16} /> Investor</>, desc: 'Access ROI tools and investment analytics' },
];

const Register = () => {
  const navigate    = useNavigate();
  const { login }   = useAuth();

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', role: 'user',
  });
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.firstName || !form.lastName) { toast.error('Please enter your full name'); return; }
    if (form.password.length < 8)          { toast.error('Password must be at least 8 characters'); return; }
    if (!/[A-Z]/.test(form.password))      { toast.error('Password must contain an uppercase letter'); return; }
    if (!/[0-9]/.test(form.password))      { toast.error('Password must contain a number'); return; }

    setLoading(true);
    try {
      const payload = {
        name:     `${form.firstName.trim()} ${form.lastName.trim()}`,
        email:    form.email,
        phone:    form.phone,
        password: form.password,
        role:     form.role,
      };

      const res = await api.post('/auth/register', payload);

      if (res.data?.token) {
        login(res.data.token, res.data.user);
        toast.success('Account created! Welcome to PakRealty 🎉');
        const dashMap = { admin: '/admin/dashboard', agent: '/agent/dashboard', investor: '/investor/dashboard', user: '/user/dashboard' };
        navigate(dashMap[res.data.user.role] || '/');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ maxWidth: '560px' }}>
        <div className="auth-header">
          <div className="auth-logo">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path d="M3 9.5L12 3L21 9.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
                    stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 21V12h6v9" stroke="#2563eb" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join Pakistan's professional real estate marketplace</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Name row */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reg-first">First Name</label>
              <input id="reg-first" type="text" className="form-control"
                placeholder="Ali" value={form.firstName} onChange={set('firstName')} required />
            </div>
            <div className="form-group">
              <label htmlFor="reg-last">Last Name</label>
              <input id="reg-last" type="text" className="form-control"
                placeholder="Khan" value={form.lastName} onChange={set('lastName')} required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Email Address</label>
            <input id="reg-email" type="email" className="form-control"
              placeholder="ali@example.com" value={form.email} onChange={set('email')}
              required autoComplete="email" />
          </div>

          <div className="form-group">
            <label htmlFor="reg-phone">Phone Number <span className="label-optional">(optional)</span></label>
            <input id="reg-phone" type="tel" className="form-control"
              placeholder="03001234567" value={form.phone} onChange={set('phone')} />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">
              Password
              <span className="label-hint">min 8 chars, uppercase &amp; number</span>
            </label>
            <div className="input-with-action">
              <input id="reg-password"
                type={showPass ? 'text' : 'password'}
                className="form-control"
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
                required autoComplete="new-password"
              />
              <button type="button" className="input-eye-btn" onClick={() => setShowPass(s => !s)}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Account Type</label>
            <div className="role-cards">
              {ROLE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`role-card${form.role === opt.value ? ' role-card--active' : ''}`}
                  onClick={() => setForm(f => ({ ...f, role: opt.value }))}
                >
                  <span className="role-card-label">{opt.label}</span>
                  <span className="role-card-desc">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : null}
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
