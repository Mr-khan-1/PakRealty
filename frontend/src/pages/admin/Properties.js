import React, { useState, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, Trash2, ExternalLink, RefreshCw } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const formatPrice = (price) => {
  if (!price) return 'N/A';
  if (price >= 10000000) return `${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000)   return `${(price / 100000).toFixed(1)} L`;
  return `PKR ${price.toLocaleString()}`;
};

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState('all'); // 'all' | 'pending' | 'verified'

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch up to 100 properties for admin moderation
      const res = await api.get('/admin/properties?limit=100');
      if (res.data) {
        setProperties(res.data.properties || []);
      }
    } catch (err) {
      console.error('Error loading properties:', err);
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  // Use the dedicated admin verify endpoint (no ownership check)
  const handleVerify = async (id, currentStatus) => {
    try {
      const res = await api.patch(`/admin/properties/${id}/verify`);
      if (res.data) {
        toast.success(res.data.message || `Property ${!currentStatus ? 'verified' : 'unverified'}`);
        setProperties(prev => prev.map(p => p._id === id ? { ...p, isVerified: !currentStatus } : p));
      }
    } catch (err) {
      console.error('Error verifying property:', err);
      toast.error(err.response?.data?.error || 'Failed to change verification status');
    }
  };

  // Use the dedicated admin delete endpoint (no ownership check)
  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this listing? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/properties/${id}`);
      setProperties(prev => prev.filter(p => p._id !== id));
      toast.success('Property listing permanently deleted');
    } catch (err) {
      console.error('Error deleting property:', err);
      toast.error(err.response?.data?.error || 'Failed to delete listing');
    }
  };

  const displayed = properties.filter(p => {
    if (filter === 'pending')  return !p.isVerified;
    if (filter === 'verified') return  p.isVerified;
    return true;
  });

  const pendingCount  = properties.filter(p => !p.isVerified).length;
  const verifiedCount = properties.filter(p =>  p.isVerified).length;

  const tabs = [
    { value: 'all',      label: `All (${properties.length})` },
    { value: 'pending',  label: `Pending (${pendingCount})`,   color: '#f59e0b' },
    { value: 'verified', label: `Verified (${verifiedCount})`, color: '#10b981' },
  ];

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <ul className="sidebar-menu">
          <li><NavLink to="/admin/dashboard"  className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}> System Stats</NavLink></li>
          <li><NavLink to="/admin/users"      className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>👥 User Accounts</NavLink></li>
          <li><NavLink to="/admin/properties" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}> Moderation</NavLink></li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>Property Listings Moderation</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
              Verify or remove any property listing across Pakistan.
            </p>
          </div>
          <button
            onClick={fetchProperties}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        {/* Summary Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              style={{
                padding: '0.4rem 1rem', borderRadius: '999px', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer',
                border: filter === tab.value ? '1px solid var(--primary)' : '1px solid var(--border)',
                background: filter === tab.value ? 'var(--primary)' : 'transparent',
                color: filter === tab.value ? '#fff' : (tab.color || 'var(--text-secondary)'),
                transition: 'all 0.18s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '4rem 0' }}>
            <div className="spinner" />
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            No {filter !== 'all' ? filter : ''} property listings found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {displayed.map((property) => (
              <div
                key={property._id}
                style={{
                  background: 'var(--card-bg)',
                  border: `1px solid ${property.isVerified ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.1rem 1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  transition: 'box-shadow 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              >
                {/* Left: image + info */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1, minWidth: '240px' }}>
                  <img
                    src={property.thumbnail || property.images?.[0]?.url || 'https://via.placeholder.com/80x60?text=No+Image'}
                    alt={property.title}
                    style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius)', flexShrink: 0 }}
                    onError={e => { e.target.src = 'https://via.placeholder.com/80x60?text=No+Image'; }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <Link to={`/property/${property._id}`} target="_blank" style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: '600', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      {property.title}
                      <ExternalLink size={12} style={{ opacity: 0.5, flexShrink: 0 }} />
                    </Link>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      {[property.location?.area, property.location?.city].filter(Boolean).join(', ')}
                      {' · '}
                      <strong style={{ color: 'var(--primary)' }}>PKR {formatPrice(property.price)}</strong>
                      {' · '}
                      <span style={{ textTransform: 'capitalize' }}>{property.type}</span>
                      {' · '}
                      {property.purpose === 'sale' ? 'For Sale' : 'For Rent'}
                    </div>
                    <div style={{ marginTop: '0.4rem' }}>
                      <span style={{
                        background: property.isVerified ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                        color: property.isVerified ? '#10b981' : '#f59e0b',
                        padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '700', whiteSpace: 'nowrap'
                      }}>
                        {property.isVerified ? '✓ Verified' : '⏳ Pending Review'}
                      </span>
                      {property.isExternal && (
                        <span style={{ marginLeft: '0.4rem', background: 'rgba(6,182,212,0.12)', color: '#06b6d4', padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '700', whiteSpace: 'nowrap' }}>
                          🌐 Scraped
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: action buttons */}
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexShrink: 0 }}>
                  <button
                    onClick={() => handleVerify(property._id, property.isVerified)}
                    title={property.isVerified ? 'Click to unverify' : 'Click to verify'}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.35rem',
                      padding: '0.45rem 0.9rem', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer',
                      border: property.isVerified ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(16,185,129,0.4)',
                      background: property.isVerified ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                      color: property.isVerified ? '#f59e0b' : '#10b981',
                    }}
                  >
                    {property.isVerified
                      ? <><XCircle size={14} /> Unverify</>
                      : <><CheckCircle size={14} /> Verify</>
                    }
                  </button>
                  <button
                    onClick={() => handleDelete(property._id)}
                    title="Permanently delete"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.35rem',
                      padding: '0.45rem 0.9rem', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer',
                      border: '1px solid rgba(239,68,68,0.35)',
                      background: 'rgba(239,68,68,0.08)',
                      color: '#ef4444',
                    }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Properties;
