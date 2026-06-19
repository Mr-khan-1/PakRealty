import React, { useState, useEffect } from 'react';
import { PieChart, Briefcase, Building, UserCircle, Heart, DollarSign, Building2, Lightbulb, Search, TrendingUp } from 'lucide-react';


import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const formatPKR = (num) => {
  if (!num || isNaN(num)) return '—';
  if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(2)} L`;
  return num.toLocaleString();
};

const InvestorDashboard = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const budget = user?.investorProfile?.budget || 0;
  const targetCity = user?.investorProfile?.targetCity || 'Islamabad';
  const strategy = user?.investorProfile?.strategy || 'rental';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const propRes = await api.get(`/properties?city=${targetCity}&limit=50`);
        setProperties(propRes.data.properties || []);
      } catch (err) {
        console.error('Investor dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [targetCity, budget, strategy]);

  // Within-budget properties
  const withinBudget = properties.filter(p => p.purpose === 'sale' && p.price <= budget);
  const forRent = properties.filter(p => p.purpose === 'rent');
  const avgRentPrice = forRent.length > 0 ? Math.round(forRent.reduce((s, p) => s + p.price, 0) / forRent.length) : 0;
  const estimatedYield = avgRentPrice > 0 && budget > 0
    ? ((avgRentPrice * 12) / budget * 100).toFixed(1)
    : '—';

  const STRATEGY_TIPS = {
    rental: [
      `Your budget of PKR ${formatPKR(budget)} can yield ~${estimatedYield}% annual rental return in ${targetCity}.`,
      `Focus on 5-10 Marla units in sectors with high occupancy like DHA and Bahria Town.`,
      `Short-term rentals via Airbnb can boost gross yields by 40-80% over long-term leases.`,
      `Avoid ground floors — upper floors command 10-15% higher rent in most Pakistani cities.`,
    ],
    capital: [
      `Capital gains in ${targetCity} premium societies average 18-25% annually over 5 years.`,
      `File 1-channel plots in newly launched phases for maximum appreciation on exit.`,
      `Look for under-construction inventory — 20-30% discount vs. ready possession.`,
      `Track NOC approvals: an approved NOC can spike prices 30% overnight.`,
    ]
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
          <div style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '0.5rem' }}></div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', margin: 0 }}>
            {targetCity} · {strategy === 'rental' ? 'Rental Yield' : 'Capital Gains'}
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--primary)', textAlign: 'center', fontWeight: '700', margin: '0.25rem 0 0' }}>
            PKR {formatPKR(budget)}
          </p>
        </div>
        <ul className="sidebar-menu">
          <li><NavLink to="/investor/dashboard" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}> <PieChart size={18} /> Portfolio Overview</NavLink></li>
          <li><NavLink to="/investor" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}> <Briefcase size={18} /> Investor Hub Analysis</NavLink></li>
          <li><NavLink to="/properties" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}> Browse Listings</NavLink></li>
          <li><NavLink to="/comparison" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}>️ Compare Properties</NavLink></li>
          <li><NavLink to="/user/saved" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}> <Heart size={18} /> Saved Listings</NavLink></li>
          <li><NavLink to="/user/profile" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}> <UserCircle size={18} /> My Profile</NavLink></li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>Investor Dashboard</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
              Welcome back, {user?.name?.split(' ')[0]}! Here's your investment overview for <strong>{targetCity}</strong>.
            </p>
          </div>
          <Link to="/investor" className="btn btn-primary" style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Search size={16} /> Run Full Analysis
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '4rem 0' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              <div style={{ background: 'var(--primary-light)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', textAlign: 'center' }}>
                <span style={{ fontSize: '2rem', display: 'flex', justifyContent: 'center' }}><DollarSign size={32} color="var(--primary)" /></span>
                <h3 style={{ margin: '0.75rem 0 0.25rem', fontSize: '1.5rem', color: 'var(--primary)' }}>PKR {formatPKR(budget)}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>Investment Capital</p>
              </div>

              <div style={{ background: 'var(--primary-light)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', textAlign: 'center' }}>
                <span style={{ fontSize: '2rem', display: 'flex', justifyContent: 'center' }}><Building size={32} color="#10b981" /></span>
                <h3 style={{ margin: '0.75rem 0 0.25rem', fontSize: '1.5rem', color: '#10b981' }}>{withinBudget.length}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>Properties Within Budget</p>
              </div>

              <div style={{ background: strategy === 'rental' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: `1px solid ${strategy === 'rental' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`, textAlign: 'center' }}>
                <span style={{ fontSize: '2rem', display: 'flex', justifyContent: 'center' }}>{strategy === 'rental' ? <Briefcase size={32} color="#10b981" /> : <TrendingUp size={32} color="#f59e0b" />}</span>
                <h3 style={{ margin: '0.75rem 0 0.25rem', fontSize: '1.5rem', color: strategy === 'rental' ? '#10b981' : '#f59e0b' }}>
                  {strategy === 'rental' ? `${estimatedYield}%` : '18–25%'}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                  {strategy === 'rental' ? 'Est. Annual Yield' : 'Avg Capital Growth (5yr)'}
                </p>
              </div>

              <div style={{ background: 'rgba(99,102,241,0.1)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(99,102,241,0.3)', textAlign: 'center' }}>
                <span style={{ fontSize: '2rem', display: 'flex', justifyContent: 'center' }}><Building2 size={32} color="#6366f1" /></span>
                <h3 style={{ margin: '0.75rem 0 0.25rem', fontSize: '1.5rem', color: '#6366f1' }}>{targetCity}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>Target Market</p>
              </div>
            </div>

            {/* Strategy Tips */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '2rem' }}>
              <h3 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lightbulb size={20} color="#f59e0b" /> {strategy === 'rental' ? 'Rental Yield' : 'Capital Appreciation'} Strategy Insights
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem' }}>
                {STRATEGY_TIPS[strategy].map((tip, i) => (
                  <li key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.75rem', background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: '700', minWidth: '1.5rem' }}>{i + 1}.</span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Properties Within Budget */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}> Properties Within Your Budget — {targetCity}</h3>
                <Link to="/properties" style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: '600' }}>View All →</Link>
              </div>

              {withinBudget.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--card-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                  <p style={{ color: 'var(--text-secondary)' }}>No listings within budget found for {targetCity}. Try browsing all properties.</p>
                  <Link to="/properties" className="btn btn-primary" style={{ marginTop: '1rem' }}>Browse All Listings</Link>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  {withinBudget.slice(0, 6).map(prop => (
                    <Link to={`/property/${prop._id}`} key={prop._id} style={{ textDecoration: 'none' }}>
                      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', transition: 'all 0.2s ease' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        <div style={{ height: '160px', background: `url(${prop.thumbnail || prop.images?.[0]?.url}) center/cover no-repeat`, backgroundColor: 'var(--border)' }} />
                        <div style={{ padding: '1rem' }}>
                          <p style={{ margin: '0 0 0.25rem', fontWeight: '600', fontSize: '0.85rem', color: 'var(--text)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{prop.title}</p>
                          <p style={{ margin: 0, color: 'var(--primary)', fontWeight: '700', fontSize: '0.95rem' }}>PKR {formatPKR(prop.price)}</p>
                          <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                             {prop.location?.area}, {prop.location?.city} · {prop.bedrooms} bed · {prop.area?.value} {prop.area?.unit}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default InvestorDashboard;
