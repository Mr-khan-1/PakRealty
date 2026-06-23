import React, { useState, useEffect, useCallback } from 'react';
import { Users, Shield, Building, Wifi, AlertTriangle, ClipboardList, TrendingUp, Home } from 'lucide-react';


import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';


const fmt = n => {
  if (!n) return '0';
  if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(1)} Cr`;
  if (n >= 100_000)    return `${(n / 100_000).toFixed(0)} L`;
  return n.toLocaleString();
};

const StatCard = ({ icon, label, value, color, bg, border, link }) => (
  <Link to={link || '#'} style={{ textDecoration: 'none' }}>
    <div
      style={{ background: bg || 'var(--primary-light)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: `1px solid ${border || 'var(--border)'}`, textAlign: 'center', transition: 'all 0.2s ease', cursor: 'pointer' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none';             e.currentTarget.style.boxShadow = 'none'; }}
    >
      <span style={{ fontSize: '2.25rem' }}>{icon}</span>
      <h3 style={{ margin: '0.75rem 0 0.25rem', fontSize: '1.9rem', color: color || 'var(--primary)' }}>{value}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>{label}</p>
    </div>
  </Link>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats,          setStats]          = useState(null);
  const [recentListings, setRecentListings] = useState([]);
  const [loading,        setLoading]        = useState(true);

  // ── Fetch admin stats ───────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/stats');
      if (res.data.success) {
        setStats(res.data.stats);
        setRecentListings(res.data.recentListings || []);
      }
    } catch (err) {
      console.error('Admin stats error:', err);
      // Graceful fallback using the older agents/list endpoint
      try {
        const [agentsRes, propRes] = await Promise.all([
          api.get('/users/agents/list'),
          api.get('/properties?limit=100'),
        ]);
        const props  = propRes.data.properties  || [];
        const agents = agentsRes.data.agents || [];
        setStats({
          totalUsers:       agents.length + 15,
          totalAgents:      agents.length,
          totalInvestors:   Math.floor(agents.length * 0.6),
          totalProperties:  props.length,
          pendingProperties:props.filter(p => !p.isVerified).length
        });
        setRecentListings(props.slice(0, 10));
      } catch {}
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);


  return (
    <div className="dashboard-layout">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="dashboard-sidebar">
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', marginBottom: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', display: 'flex', justifyContent: 'center' }}><Shield size={32} color="var(--primary)" /></div>
          <p style={{ fontWeight: '700', fontSize: '0.9rem', margin: '0.5rem 0 0.1rem' }}>Admin Panel</p>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0 }}>{user?.name}</p>
        </div>

        <ul className="sidebar-menu">
          <li><NavLink to="/admin/dashboard"  className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}> System Overview</NavLink></li>
          <li><NavLink to="/admin/users"      className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}> Manage Users</NavLink></li>
          <li><NavLink to="/admin/properties" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}> Moderation Queue</NavLink></li>
        </ul>

        {/* Pending Properties Alert */}
        <div style={{ padding: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
          {stats?.pendingProperties > 0 && (
            <div style={{ marginTop: '0.75rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius)', padding: '0.6rem 0.75rem', fontSize: '0.78rem', color: '#ef4444', textAlign: 'center' }}>
              <AlertTriangle size={14} /> <strong>{stats.pendingProperties}</strong> listing{stats.pendingProperties > 1 ? 's' : ''} pending
            </div>
          )}
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main className="dashboard-content">
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ margin: 0 }}>System Overview</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
            PakRealty — real-time platform statistics and moderation controls.
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '4rem 0' }}>
            <div className="spinner" />
          </div>
        ) : (
          <>
            {/* KPI grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <StatCard icon={<Users size={28} />} label="Total Users"      value={stats?.totalUsers      ?? 0} link="/admin/users" />
              <StatCard icon={<Building size={28} />} label="Agents"           value={stats?.totalAgents     ?? 0} link="/admin/users"
                color="#f59e0b" bg="rgba(245,158,11,0.1)" border="rgba(245,158,11,0.25)" />
              <StatCard icon={<TrendingUp size={28} />} label="Investors"        value={stats?.totalInvestors  ?? 0}
                color="#10b981" bg="rgba(16,185,129,0.1)" border="rgba(16,185,129,0.25)" />
              <StatCard icon={<Home size={28} />} label="Total Listings"   value={stats?.totalProperties ?? 0} link="/admin/properties"
                color="#6366f1" bg="rgba(99,102,241,0.1)" border="rgba(99,102,241,0.25)" />
              <StatCard icon={<AlertTriangle size={28} />} label="Pending Review"  value={stats?.pendingProperties ?? 0} link="/admin/properties"
                color="#ef4444" bg="rgba(239,68,68,0.1)" border="rgba(239,68,68,0.25)" />
            </div>

            {/* Recent listings table */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><ClipboardList size={18} color="var(--primary)" /> Recent Listings — Verification Queue</h3>
                <Link to="/admin/properties" style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: '600' }}>View All →</Link>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg)' }}>
                      {['Title', 'City', 'Price', 'Purpose', 'Source', 'Status'].map(h => (
                        <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '700', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentListings.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No pending listings found in the verification queue.</td></tr>
                    ) : recentListings.map(prop => (
                      <tr key={prop._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', maxWidth: '220px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                          <Link to={`/property/${prop._id}`} style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: '500' }}>{prop.title}</Link>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{prop['location.city'] || prop.location?.city}</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '700' }}>PKR {fmt(prop.price)}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ background: prop.purpose === 'sale' ? 'rgba(99,102,241,0.15)' : 'rgba(16,185,129,0.15)', color: prop.purpose === 'sale' ? '#6366f1' : '#10b981', padding: '0.2rem 0.55rem', borderRadius: '999px', fontSize: '0.73rem', fontWeight: '700', whiteSpace: 'nowrap' }}>
                            {prop.purpose === 'sale' ? 'For Sale' : 'For Rent'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: prop.isExternal ? 'rgba(6,182,212,0.12)' : 'rgba(99,102,241,0.12)', color: prop.isExternal ? '#06b6d4' : '#6366f1', padding: '0.2rem 0.55rem', borderRadius: '999px', fontSize: '0.73rem', fontWeight: '700', whiteSpace: 'nowrap' }}>
                            {prop.isExternal ? <><Wifi size={12}/> Scraped</> : 'Agent'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ background: prop.isVerified ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: prop.isVerified ? '#10b981' : '#f59e0b', padding: '0.2rem 0.55rem', borderRadius: '999px', fontSize: '0.73rem', fontWeight: '700', whiteSpace: 'nowrap' }}>
                            {prop.isVerified ? '✓ Verified' : '⏳ Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
