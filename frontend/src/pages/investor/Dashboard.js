import React, { useState, useEffect } from 'react';
import { PieChart as PieChartIcon, Briefcase, Building, Heart, DollarSign, Target, Settings, ChevronRight, MessageSquare, TrendingUp, BrainCircuit, Activity, MapPin, Download, ArrowUpRight } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const formatPKR = (num) => {
  if (!num || isNaN(num)) return '—';
  if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Crore`;
  if (num >= 100000) return `${(num / 100000).toFixed(2)} Lakh`;
  return num.toLocaleString();
};

const InvestorDashboard = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Interactive AI Parameters (Local state instead of profile redirect)
  const [budget, setBudget] = useState(user?.investorProfile?.budget || 50000000);
  const [targetCity, setTargetCity] = useState(user?.investorProfile?.targetCity || 'Lahore');
  const [strategy, setStrategy] = useState(user?.investorProfile?.strategy || 'capital');
  const [propertyType, setPropertyType] = useState('House');

  // Calculator states
  const [calcHoldingPeriod, setCalcHoldingPeriod] = useState(3);
  const [calcMonthlyRent, setCalcMonthlyRent] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch matching listings
        const propRes = await api.get(`/properties?city=${targetCity}&type=${propertyType}&limit=20`);
        setProperties(propRes.data.properties || []);
        
        // Fetch AI analytical data
        const dataRes = await api.get(`/properties/data`);
        // Filter analytics by city and type loosely
        let filteredAnalytics = dataRes.data.properties.filter(p => 
          p.city.toLowerCase() === targetCity.toLowerCase()
        );
        if (filteredAnalytics.length === 0) filteredAnalytics = dataRes.data.properties; // fallback
        setAnalyticsData(filteredAnalytics);

      } catch (err) {
        console.error('Investor dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [targetCity, propertyType, budget, strategy]);

  // Derived Metrics
  const withinBudget = properties.filter(p => p.price <= budget);
  
  // Aggregate data from AI backend
  const topTierAssets = analyticsData.filter(a => a.tierScore >= 7);
  const avgAppreciation = topTierAssets.length > 0 
    ? (topTierAssets.reduce((s, a) => s + (a.threeYearAppreciation || 45), 0) / topTierAssets.length).toFixed(1)
    : 45.5;
  const avgYield = topTierAssets.length > 0 
    ? (topTierAssets.reduce((s, a) => s + (a.expectedRentalYield || 5), 0) / topTierAssets.length).toFixed(1)
    : 5.2;

  // Chart Data (Mocking historical trends for the selected city)
  const chartData = [
    { year: '2020', priceIndex: 100 },
    { year: '2021', priceIndex: 112 },
    { year: '2022', priceIndex: 128 },
    { year: '2023', priceIndex: 155 },
    { year: '2024', priceIndex: Math.round(155 * (1 + (avgAppreciation/100)/3)) }
  ];

  // Calculators logic
  const estimatedFutureValue = budget * Math.pow(1 + ((avgAppreciation/3)/100), calcHoldingPeriod);
  const expectedProfit = estimatedFutureValue - budget;
  
  // Dynamic rental calculation
  useEffect(() => {
    setCalcMonthlyRent(Math.round((budget * (avgYield / 100)) / 12));
  }, [budget, avgYield]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar hide-on-print">
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '1.5rem', color: '#fff', fontWeight: '700' }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <p style={{ textAlign: 'center', margin: '0.75rem 0 0', fontWeight: '700', fontSize: '0.9rem' }}>{user?.name}</p>
          <p style={{ textAlign: 'center', margin: '0.2rem 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>AI Investor Hub</p>
        </div>
        <ul className="sidebar-menu">
          <li><NavLink to="/investor/dashboard" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}> <PieChartIcon size={18} /> Deep Analysis Hub</NavLink></li>
          <li><NavLink to="/properties" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}> <Building size={18} /> Browse Listings</NavLink></li>
          <li><NavLink to="/user/saved" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}> <Heart size={18} /> Saved Deals</NavLink></li>
          <li><NavLink to="/user/inquiries" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}> <MessageSquare size={18} /> My Inquiries</NavLink></li>
          <li><NavLink to="/user/profile" className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}> <Settings size={18} /> Account Settings</NavLink></li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BrainCircuit size={28} color="var(--primary)" /> Pakistan Real Estate AI Analyst
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0.4rem 0 0', fontSize: '0.95rem' }}>
              Live market intelligence, predictive growth, and ROI calculators based on local mechanics.
            </p>
          </div>
          <button onClick={handlePrint} className="btn btn-primary hide-on-print" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={16} /> Generate Report
          </button>
        </div>

        {/* ─── INTERACTIVE AI PARAMETER CONTROLS ─── */}
        <div className="hide-on-print" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '2rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={18} color="var(--primary)" /> AI Analysis Parameters
          </h3>
          <div className="grid-responsive-3" style={{ gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Investment Budget (PKR)</label>
              <select className="form-control" value={budget} onChange={(e) => setBudget(Number(e.target.value))}>
                <option value={10000000}>1 Crore</option>
                <option value={30000000}>3 Crore</option>
                <option value={50000000}>5 Crore</option>
                <option value={100000000}>10 Crore</option>
                <option value={500000000}>50+ Crore</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Target City</label>
              <select className="form-control" value={targetCity} onChange={(e) => setTargetCity(e.target.value)}>
                <option value="Lahore">Lahore</option>
                <option value="Karachi">Karachi</option>
                <option value="Islamabad">Islamabad</option>
                <option value="Rawalpindi">Rawalpindi</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Asset Type</label>
              <select className="form-control" value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
                <option value="House">Residential House</option>
                <option value="Plot">Residential Plot</option>
                <option value="Commercial">Commercial / Shop</option>
                <option value="Apartment">Apartment</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input type="radio" name="strategy" checked={strategy === 'capital'} onChange={() => setStrategy('capital')} /> Optimize for Capital Gain (Plots/Files)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input type="radio" name="strategy" checked={strategy === 'rental'} onChange={() => setStrategy('rental')} /> Optimize for Rental Yield (Comm/Houses)
            </label>
          </div>
        </div>

        {/* ─── HIGH LEVEL KPIs ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', borderLeft: '4px solid #3b82f6' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Projected 3-Yr Growth</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              +{avgAppreciation}% <TrendingUp size={24} />
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>Based on {targetCity} momentum data</div>
          </div>

          <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', borderLeft: '4px solid #10b981' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Avg Rental Yield</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {propertyType === 'Plot' ? '0.0' : avgYield}% <Activity size={24} />
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>Annual yield for {propertyType}s</div>
          </div>

          <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Market Temperature</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Hot <ArrowUpRight size={24} />
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>High institutional buying volume</div>
          </div>
        </div>

        <div className="grid-responsive-2" style={{ gap: '2rem', marginBottom: '2rem' }}>
          {/* ─── HISTORICAL PRICE TRENDS CHART ─── */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} color="var(--primary)" /> 5-Year Price Trend ({targetCity})
            </h3>
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="year" stroke="var(--text-3)" fontSize={12} />
                  <YAxis stroke="var(--text-3)" fontSize={12} domain={['dataMin - 10', 'dataMax + 20']} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Line type="monotone" dataKey="priceIndex" name="Price Index" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ─── ROI CALCULATORS ─── */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DollarSign size={18} color="#10b981" /> Investment ROI Calculator
            </h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Holding Period (Years)</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>{calcHoldingPeriod} Years</span>
              </div>
              <input type="range" min="1" max="10" value={calcHoldingPeriod} onChange={(e) => setCalcHoldingPeriod(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
            </div>

            <div style={{ background: 'var(--bg)', padding: '1rem', borderRadius: 'var(--r)', border: '1px solid var(--border)', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Expected Resale Value ({calcHoldingPeriod} yrs)</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>PKR {formatPKR(estimatedFutureValue)}</div>
              <div style={{ fontSize: '0.85rem', color: '#10b981', marginTop: '0.2rem', fontWeight: 600 }}>+ PKR {formatPKR(expectedProfit)} Net Profit</div>
            </div>

            <div style={{ background: 'var(--bg)', padding: '1rem', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Estimated Monthly Rental Income</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: propertyType === 'Plot' ? 'var(--text-3)' : '#3b82f6' }}>
                {propertyType === 'Plot' ? 'Not applicable for plots' : `PKR ${calcMonthlyRent.toLocaleString()}`}
              </div>
            </div>
          </div>
        </div>

        {/* ─── AREA DEVELOPMENT INFO & ALERTS ─── */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={18} color="#f59e0b" /> Area Development & High-Growth Alerts
          </h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {analyticsData.slice(0, 3).map((item, idx) => (
              item.developmentInfo && item.developmentInfo.length > 0 && (
                <div key={idx} style={{ background: 'var(--surface)', padding: '1.25rem', borderRadius: 'var(--r)', border: '1px solid var(--border)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '0.5rem', borderRadius: '50%' }}>
                    <Target size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem', fontSize: '1rem' }}>{item.location}, {item.city}</h4>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {item.developmentInfo.map((info, i) => (
                        <li key={i} style={{ marginBottom: '0.2rem' }}>{info}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>

        {/* ─── MATCHING INVESTMENT LISTINGS ─── */}
        <div>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building size={18} color="var(--primary)" /> Top Investment Matches in {targetCity}
          </h3>
          
          {loading ? (
            <div className="flex-center" style={{ padding: '3rem' }}><div className="spinner"></div></div>
          ) : withinBudget.length === 0 ? (
             <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
               <p style={{ color: 'var(--text-secondary)' }}>No premium inventory matches your criteria currently. Try adjusting budget or city.</p>
             </div>
          ) : (
            <div className="properties-grid">
              {withinBudget.map(prop => (
                <Link to={`/property/${prop._id}`} key={prop._id} className="property-card" style={{ textDecoration: 'none' }}>
                  <div className="property-card-img-wrapper" style={{ height: '180px' }}>
                    <img src={prop.thumbnail || prop.images?.[0]?.url || '/images/placeholder.jpg'} alt={prop.title} className="property-card-img" />
                    <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(16,185,129,0.9)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                      {strategy === 'rental' ? 'HIGH YIELD' : 'CAPITAL GAIN'}
                    </div>
                  </div>
                  <div style={{ padding: '1.25rem' }}>
                    <p style={{ margin: '0 0 0.5rem', fontWeight: '700', fontSize: '0.95rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prop.title}</p>
                    <p style={{ margin: 0, color: 'var(--primary)', fontWeight: '800', fontSize: '1.1rem' }}>PKR {formatPKR(prop.price)}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{prop.location?.area}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#10b981' }}>Est. Yield: {avgYield}%</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Print-specific CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .hide-on-print { display: none !important; }
          .dashboard-layout { grid-template-columns: 1fr !important; display: block; }
          .dashboard-content { padding: 0 !important; margin: 0 !important; }
          body { background: white; }
          .property-card { break-inside: avoid; border: 1px solid #ccc !important; box-shadow: none !important; }
        }
      `}} />
    </div>
  );
};

export default InvestorDashboard;
