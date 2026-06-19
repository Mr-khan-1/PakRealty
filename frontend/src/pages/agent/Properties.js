import React, { useState, useEffect } from 'react';
import { Building, PlusCircle, MessageSquare, UserCircle } from 'lucide-react';


import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const Properties = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (!user) return;
    setLoading(true);
    api.get(`/properties/agent/${user._id}`)
      .then(res => setProperties(res.data.properties || []))
      .catch(err => { console.error('Error loading properties:', err); toast.error('Failed to load listings'); })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await api.delete(`/properties/${id}`);
      setProperties(properties.filter((p) => p._id !== id));
      toast.success('Listing deleted successfully!');
    } catch (err) {
      console.error('Error deleting listing:', err);
      toast.error(err.response?.data?.error || 'Failed to delete listing');
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
          <li><NavLink to="/agent/dashboard" className="sidebar-link"> Summary</NavLink></li>
          <li><NavLink to="/agent/properties" className="sidebar-link active"><Building size={18} /> My Listings</NavLink></li>
          <li><NavLink to="/agent/add-property" className="sidebar-link"><PlusCircle size={18} /> Add Property</NavLink></li>
          <li><NavLink to="/agent/inquiries" className="sidebar-link"><MessageSquare size={18} /> Inquiries</NavLink></li>
          <li><NavLink to="/agent/profile" className="sidebar-link"><UserCircle size={18} /> My Profile</NavLink></li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2>My Real Estate Listings</h2>
          <Link to="/agent/add-property" className="btn btn-primary">
            + Add New Listing
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '4rem 0' }}>
            <div className="spinner"></div>
          </div>
        ) : properties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            No listings added yet.
          </div>
        ) : (
          <div className="properties-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {properties.map((property) => (
              <div className="property-card" key={property._id}>
                <div className="property-card-img-wrapper" style={{ height: '180px' }}>
                  <img
                    src={property.thumbnail || property.images?.[0]?.url || 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600'}
                    alt={property.title}
                    className="property-card-img"
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600'; }}
                  />
                  <div
                    className="property-card-tag"
                    style={{
                      backgroundColor: property.isVerified ? 'var(--success)' : 'var(--warning)',
                      color: 'white'
                    }}
                  >
                    {property.isVerified ? 'Verified' : 'Pending Verification'}
                  </div>
                </div>
                <div className="property-card-content" style={{ padding: '1.25rem' }}>
                  <div className="property-card-location">
                     {property.location?.area}, {property.location?.city}
                  </div>
                  <h3 className="property-card-title" style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                    {property.title}
                  </h3>
                  <div className="property-card-price" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
                    {formatPrice(property.price)}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <button className="btn btn-danger" style={{ padding: '0.4rem', fontSize: '0.8rem' }} onClick={() => handleDelete(property._id)}>
                      Delete
                    </button>
                    <Link to={`/property/${property._id}`} className="btn btn-primary" style={{ padding: '0.4rem', fontSize: '0.8rem' }}>
                      View
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

export default Properties;
