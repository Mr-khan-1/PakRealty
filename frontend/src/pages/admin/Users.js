import React, { useState, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { Shield, Users, Building, TrendingUp, UserCircle, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const roleColor = (role) => {
  switch (role) {
    case 'admin':    return { bg: 'rgba(239,68,68,0.12)',    color: '#ef4444' };
    case 'agent':    return { bg: 'rgba(245,158,11,0.12)',   color: '#f59e0b' };
    case 'investor': return { bg: 'rgba(16,185,129,0.12)',   color: '#10b981' };
    default:         return { bg: 'rgba(99,102,241,0.12)',   color: '#6366f1' };
  }
};

const AdminUsers = () => {
  const { user } = useAuth();
  const [users,      setUsers]      = useState([]);
  const [roleCounts, setRoleCounts] = useState({ user: 0, agent: 0, investor: 0, admin: 0 });
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [search,     setSearch]     = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 100 });
      if (roleFilter) params.set('role', roleFilter);
      if (search)     params.set('search', search);

      const res = await api.get(`/admin/users?${params.toString()}`);
      if (res.data.success) {
        setUsers(res.data.users || []);
        setTotal(res.data.pagination?.total || 0);
        setRoleCounts(res.data.roleCounts || { user: 0, agent: 0, investor: 0, admin: 0 });
      }
    } catch (err) {
      console.error('Error loading users:', err);
      toast.error(err.response?.data?.error || 'Failed to load user accounts');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggleStatus = async (id, currentStatus, role) => {
    if (role === 'admin') { toast.error('Cannot deactivate another admin'); return; }
    try {
      const res = await api.patch(`/admin/users/${id}/status`);
      if (res.data) {
        toast.success(res.data.message);
        setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: !currentStatus } : u));
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update user status');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const tabs = [
    { value: '',         label: 'All Users',  count: total,              icon: <Users size={15} /> },
    { value: 'user',     label: 'Buyers',     count: roleCounts.user,    icon: <UserCircle size={15} /> },
    { value: 'agent',    label: 'Agents',     count: roleCounts.agent,   icon: <Building size={15} /> },
    { value: 'investor', label: 'Investors',  count: roleCounts.investor,icon: <TrendingUp size={15} /> },
    { value: 'admin',    label: 'Admins',     count: roleCounts.admin,   icon: <Shield size={15} /> },
  ];

  return (
    <div className="dashboard-layout">
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
      </aside>

      {/* Main Content */}
      <main className="dashboard-content">
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>User Accounts Management</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
            Manage all registered users — buyers, agents, investors, and admins.
          </p>
        </div>

        {/* Role Count Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Users',  value: total,               color: 'var(--primary)', bg: 'var(--primary-light)' },
            { label: 'Buyers',       value: roleCounts.user,     color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
            { label: 'Agents',       value: roleCounts.agent,    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
            { label: 'Investors',    value: roleCounts.investor,  color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
            { label: 'Admins',       value: roleCounts.admin,    color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
          ].map(card => (
            <div key={card.label} style={{ background: card.bg, border: `1px solid ${card.color}33`, borderRadius: 'var(--radius-lg)', padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: card.color }}>{card.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Search + Role Filter */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: 0 }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by name or email…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Search size={16} /> Search
            </button>
            {search && (
              <button type="button" className="btn btn-secondary" style={{ padding: '0.5rem 0.75rem' }} onClick={() => { setSearch(''); setSearchInput(''); }}>
                Clear
              </button>
            )}
          </form>

          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {tabs.map(tab => (
              <button
                key={tab.value}
                onClick={() => setRoleFilter(tab.value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.3rem',
                  padding: '0.4rem 0.85rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
                  border: roleFilter === tab.value ? '1px solid var(--primary)' : '1px solid var(--border)',
                  background: roleFilter === tab.value ? 'var(--primary)' : 'transparent',
                  color: roleFilter === tab.value ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.18s ease',
                }}
              >
                {tab.icon} {tab.label} <span style={{ opacity: 0.8 }}>({tab.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* User Table */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '4rem 0' }}>
            <div className="spinner" />
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            No users found matching your filters.
          </div>
        ) : (
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg)' }}>
                    {['Name', 'Email', 'Phone', 'Role', 'Joined', 'Status', 'Action'].map(h => (
                      <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '700', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => {
                    const rc = roleColor(user.role);
                    return (
                      <tr key={user._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '0.85rem 1rem', fontWeight: '600', fontSize: '0.9rem' }}>
                          {user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || '—'}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user.email}</td>
                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user.phone || '—'}</td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ background: rc.bg, color: rc.color, padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.73rem', fontWeight: '700', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                            {user.role}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ background: user.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: user.isActive ? '#10b981' : '#ef4444', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.73rem', fontWeight: '700', whiteSpace: 'nowrap' }}>
                            {user.isActive ? '● Active' : '○ Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => handleToggleStatus(user._id, user.isActive, user.role)}
                              style={{
                                padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer',
                                border: user.isActive ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(16,185,129,0.4)',
                                background: user.isActive ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                                color: user.isActive ? '#ef4444' : '#10b981',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminUsers;
