import React, { useState, useEffect, useCallback } from 'react';
import { Heart, MessageSquare, UserCircle, LayoutDashboard, PieChart, Briefcase, Building, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const Inquiries = () => {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState({});
  const [replyLoading, setReplyLoading] = useState(false);

  const fetchInquiries = useCallback(async () => {
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
  }, [user]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

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

  const handleReplySubmit = async (e, inqId) => {
    e.preventDefault();
    const msg = replyMessage[inqId];
    if (!msg || !msg.trim()) {
      toast.error('Response message cannot be empty');
      return;
    }
    setReplyLoading(true);
    try {
      const res = await api.post(`/inquiries/${inqId}/response`, { message: msg });
      if (res.data) {
        toast.success('Reply sent!');
        setReplyMessage({ ...replyMessage, [inqId]: '' });
        fetchInquiries();
      }
    } catch (err) {
      console.error('Error adding response:', err);
      toast.error('Failed to send reply');
    } finally {
      setReplyLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        {user?.role === 'investor' && (
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '1.5rem', color: '#fff', fontWeight: '700' }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <p style={{ textAlign: 'center', margin: '0.75rem 0 0', fontWeight: '700', fontSize: '0.9rem' }}>{user?.name}</p>
            <p style={{ textAlign: 'center', margin: '0.2rem 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Investor Profile</p>
          </div>
        )}
        <ul className="sidebar-menu">
          {user?.role === 'investor' ? (
            <>
              <li><NavLink to="/investor/dashboard" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}> <PieChart size={18} /> AI Portfolio Overview</NavLink></li>
              <li><NavLink to="/investor" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}> <Briefcase size={18} /> Deep Analysis Hub</NavLink></li>
              <li><NavLink to="/properties" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}> <Building size={18} /> Browse Listings</NavLink></li>
              <li><NavLink to="/user/saved" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}> <Heart size={18} /> Saved Deals</NavLink></li>
              <li><NavLink to="/user/inquiries" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}> <MessageSquare size={18} /> My Inquiries</NavLink></li>
              <li><NavLink to="/user/profile" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}> <Settings size={18} /> Investment Settings</NavLink></li>
            </>
          ) : (
            <>
              <li><NavLink to="/user/dashboard" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}><LayoutDashboard size={18} /> Overview</NavLink></li>
              <li><NavLink to="/user/saved" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}><Heart size={18} /> Saved Properties</NavLink></li>
              <li><NavLink to="/user/inquiries" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}><MessageSquare size={18} /> My Inquiries</NavLink></li>
              <li><NavLink to="/user/profile" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}><UserCircle size={18} /> My Profile</NavLink></li>
            </>
          )}
        </ul>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content">
        <h2>My Inquiries</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Track the status of inquiries and chat with agents directly.
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {inquiries.map((inq) => (
              <div
                key={inq._id}
                style={{
                  background: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem'
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontSize: '1.25rem' }}>
                      {inq.property?.title || 'Unknown Property'}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      <strong>Preferred Contact:</strong> {inq.preferredContact} | <strong>Type:</strong> {inq.inquiryType}
                    </p>
                    {inq.agent && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <strong>Agent:</strong> {inq.agent.firstName} {inq.agent.lastName} ({inq.agent.phone || 'No phone provided'})
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'end' }}>
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
                    <button className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => handleDelete(inq._id)}>
                      Delete
                    </button>
                  </div>
                </div>

                <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius)' }}>
                  <p style={{ margin: 0, fontStyle: 'italic', fontSize: '0.95rem' }}>"{inq.message}"</p>
                </div>

                {/* Responses Thread */}
                {inq.responses && inq.responses.length > 0 && (
                  <div style={{ paddingLeft: '1rem', borderLeft: '3px solid var(--primary)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <strong style={{ fontSize: '0.9rem' }}>Chat History:</strong>
                    {inq.responses.map((rep, idx) => (
                      <div key={idx} style={{ fontSize: '0.9rem', background: rep.sender?._id === user._id ? 'var(--primary-light)' : 'var(--bg)', padding: '0.75rem', borderRadius: 'var(--radius)' }}>
                        <strong style={{ color: rep.sender?._id === user._id ? 'var(--primary)' : 'var(--text)' }}>
                          {rep.sender?._id === user._id ? 'You' : (rep.sender?.firstName || 'Agent')}:
                        </strong> {rep.message}
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Form */}
                <form onSubmit={(e) => handleReplySubmit(e, inq._id)} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Type a message to the agent..."
                    value={replyMessage[inq._id] || ''}
                    onChange={(e) => setReplyMessage({ ...replyMessage, [inq._id]: e.target.value })}
                    required
                  />
                  <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }} disabled={replyLoading}>
                    Send
                  </button>
                </form>

              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Inquiries;
