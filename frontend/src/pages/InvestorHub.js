import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const InvestorHub = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState('All');
  const [budgetFilter, setBudgetFilter] = useState('');
  const [strategyFilter, setStrategyFilter] = useState('All');
  const [isReportOpen, setIsReportOpen] = useState(false);

  useEffect(() => {
    const fetchAnalyzerData = async () => {
      try {
        const res = await api.get('/properties/data');
        if (res.data && res.data.success) {
          setProperties(res.data.properties || []);
        }
      } catch (err) {
        console.error('Error loading analyzer data:', err);
        toast.error('Failed to load investment data');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalyzerData();
  }, []);

  const formatPKR = (amount) => {
    if (!amount) return '0';
    if (amount >= 10000000) return `${(amount / 10000000).toFixed(2)} Crore`;
    if (amount >= 100000) return `${(amount / 100000).toFixed(2)} Lakh`;
    return amount.toLocaleString();
  };

  const filteredProperties = properties.filter(p => {
    if (cityFilter !== 'All' && p.city !== cityFilter.toLowerCase()) return false;
    if (budgetFilter && p.price > parseInt(budgetFilter)) return false;
    if (strategyFilter !== 'All' && !p.tags?.includes(strategyFilter)) return false;
    return true;
  });

  const topOpportunities = filteredProperties.slice(0, 3);
  
  // Prepare chart data (Average Price Per Marla by Top Locations)
  const locMap = {};
  filteredProperties.forEach(p => {
    if (!locMap[p.location]) locMap[p.location] = { total: 0, count: 0 };
    locMap[p.location].total += p.price_per_marla;
    locMap[p.location].count += 1;
  });
  
  const chartData = Object.keys(locMap)
    .map(loc => ({
      location: loc,
      avg: locMap[loc].total / locMap[loc].count
    }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);

  const maxChartVal = chartData.length ? Math.max(...chartData.map(d => d.avg)) : 1;

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh', paddingBottom: '4rem' }}>
      
      {/* ENTERPRISE TERMINAL HEADER - Styled using native theme variables */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
        color: 'white',
        padding: '4rem 1.5rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle blur circles */}
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '30vw', height: '30vw', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(80px)' }}></div>
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '35vw', height: '35vw', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', filter: 'blur(100px)' }}></div>

        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <span style={{
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            display: 'inline-block',
            marginBottom: '1.5rem'
          }}>
            Enterprise Intelligence Platform
          </span>
          <h1 style={{ color: 'white', fontSize: '2.5rem', fontWeight: '800', marginBottom: '1.2rem', letterSpacing: '-0.025em' }}>
            Property Investment Analyzer
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            Evaluate real estate assets instantly with our proprietary Multi-Factor PMVI Scoring Engine.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '-2rem auto 0', padding: '0 1.5rem', position: 'relative', zIndex: 5 }}>
        
        {/* CONTROL PANEL */}
        <div style={{ 
          background: 'var(--surface)', 
          border: '1px solid var(--border)', 
          padding: '1.5rem', 
          borderRadius: 'var(--radius-lg)', 
          boxShadow: 'var(--shadow-md)', 
          display: 'flex', 
          gap: '1.5rem', 
          marginBottom: '2rem', 
          flexWrap: 'wrap' 
        }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Market Sector</label>
            <select className="form-control" value={cityFilter} onChange={e => setCityFilter(e.target.value)}>
              <option value="All">Global (All Markets)</option>
              <option value="Islamabad">Islamabad</option>
              <option value="Lahore">Lahore</option>
              <option value="Karachi">Karachi</option>
            </select>
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Max Capital (PKR)</label>
            <input type="number" className="form-control" placeholder="e.g. 50000000" value={budgetFilter} onChange={e => setBudgetFilter(e.target.value)} />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Algorithmic Strategy</label>
            <select className="form-control" value={strategyFilter} onChange={e => setStrategyFilter(e.target.value)}>
              <option value="All">All Strategies</option>
              <option value="Best Value Deal">Best Value Deals</option>
              <option value="Growth Potential">High Growth Potential</option>
              <option value="Safe Investment">Safe Haven Assets</option>
              <option value="Quick Flip">Quick Flip / Arbitrage</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
            <div>Processing Intelligence Matrix...</div>
          </div>
        ) : (
          <>
            {/* AI RECOMMENDATIONS ENGINE */}
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Top 3 Recommended Assets</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
              {topOpportunities.map((prop, idx) => (
                <div key={prop.id} style={{ 
                  background: 'var(--surface)', 
                  border: '1px solid var(--border)', 
                  borderRadius: 'var(--radius-lg)', 
                  padding: '1.5rem', 
                  position: 'relative', 
                  overflow: 'hidden', 
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'var(--transition)'
                }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '1.15rem' }}>{prop.location}</h4>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'capitalize' }}>{prop.city}</span>
                    </div>
                    <div style={{ textAlign: 'right', background: 'var(--primary-light)', padding: '0.5rem', borderRadius: 'var(--radius)' }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary)', display: 'block', lineHeight: 1 }}>
                        {prop.investmentScore}
                      </span>
                      <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 'bold' }}>PMVI Score</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                    {prop.tags?.map(tag => (
                      <span key={tag} style={{ background: 'var(--surface-hover)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: '600' }}>
                        {tag}
                      </span>
                    ))}
                    {prop.discountVsLoc <= -5 && (
                      <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {Math.abs(prop.discountVsLoc)}% Below Market
                      </span>
                    )}
                  </div>

                  <div className="grid-responsive-2" style={{ gap: '1rem', background: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div>
                      <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Asking Price</span>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>{formatPKR(prop.price)}</strong>
                    </div>
                    <div>
                      <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Price / Marla</span>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>{formatPKR(prop.price_per_marla)}</strong>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '1.2rem', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    <strong>Investment Thesis:</strong> Exceptional <span style={{color: 'var(--text-primary)', fontWeight: '500'}}>price efficiency ({prop.priceEfficiency}/10)</span> combined with strong location momentum (<span style={{color: 'var(--text-primary)', fontWeight: '500'}}>{prop.momentumScore}/10</span>). Ideal for {prop.tags?.includes('Quick Flip') ? 'short-term arbitrage' : 'capital appreciation'}.
                  </div>
                </div>
              ))}
            </div>

            <div className="grid-responsive-2" style={{ gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
              
              {/* TERMINAL DATA GRID */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Market Intelligence Ledger</h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Showing {Math.min(filteredProperties.length, 50)} Assets</span>
                </div>
                
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--background)', borderBottom: '2px solid var(--border)' }}>
                          <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Location</th>
                          <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Market Price</th>
                          <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Price Efficiency</th>
                          <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '600', textAlign: 'right' }}>Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProperties.slice(0, 50).map(p => (
                          <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{p.location}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{p.city}</div>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{formatPKR(p.price)}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{formatPKR(p.price_per_marla)} / Marla</div>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '60px', height: '6px', background: 'var(--background)', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ width: `${p.priceEfficiency * 10}%`, background: p.priceEfficiency > 7 ? 'var(--success)' : p.priceEfficiency > 4 ? 'var(--warning)' : 'var(--danger)', height: '100%' }}></div>
                                </div>
                                <span style={{ fontSize: '0.8rem', fontWeight: '500', color: p.discountVsLoc < 0 ? 'var(--success)' : 'var(--danger)' }}>
                                  {p.discountVsLoc < 0 ? '' : '+'}{p.discountVsLoc}%
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                              <span style={{ 
                                background: p.investmentScore >= 8 ? 'var(--success-light, #dcfce7)' : 'var(--background)', 
                                color: p.investmentScore >= 8 ? 'var(--success)' : 'var(--text-primary)', 
                                padding: '0.3rem 0.6rem', 
                                borderRadius: 'var(--radius)', 
                                fontWeight: 'bold' 
                              }}>
                                {p.investmentScore.toFixed(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ANALYTICS CHARTS */}
              <div>
                <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
                  Micro-Market Analysis
                </h3>
                
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '1.5rem', marginTop: 0 }}>Valuation Index (Price/Marla)</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    {chartData.map((d, i) => {
                      const pct = Math.max(5, (d.avg / maxChartVal) * 100);
                      return (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                            <span style={{ fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '65%' }}>{d.location}</span>
                            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{formatPKR(d.avg)}</span>
                          </div>
                          <div style={{ width: '100%', background: 'var(--background)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, background: 'var(--primary)', height: '100%', borderRadius: '4px' }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ background: 'var(--primary-light)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                  <h4 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '0.5rem', marginTop: 0 }}>Portfolio Analytics Tool</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                    Generate comprehensive investment PDF reports, simulate scenario analysis, and view predictive market forecasts.
                  </p>
                  <button 
                    className="btn btn-primary" 
                    style={{ width: '100%', padding: '0.75rem', fontWeight: 'bold' }}
                    onClick={() => setIsReportOpen(true)}
                  >
                    Generate Enterprise Report
                  </button>
                </div>
              </div>

            </div>
          </>
        )}
      </div>

      {/* PORTFOLIO REPORT MODAL */}
      {isReportOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--surface)', width: '100%', maxWidth: '800px', maxHeight: '90vh', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', overflowY: 'auto', position: 'relative' }}>
            <div style={{ padding: '2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="print-header">
              <div>
                <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Enterprise Portfolio Report</h2>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{new Date().toLocaleDateString()} • Market: {cityFilter}</span>
              </div>
              <button onClick={() => setIsReportOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }} className="no-print">×</button>
            </div>
            
            <div style={{ padding: '2rem' }}>
              <div className="grid-responsive-3" style={{ marginBottom: '2rem' }}>
                <div style={{ background: 'var(--background)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>1-Year Forecast</span>
                  <strong style={{ fontSize: '1.5rem', color: 'var(--success)' }}>+12.4%</strong>
                </div>
                <div style={{ background: 'var(--background)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>3-Year Forecast</span>
                  <strong style={{ fontSize: '1.5rem', color: 'var(--success)' }}>+31.8%</strong>
                </div>
                <div style={{ background: 'var(--background)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Risk Profile</span>
                  <strong style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>MODERATE</strong>
                </div>
              </div>

              <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Diversification Strategy</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '2rem' }}>
                Based on your criteria (Budget: {budgetFilter ? formatPKR(budgetFilter) : 'Unlimited'}, Strategy: {strategyFilter}), our predictive model recommends a split allocation. Invest 60% of capital into high-momentum Tier 1 zones (e.g. DHA, Top City) for safe capital preservation, and allocate 40% into emerging peri-urban zones showing &gt;15% price efficiency discounts for aggressive appreciation.
              </p>

              <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Top Recommended Assets for this Portfolio</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                {topOpportunities.map((prop, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                    <div>
                      <strong style={{ display: 'block' }}>{prop.location} ({prop.city})</strong>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Score: {prop.investmentScore}/10 • {prop.discountVsLoc}% vs Local Avg</span>
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: 'bold' }}>
                      {formatPKR(prop.price)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="no-print" style={{ textAlign: 'center', marginTop: '3rem' }}>
                <button className="btn btn-primary" onClick={() => window.print()} style={{ padding: '0.75rem 2rem', fontWeight: 'bold' }}>
                  Download PDF
                </button>
              </div>
              
              <style>{`
                @media print {
                  body * { visibility: hidden; }
                  .no-print { display: none !important; }
                  .print-header, .print-header * { visibility: visible; }
                  div[style*="maxHeight: '90vh'"], div[style*="maxHeight: '90vh'"] * {
                    visibility: visible;
                    max-height: none !important;
                    box-shadow: none !important;
                  }
                  div[style*="maxHeight: '90vh'"] {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                  }
                }
              `}</style>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default InvestorHub;
