import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Scale, CheckCircle, MapPin, Bed, Bath, Square, Activity, DollarSign, Trash2, Building } from 'lucide-react';

const allEqual = (arr) => arr.every((v) => v === arr[0]);

const Comparison = () => {
  const [list, setList] = useState([]);
  const [sortKey, setSortKey] = useState('');
  const [showDiffOnly, setShowDiffOnly] = useState(false);

  useEffect(() => {
    const compareList = JSON.parse(localStorage.getItem('compareList') || '[]');
    setList(compareList);
  }, []);

  const handleRemove = (id) => {
    const updated = list.filter((p) => p._id !== id);
    setList(updated);
    localStorage.setItem('compareList', JSON.stringify(updated));
    toast.success('Removed from comparison list');
  };

  const sortedList = useMemo(() => {
    if (!sortKey) return list;
    const copy = [...list];
    if (sortKey === 'price') {
      copy.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortKey === 'area') {
      copy.sort((a, b) => (a.area?.value || 0) - (b.area?.value || 0));
    }
    return copy;
  }, [list, sortKey]);

  const rows = [
    { label: 'Purpose', icon: <Activity size={16} />, accessor: (p) => p.purpose ? p.purpose.charAt(0).toUpperCase() + p.purpose.slice(1) : '—' },
    { label: 'Type', icon: <Building size={16} />, accessor: (p) => p.type ?? '—' },
    { label: 'Bedrooms', icon: <Bed size={16} />, accessor: (p) => p.bedrooms ?? '—' },
    { label: 'Bathrooms', icon: <Bath size={16} />, accessor: (p) => p.bathrooms ?? '—' },
    { label: 'Kitchens', icon: <CheckCircle size={16} />, accessor: (p) => p.kitchens ?? '—' },
    { label: 'Parking', icon: <CheckCircle size={16} />, accessor: (p) => p.parking ? `${p.parking} Spaces` : '—' },
    { label: 'Location', icon: <MapPin size={16} />, accessor: (p) => p.location ? `${p.location.area}, ${p.location.city}` : '—' },
  ];

  // Always display all rows, the highlighting logic is handled in the render loop
  const displayedRows = rows;

  const formatPrice = (price) => {
    if (!price) return 'Price on Request';
    if (price >= 10000000) return `${(price / 10000000).toFixed(2)} Crore`;
    if (price >= 100000) return `${(price / 100000).toFixed(2)} Lakh`;
    return `PKR ${price.toLocaleString()}`;
  };

  const maxPrice = Math.max(...list.map(p => p.price || 0), 1);
  const maxArea = Math.max(...list.map(p => p.area?.value || 0), 1);

  return (
    <div className="comparison-page" style={{ maxWidth: '1280px', margin: '2rem auto', padding: '0 1rem' }}>
      
      <div className="flex-responsive" style={{ marginBottom: '2rem' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '2rem', margin: 0 }}>
            <Scale size={28} color="var(--primary)" /> Property Comparison
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0' }}>Compare multiple properties side-by-side to make the best decision.</p>
        </div>
        
        {list.length > 0 && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'var(--card-bg)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Sort by</label>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                style={{ padding: '0.4rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg)', outline: 'none' }}
              >
                <option value="">Default Order</option>
                <option value="price">Lowest Price</option>
                <option value="area">Smallest Area</option>
              </select>
            </div>
            
            <div style={{ width: '1px', height: '30px', background: 'var(--border)', margin: '0 0.5rem' }}></div>
            
            <label 
              onClick={() => setShowDiffOnly(!showDiffOnly)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none', fontSize: '0.9rem', fontWeight: 500 }}
            >
              <div style={{ position: 'relative', width: '36px', height: '20px', background: showDiffOnly ? 'var(--primary)' : 'var(--border)', borderRadius: '20px', transition: 'background 0.3s' }}>
                <div style={{ position: 'absolute', top: '2px', left: showDiffOnly ? '18px' : '2px', width: '16px', height: '16px', background: 'white', borderRadius: '50%', transition: 'left 0.3s' }}></div>
              </div>
              Highlight Differences
            </label>
          </div>
        )}
      </div>

      {sortedList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '6rem 2rem', background: 'var(--card-bg)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border)' }}>
          <div style={{ width: '64px', height: '64px', background: 'var(--bg-muted)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Scale size={32} color="var(--text-secondary)" />
          </div>
          <h3 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem' }}>No Properties Selected</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem' }}>You haven't added any properties to compare yet. Browse our listings and select properties to compare them side-by-side.</p>
          <Link to="/properties" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}>Browse Properties</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${sortedList.length}, minmax(320px, 1fr))`, gap: '1.5rem', overflowX: 'auto', paddingBottom: '1rem' }}>
          {sortedList.map(prop => {
            const pricePercent = ((prop.price || 0) / maxPrice) * 100;
            const areaPercent = ((prop.area?.value || 0) / maxArea) * 100;
            
            return (
              <div key={prop._id} style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-sm)' }}>
                {/* Header / Image */}
                <div style={{ position: 'relative', height: '220px' }}>
                  <img
                    src={prop.thumbnail || prop.images?.[0]?.url || 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600'}
                    alt={prop.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600'; }}
                  />
                  <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--bg)', padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                    {prop.purpose === 'sale' ? 'For Sale' : 'For Rent'}
                  </div>
                </div>
                
                {/* Title & Core Details */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '1.15rem', margin: '0 0 0.5rem', lineHeight: '1.4', height: '3.2em', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    <Link to={`/property/${prop._id}`} style={{ color: 'var(--text)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text)'}>
                      {prop.title}
                    </Link>
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    <MapPin size={16} style={{ flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prop.location?.area}, {prop.location?.city}</span>
                  </div>

                  {/* Visual Charts */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Price Bar */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}><DollarSign size={14}/> Price</span>
                        <span style={{ color: 'var(--primary)' }}>{formatPrice(prop.price)}</span>
                      </div>
                      <div style={{ height: '8px', background: 'var(--bg-muted)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${pricePercent}%`, height: '100%', background: 'var(--primary)', borderRadius: '4px', transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                      </div>
                    </div>
                    
                    {/* Area Bar */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}><Square size={14}/> Area</span>
                        <span style={{ color: '#10b981' }}>{prop.area?.value} {prop.area?.unit}</span>
                      </div>
                      <div style={{ height: '8px', background: 'var(--bg-muted)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${areaPercent}%`, height: '100%', background: '#10b981', borderRadius: '4px', transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attribute List */}
                <div style={{ background: 'var(--bg-muted)', padding: '1.5rem', flex: 1 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {displayedRows.map(row => {
                      const isHighlighted = showDiffOnly && !allEqual(sortedList.map(row.accessor));
                      return (
                        <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: isHighlighted ? 'rgba(245,158,11,0.1)' : 'var(--card-bg)', borderRadius: 'var(--radius)', border: isHighlighted ? '1px solid rgba(245,158,11,0.3)' : '1px solid transparent', transition: 'all 0.2s' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            {row.icon} {row.label}
                          </span>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: isHighlighted ? '#d97706' : 'var(--text)' }}>
                            {row.accessor(prop)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Actions Footer */}
                <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', gap: '0.75rem' }}>
                  <Link to={`/property/${prop._id}`} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                    View Details
                  </Link>
                  <button 
                    className="btn btn-danger" 
                    onClick={() => handleRemove(prop._id)}
                    style={{ padding: '0.6rem 0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Remove"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Comparison;
