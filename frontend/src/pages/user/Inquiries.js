import React, { useState, useEffect } from 'react';
import { Heart, MessageSquare, UserCircle } from 'lucide-react';


import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const Inquiries = () => {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInquiries = async () => {
      if (!user) return;
      try {
        const res = await api.get(`/inquiries/user/${user._id}`);
        setInquiries(res.data.inquiries || []);
      } catch (err) {
        console.error('Error fetching inquiries:', err);
        toast.error('Failed to load inquiries');
      } finally {
        setLoading(false);
      }
    };
    fetchInquiries();
  }, [user]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this inquiry?')) return;
    try {
      await api.delete(`/inquiries/${id}`);
      setInquiries(inquiries.filter((inq) => inq._id !== id));
      toast.success('Inquiry deleted successfully');
    } catch (err) {
      console.error('Error deleting inquiry:', err);
      toast.error('Failed to delete inquiry');
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <ul className="sidebar-menu">
          <li><NavLink to="/user/dashboard" className="sidebar-link"> Summary</NavLink></li>
          <li><NavLink to="/user/saved" className="sidebar-link"><Heart size={18} /> Saved Properties</NavLink></li>
          <li><NavLink to="/user/inquiries" className="sidebar-link active"><MessageSquare size={18} /> My Inquiries</NavLink></li>
          <li><NavLink to="/user/profile" className="sidebar-link"><UserCircle size={18} /> My Profile</NavLink></li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content">
        <h2>My Inquiries</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Track the status of inquiries you've made on properties.
        </p>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '4rem 0' }}>
            <div className="spinner"></div>
          </div>
        ) : inquiries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            You haven't submitted any inquiries yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {inquiries.map((inq) => (
              <div
                key={inq._id}
                style={{
                  background: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  gap: '1rem'
                }}
              >
                <div>
                  <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>
                    {inq.property?.title || 'Unknown Property'}
                  </h4>
                  <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    <strong>Message:</strong> {inq.message}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <strong>Preferred Contact:</strong> {inq.preferredContact} | <strong>Type:</strong> {inq.inquiryType}
                  </p>
                  {inq.agent && (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', padding: '0.5rem', background: 'var(--background)', borderRadius: 'var(--radius)' }}>
                      <strong>Agent:</strong> {inq.agent.firstName} {inq.agent.lastName} ({inq.agent.phone || 'No phone provided'})
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'end' }}>
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      color: 'white',
                      backgroundColor:
                        inq.status === 'resolved'
                          ? 'var(--success)'
                          : inq.status === 'in-progress'
                          ? 'var(--info)'
                          : 'var(--accent)'
                    }}
                  >
                    {inq.status?.toUpperCase() || 'NEW'}
                  </span>
                  <button className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleDelete(inq._id)}>
                    Cancel
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

export default Inquiries;
