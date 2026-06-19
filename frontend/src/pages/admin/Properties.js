import React, { useState, useEffect } from 'react';

import { NavLink } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProperties = async () => {
    try {
      const res = await api.get('/properties?limit=50');
      // Show both verified and unverified properties
      if (res.data) {
        setProperties(res.data.properties || []);
      }
    } catch (err) {
      console.error('Error loading properties:', err);
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleVerify = async (id, currentStatus) => {
    try {
      // In professional backend, updating status is usually PUT /properties/:id
      // Let's call PUT /properties/:id to toggle isVerified field
      const res = await api.put(`/properties/${id}`, { isVerified: !currentStatus });
      if (res.data) {
        toast.success(`Property verification status ${!currentStatus ? 'Approved' : 'Revoked'}`);
        setProperties(properties.map(p => p._id === id ? { ...p, isVerified: !currentStatus } : p));
      }
    } catch (err) {
      console.error('Error verifying property:', err);
      toast.error(err.response?.data?.error || 'Failed to change verification status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await api.delete(`/properties/${id}`);
      setProperties(properties.filter(p => p._id !== id));
      toast.success('Property listing deleted successfully');
    } catch (err) {
      console.error('Error deleting property:', err);
      toast.error('Failed to delete listing');
    }
  };

  const formatPrice = (price) => {
    if (!price) return '';
    if (price >= 10000000) {
      return `${(price / 10000000).toFixed(2)} Crore`;
    }
    if (price >= 100000) {
      return `${(price / 100000).toFixed(2)} Lakh`;
    }
    return `PKR ${price.toLocaleString()}`;
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <ul className="sidebar-menu">
          <li><NavLink to="/admin/dashboard" className="sidebar-link"> System Stats</NavLink></li>
          <li><NavLink to="/admin/users" className="sidebar-link">👥 User Accounts</NavLink></li>
          <li><NavLink to="/admin/properties" className="sidebar-link active"> Moderation</NavLink></li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content">
        <h2>Property Listings Moderation</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Approve, reject, or remove property listings across Pakistan.
        </p>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '4rem 0' }}>
            <div className="spinner"></div>
          </div>
        ) : properties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            No property listings found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {properties.map((property) => (
              <div
                key={property._id}
                style={{
                  background: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1.5rem'
                }}
              >
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <img
                    src={property.thumbnail || property.images?.[0]?.url || '/images/properties/prop-8.jpg'}
                    alt={property.title}
                    style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius)' }}
                  />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{property.title}</h4>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                       {property.location?.area}, {property.location?.city} | {formatPrice(property.price)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    className={`btn ${property.isVerified ? 'btn-secondary' : 'btn-primary'}`}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                    onClick={() => handleVerify(property._id, property.isVerified)}
                  >
                    {property.isVerified ? 'Unverify' : 'Verify & Approve'}
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                    onClick={() => handleDelete(property._id)}
                  >
                    Delete
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
