import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Home, Building } from 'lucide-react';

const ROLE_META = {
  admin: { label: 'Admin', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  agent: { label: 'Agent', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  investor: { label: 'Investor', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  user: { label: 'User', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
};

const NAV_LINKS = {
  user: [
    { to: '/comparison', label: 'Compare' },
    { to: '/user/dashboard', label: 'Dashboard' },
  ],
  agent: [
    { to: '/agent/dashboard', label: 'Dashboard' }
  ],
  investor: [
    { to: '/investor/dashboard', label: 'Portfolio' },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Overview' },
  ],
};

export default function Navbar() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);

  const role = user?.role;
  const roleMeta = ROLE_META[role] || null;
  const links = token && role ? (NAV_LINKS[role] || []) : [];

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <>
      <nav className={`navbar${scrolled ? ' navbar--scrolled' : ''}`} ref={menuRef}>
        <div className="nav-container">

          {/* ── Logo ──────────────────────────────────────────────── */}
          <Link to="/" className="logo" onClick={() => setMenuOpen(false)}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M3 9.5L12 3L21 9.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>PakRealty</span>
          </Link>

          {/* ── Desktop nav ───────────────────────────────────────── */}
          <ul className="nav-menu nav-menu--desktop">
            {!token && (
              <>
                <li><NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Home</NavLink></li>
              </>
            )}
            {links.map(link => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}

            {!token ? (
              <li className="nav-actions">
                <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
              </li>
            ) : (
              <li className="nav-actions">
                {roleMeta && (
                  <span className="role-badge" style={{ background: roleMeta.bg, color: roleMeta.color }}>
                    {roleMeta.label}
                  </span>
                )}
                <span className="nav-username">{user?.name?.split(' ')[0] || 'User'}</span>
                <button onClick={handleLogout} className="btn btn-secondary btn-sm">Logout</button>
              </li>
            )}
          </ul>

          {/* ── Hamburger (mobile) ────────────────────────────────── */}
          <button
            className={`hamburger${menuOpen ? ' hamburger--open' : ''}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
          >
            <span /><span /><span />
          </button>
        </div>

        {/* ── Mobile drawer ─────────────────────────────────────────── */}
        <div className={`mobile-drawer${menuOpen ? ' mobile-drawer--open' : ''}`}>
          <ul className="mobile-nav-list">
            {!token && (
              <>
                <li><NavLink to="/" className="mobile-nav-link" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Home size={18} /> Home</NavLink></li>
                <li><NavLink to="/properties" className="mobile-nav-link" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Building size={18} /> Properties</NavLink></li>
              </>
            )}
            {links.map(link => (
              <li key={link.to}>
                <NavLink to={link.to} className="mobile-nav-link">{link.label}</NavLink>
              </li>
            ))}
          </ul>

          <div className="mobile-drawer-footer">
            {!token ? (
              <div className="mobile-auth-btns">
                <Link to="/login" className="btn btn-secondary" style={{ flex: 1 }}>Login</Link>
                <Link to="/register" className="btn btn-primary" style={{ flex: 1 }}>Register</Link>
              </div>
            ) : (
              <div className="mobile-user-row">
                {roleMeta && (
                  <span className="role-badge" style={{ background: roleMeta.bg, color: roleMeta.color }}>
                    {roleMeta.label}
                  </span>
                )}
                <span className="nav-username" style={{ flex: 1 }}>{user?.name}</span>
                <button onClick={handleLogout} className="btn btn-secondary btn-sm">Logout</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Mobile overlay ──────────────────────────────────────────── */}
      {menuOpen && <div className="mobile-overlay" onClick={() => setMenuOpen(false)} />}
    </>
  );
}
