import React, { useState, useEffect } from 'react';
import { PieChart, LayoutDashboard, Building, PlusCircle, MessageSquare, UserCircle, CheckCircle, DollarSign, Lightbulb, Bell } from 'lucide-react';


import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const formatPKR = (num) => {
  if (!num || isNaN(num)) return '—';
  if (num >= 10000000) return `${(num / 10000000).toFixed(1)} Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(0)} L`;
  return num.toLocaleString();
};

const Dashboard = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const [propRes, inqRes] = await Promise.all([
          api.get(`/properties/agent/${user._id}`),
          api.get(`/inquiries/agent/${user._id}`)
        ]);
        setProperties(propRes.data.properties || []);
        setInquiries(inqRes.data.inquiries || []);
      } catch (err) {
        console.error('Agent dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const activeProp = properties.filter(p => p.status === 'available');
  const pendingInq = inquiries.filter(i => i.status === 'pending' || !i.status);
  const totalRevenue = properties.reduce((s, p) => s + (p.purpose === 'sale' ? p.price : p.price * 12), 0);

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
          <div style={{ fontSize: '2rem', textAlign: 'center', display: 'flex', justifyContent: 'center' }}><Building size={32} color="var(--primary)" /></div>
          <p style={{ textAlign: 'center', margin: '0.5rem 0 0', fontWeight: '700', fontSize: '0.9rem' }}>{user?.name}</p>
          <p style={{ textAlign: 'center', margin: '0.2rem 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{user?.company || 'Real Estate Agent'}</p>
          {pendingInq.length > 0 && (
            <div style={{ marginTop: '0.75rem', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius)', padding: '0.5rem 0.75rem', fontSize: '0.78rem', color: '#f59e0b', textAlign: 'center' }}>
              <span style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'0.2rem'}}><Bell size={14} /> {pendingInq.length} new inquiry{pendingInq.length > 1 ? 'ies' : ''}</span>
            </div>
          )}
        </div>
        <ul className="sidebar-menu">
          <li><NavLink to="/agent/dashboard" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}> <LayoutDashboard size={18} /> Dashboard</NavLink></li>
          <li><NavLink to="/agent/properties" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}> <Building size={18} /> My Listings</NavLink></li>
          <li><NavLink to="/agent/add-property" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}> <PlusCircle size={18} /> Add Property</NavLink></li>
          <li><NavLink to="/agent/inquiries" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}> <MessageSquare size={18} /> Inquiries {pendingInq.length > 0 && <span style={{ background: '#f59e0b', color: '#000', borderRadius: '999px', padding: '0 0.4rem', fontSize: '0.7rem', fontWeight: '700', marginLeft: '0.25rem' }}>{pendingInq.length}</span>}</NavLink></li>
          <li><NavLink to="/agent/profile" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}> <UserCircle size={18} /> My Profile</NavLink></li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>Agent Workspace</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
              Welcome back, {user?.name?.split(' ')[0]}! Manage your listings and respond to buyer inquiries.
            </p>
          </div>
          <Link to="/agent/add-property" id="add-property-btn" className="btn btn-primary" style={{ fontSize: '0.9rem' }}>
             Add New Property
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '4rem 0' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: 'var(--primary-light)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', textAlign: 'center' }}>
                <span style={{ fontSize: '2rem', display: 'flex', justifyContent: 'center' }}><Building size={32} color="var(--primary)" /></span>
                <h3 style={{ margin: '0.5rem 0 0.25rem', fontSize: '1.75rem', color: 'var(--primary)' }}>{properties.length}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>Total Listings</p>
              </div>

              <div style={{ background: 'rgba(16,185,129,0.1)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(16,185,129,0.25)', textAlign: 'center' }}>
                <span style={{ fontSize: '2rem', display: 'flex', justifyContent: 'center' }}><CheckCircle size={32} color="#10b981" /></span>
                <h3 style={{ margin: '0.5rem 0 0.25rem', fontSize: '1.75rem', color: '#10b981' }}>{activeProp.length}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>Active Listings</p>
              </div>

              <div style={{ background: 'rgba(245,158,11,0.1)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(245,158,11,0.25)', textAlign: 'center' }}>
                <span style={{ fontSize: '2rem', display: 'flex', justifyContent: 'center' }}><MessageSquare size={32} color="#f59e0b" /></span>
                <h3 style={{ margin: '0.5rem 0 0.25rem', fontSize: '1.75rem', color: '#f59e0b' }}>{inquiries.length}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>Total Inquiries</p>
              </div>

              <div style={{ background: 'rgba(99,102,241,0.1)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(99,102,241,0.25)', textAlign: 'center' }}>
                <span style={{ fontSize: '2rem', display: 'flex', justifyContent: 'center' }}><DollarSign size={32} color="#6366f1" /></span>
                <h3 style={{ margin: '0.5rem 0 0.25rem', fontSize: '1.25rem', color: '#6366f1' }}>PKR {formatPKR(totalRevenue)}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}> <PieChart size={18} /> Portfolio Value</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              {/* Recent Listings */}
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem' }}> My Recent Listings</h3>
                  <Link to="/agent/properties" style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '600' }}>View All →</Link>
                </div>
                {properties.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    No listings yet. <Link to="/agent/add-property" style={{ color: 'var(--primary)', fontWeight: '600' }}>Add your first property!</Link>
                  </div>
                ) : (
                  <ul style={{ listStyle: 'none', padding: '0.5rem 0', margin: 0 }}>
                    {properties.slice(0, 4).map(prop => (
                      <li key={prop._id} style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Link to={`/property/${prop._id}`} style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: '600', fontSize: '0.85rem' }}>{prop.title?.substring(0, 40)}...</Link>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}> {prop.location?.city} · {prop.bedrooms} bed</p>
                        </div>
                        <span style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '0.85rem', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>PKR {formatPKR(prop.price)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Recent Inquiries */}
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem' }}> Recent Inquiries</h3>
                  <Link to="/agent/inquiries" style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '600' }}>View All →</Link>
                </div>
                {inquiries.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    No inquiries received yet. Listings with more details attract more buyers.
                  </div>
                ) : (
                  <ul style={{ listStyle: 'none', padding: '0.5rem 0', margin: 0 }}>
                    {inquiries.slice(0, 4).map(inq => (
                      <li key={inq._id} style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                        <p style={{ margin: '0 0 0.25rem', fontWeight: '600', fontSize: '0.85rem' }}>{inq.name || 'Anonymous'}</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{inq.message || inq.subject || 'Inquiry about property'}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Performance Tips */}
            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
              <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Lightbulb size={20} /> Agent Performance Tips</h3>
              <ul style={{ margin: 0, padding: '0 0 0 1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <li>Complete property descriptions with all amenities increase inquiries by 3x.</li>
                <li>Upload at least 5 high-quality images — listings with more photos rank higher.</li>
                <li>Respond to inquiries within 2 hours for best conversion rates.</li>
                <li>Verified listings get 40% more visibility in search results.</li>
              </ul>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
