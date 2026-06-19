import React, { useState, useEffect } from 'react';
import { Heart, MessageSquare, UserCircle, Search, Scale, Zap, Hourglass, TrendingUp } from 'lucide-react';


import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const formatPKR = (num) => {
  if (!num || isNaN(num)) return '—';
  if (num >= 10000000) return `${(num / 10000000).toFixed(1)} Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(0)} L`;
  return num.toLocaleString();
};

const QUICK_LINKS = [
  { icon: <Search size={28} />, label: 'Browse All Listings', href: '/properties', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
  { icon: <Scale size={28} />, label: 'Compare Properties', href: '/comparison', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  { icon: <TrendingUp size={28} />, label: 'Investor Hub', href: '/investor', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  { icon: <Heart size={28} />, label: 'Saved Properties', href: '/user/saved', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
];

const Dashboard = () => {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const [inqRes, favRes] = await Promise.all([
          api.get(`/inquiries/user/${user._id}`),
          api.get('/users/favorites')
        ]);
        setInquiries(inqRes.data.inquiries || []);
        setFavorites(favRes.data.savedProperties || []);
      } catch (err) {
        console.error('User dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const pendingInquiries = inquiries.filter(i => i.status === 'pending' || !i.status);

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '1.5rem', color: '#fff', fontWeight: '700' }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <p style={{ textAlign: 'center', margin: '0.75rem 0 0', fontWeight: '700', fontSize: '0.9rem' }}>{user?.name}</p>
          <p style={{ textAlign: 'center', margin: '0.2rem 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Member</p>
        </div>
        <ul className="sidebar-menu">
          <li><NavLink to="/user/dashboard" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}> My Overview</NavLink></li>
          <li><NavLink to="/user/saved" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}> <Heart size={18} /> Saved Properties</NavLink></li>
          <li><NavLink to="/user/inquiries" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}>
             My Inquiries
            {pendingInquiries.length > 0 && <span style={{ background: '#f59e0b', color: '#000', borderRadius: '999px', padding: '0 0.4rem', fontSize: '0.7rem', fontWeight: '700', marginLeft: '0.25rem' }}>{pendingInquiries.length}</span>}
          </NavLink></li>
          <li><NavLink to="/user/profile" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}> <UserCircle size={18} /> My Profile</NavLink></li>
        </ul>
        <div style={{ padding: '1rem', marginTop: 'auto', borderTop: '1px solid var(--border)' }}>
          <Link to="/properties" className="btn btn-primary" style={{ width: '100%', textAlign: 'center', fontSize: '0.85rem' }}>
            <Search size={16} /> Find Properties
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content">
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>Welcome back, {user?.name?.split(' ')[0]}! 👋</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
            Find your perfect home or investment property in Pakistan.
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '4rem 0' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(239,68,68,0.1)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(239,68,68,0.25)', textAlign: 'center' }}>
                <span style={{ fontSize: '2rem' }}></span>
                <h3 style={{ margin: '0.5rem 0 0.25rem', fontSize: '1.75rem', color: '#ef4444' }}>{favorites.length}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}> <Heart size={18} /> Saved Properties</p>
              </div>
              <div style={{ background: 'rgba(99,102,241,0.1)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(99,102,241,0.25)', textAlign: 'center' }}>
                <span style={{ fontSize: '2rem' }}></span>
                <h3 style={{ margin: '0.5rem 0 0.25rem', fontSize: '1.75rem', color: '#6366f1' }}>{inquiries.length}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}> <MessageSquare size={18} /> Inquiries Sent</p>
              </div>
              <div style={{ background: 'rgba(245,158,11,0.1)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(245,158,11,0.25)', textAlign: 'center' }}>
                <span style={{ fontSize: '2rem', display: 'flex', justifyContent: 'center' }}><Hourglass size={32} color="#f59e0b" /></span>
                <h3 style={{ margin: '0.5rem 0 0.25rem', fontSize: '1.75rem', color: '#f59e0b' }}>{pendingInquiries.length}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>Awaiting Reply</p>
              </div>
            </div>

            {/* Quick Links */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Zap size={18} color="var(--primary)" /> Quick Actions</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
                {QUICK_LINKS.map(link => (
                  <Link key={link.href} to={link.href} style={{ textDecoration: 'none' }}>
                    <div style={{ background: link.bg, border: `1px solid ${link.bg.replace('0.1', '0.3')}`, borderRadius: 'var(--radius-lg)', padding: '1.25rem', textAlign: 'center', transition: 'all 0.2s ease' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 6px 16px ${link.bg.replace('0.1', '0.25')}`; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <span style={{ display: 'flex', justifyContent: 'center', color: link.color }}>{link.icon}</span>
                      <p style={{ margin: '0.5rem 0 0', fontWeight: '600', fontSize: '0.8rem', color: link.color }}>{link.label}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Saved Properties Preview */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem' }}> Recently Saved Properties</h3>
                <Link to="/user/saved" style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '600' }}>View All →</Link>
              </div>
              {favorites.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-secondary)', margin: '0 0 1rem', fontSize: '0.9rem' }}>You haven't saved any properties yet. Start browsing!</p>
                  <Link to="/properties" className="btn btn-primary">Browse Listings</Link>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', padding: '1rem' }}>
                  {favorites.slice(0, 4).map(prop => (
                    <Link to={`/property/${prop._id}`} key={prop._id} style={{ textDecoration: 'none' }}>
                      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', transition: 'all 0.2s ease' }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <div style={{ height: '130px', background: `url(${prop.thumbnail}) center/cover no-repeat`, backgroundColor: 'var(--border)' }} />
                        <div style={{ padding: '0.75rem' }}>
                          <p style={{ margin: '0 0 0.25rem', fontWeight: '600', fontSize: '0.82rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', color: 'var(--text)' }}>{prop.title}</p>
                          <p style={{ margin: 0, color: 'var(--primary)', fontWeight: '700', fontSize: '0.88rem' }}>PKR {formatPKR(prop.price)}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Inquiries */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem' }}> My Recent Inquiries</h3>
                <Link to="/user/inquiries" style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '600' }}>View All →</Link>
              </div>
              {inquiries.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  No inquiries yet. Find a property and contact the owner!
                </div>
              ) : (
                <ul style={{ listStyle: 'none', padding: '0.5rem 0', margin: 0 }}>
                  {inquiries.slice(0, 4).map(inq => (
                    <li key={inq._id} style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: '600', fontSize: '0.85rem', color: 'var(--text)' }}>{inq.subject || 'Property Inquiry'}</p>
                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(inq.createdAt).toLocaleDateString('en-PK')}</p>
                      </div>
                      <span style={{ background: inq.status === 'responded' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: inq.status === 'responded' ? '#10b981' : '#f59e0b', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600', whiteSpace: 'nowrap' }}>
                        {inq.status === 'responded' ? '✓ Replied' : '⏳ Pending'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
