import React, { useState, useEffect } from 'react';
import { Heart, MessageSquare, UserCircle, LayoutDashboard } from 'lucide-react';


import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const SavedProperties = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSaved = async () => {
      if (!user) return;
      try {
        const res = await api.get('/users/favorites');
        setProperties(res.data.savedProperties || []);
      } catch (err) {
        console.error('Error fetching saved properties:', err);
        toast.error('Failed to load saved properties');
      } finally {
        setLoading(false);
      }
    };
    fetchSaved();
  }, [user]);

  const handleRemove = async (id) => {
    try {
      await api.delete(`/users/favorites/${id}`);
      setProperties(properties.filter((p) => p._id !== id));
      toast.success('Property removed from favorites');
    } catch (err) {
      console.error('Error removing favorite:', err);
      toast.error('Failed to remove property');
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
          <li><NavLink to="/user/dashboard" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}><LayoutDashboard size={18} /> Overview</NavLink></li>
          <li><NavLink to="/user/saved" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}><Heart size={18} /> Saved Properties</NavLink></li>
          <li><NavLink to="/user/inquiries" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}><MessageSquare size={18} /> My Inquiries</NavLink></li>
          <li><NavLink to="/user/profile" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}><UserCircle size={18} /> My Profile</NavLink></li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content">
        <h2>Saved Properties</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Access your bookmarked properties quickly.
        </p>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '4rem 0' }}>
            <div className="spinner"></div>
          </div>
        ) : properties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            No saved properties yet.
          </div>
        ) : (
          <div className="properties-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {properties.map((property) => (
              <div className="property-card" key={property._id}>
                <div className="property-card-img-wrapper" style={{ height: '180px' }}>
                  <img
                    src={property.thumbnail || property.images?.[0]?.url || '/images/properties/prop-8.jpg'}
                    alt={property.title}
                    className="property-card-img"
                  />
                  <button
                    className="property-card-favorite"
                    style={{ color: 'var(--danger)' }}
                    onClick={() => handleRemove(property._id)}
                  >
                    
                  </button>
                </div>
                <div className="property-card-content" style={{ padding: '1.25rem' }}>
                  <h3 className="property-card-title" style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                    {property.title}
                  </h3>
                  <div className="property-card-price" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
                    {formatPrice(property.price)}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <button className="btn btn-secondary" style={{ padding: '0.4rem', fontSize: '0.8rem' }} onClick={() => handleRemove(property._id)}>
                      Remove
                    </button>
                    <Link to={`/property/${property._id}`} className="btn btn-primary" style={{ padding: '0.4rem', fontSize: '0.8rem' }}>
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default SavedProperties;
