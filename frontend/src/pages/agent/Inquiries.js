import React, { useState, useEffect, useCallback } from 'react';
import { Building, PlusCircle, MessageSquare, UserCircle } from 'lucide-react';


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
      const res = await api.get(`/inquiries/agent/${user._id}`);
      setInquiries(res.data.inquiries || []);
    } catch (err) {
      console.error('Error loading inquiries:', err);
      toast.error('Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await api.patch(`/inquiries/${id}/status`, { status: newStatus });
      if (res.data) {
        setInquiries(inquiries.map((inq) => (inq._id === id ? { ...inq, status: newStatus } : inq)));
        toast.success(`Inquiry status updated to ${newStatus}`);
      }
    } catch (err) {
      console.error('Error updating inquiry status:', err);
      toast.error('Failed to update status');
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
        toast.success('Reply added to inquiry!');
        setReplyMessage({ ...replyMessage, [inqId]: '' });
        fetchInquiries(); // reload to get new response lists
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
        <ul className="sidebar-menu">
          <li><NavLink to="/agent/dashboard" className="sidebar-link"> Summary</NavLink></li>
          <li><NavLink to="/agent/properties" className="sidebar-link"><Building size={18} /> My Listings</NavLink></li>
          <li><NavLink to="/agent/add-property" className="sidebar-link"><PlusCircle size={18} /> Add Property</NavLink></li>
          <li><NavLink to="/agent/inquiries" className="sidebar-link active"><MessageSquare size={18} /> Inquiries</NavLink></li>
          <li><NavLink to="/agent/profile" className="sidebar-link"><UserCircle size={18} /> My Profile</NavLink></li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content">
        <h2>Customer Inquiries</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Respond to potential buyers and manage inquiry workflows.
        </p>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '4rem 0' }}>
            <div className="spinner"></div>
          </div>
        ) : inquiries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            No inquiries received yet.
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
                  padding: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                      {inq.property?.title || 'Unknown Property'}
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      <strong>From:</strong> {inq.user?.firstName} {inq.user?.lastName} ({inq.user?.email} | {inq.user?.phone})
                    </p>
                  </div>
                  <div>
                    <select
                      value={inq.status}
                      className="form-control"
                      style={{ width: '150px', padding: '0.4rem' }}
                      onChange={(e) => handleStatusChange(inq._id, e.target.value)}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius)' }}>
                  <p style={{ margin: 0, fontStyle: 'italic' }}>"{inq.message}"</p>
                </div>

                {/* Responses Thread */}
                {inq.responses && inq.responses.length > 0 && (
                  <div style={{ paddingLeft: '1rem', borderLeft: '3px solid var(--primary)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <strong>Message History:</strong>
                    {inq.responses.map((rep, idx) => (
                      <div key={idx} style={{ fontSize: '0.85rem' }}>
                        <strong>{rep.sender?.firstName || 'User'}:</strong> {rep.message}
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Form */}
                <form onSubmit={(e) => handleReplySubmit(e, inq._id)} style={{ display: 'flex', gap: '1rem' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Write a response message..."
                    value={replyMessage[inq._id] || ''}
                    onChange={(e) => setReplyMessage({ ...replyMessage, [inq._id]: e.target.value })}
                    required
                  />
                  <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }} disabled={replyLoading}>
                    Send Reply
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
