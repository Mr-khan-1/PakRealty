import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


import {
  ShieldCheck, BarChart3, Users, Smartphone,
  MapPin, Bed, Bath, Square, Award, Search, ArrowRight
} from 'lucide-react';

const STATS = [
  { value: '12,000+', label: 'Properties Listed' },
  { value: '8,500+', label: 'Happy Clients' },
  { value: '350+', label: 'Verified Agents' },
  { value: '6', label: 'Major Cities' },
];



const formatPrice = (p) => {
  if (!p) return '';
  if (p >= 10_000_000) return `${(p / 10_000_000).toFixed(1)} Cr`;
  if (p >= 100_000) return `${(p / 100_000).toFixed(0)} Lac`;
  return p.toLocaleString();
};

// Helper to convert square feet to Marla and Kanal
const sqftToMarla = (sqft) => (sqft / 272.25).toFixed(2);
const sqftToKanal = (sqft) => (sqft / (272.25 * 20)).toFixed(2);

const formatArea = (area) => {
  if (!area) return '';
  const { value, unit } = area;
  if (unit === 'sqft') {
    const marla = sqftToMarla(value);
    const kanal = sqftToKanal(value);
    return `${value} ${unit} (${marla} Marla, ${kanal} Kanal)`;
  }
  return `${value} ${unit}`;
};

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [featured, setFeatured] = useState([]);
  const [loadProps, setLoadProps] = useState(true);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [purpose, setPurpose] = useState('');

  useEffect(() => {
    // Dummy featured properties using local images
    const dummy = [
      {
        _id: '1',
        title: 'Elegant Villa',
        purpose: 'sale',
        price: 25000000,
        thumbnail: '/images/properties/prop-1.jpg',
        location: { area: 'Gulberg', city: 'Lahore' },
        bedrooms: 4,
        bathrooms: 3,
        area: { value: 2500, unit: 'sqft' }
      },
      {
        _id: '2',
        title: 'Modern Apartment',
        purpose: 'rent',
        price: 85000,
        thumbnail: '/images/properties/prop-2.jpg',
        location: { area: 'DHA', city: 'Islamabad' },
        bedrooms: 3,
        bathrooms: 2,
        area: { value: 1500, unit: 'sqft' }
      },
      {
        _id: '3',
        title: 'Cozy Cottage',
        purpose: 'sale',
        price: 12000000,
        thumbnail: '/images/properties/prop-3.jpg',
        location: { area: 'F-6', city: 'Islamabad' },
        bedrooms: 2,
        bathrooms: 2,
        area: { value: 1200, unit: 'sqft' }
      },
      {
        _id: '4',
        title: 'Spacious Bungalow',
        purpose: 'sale',
        price: 45000000,
        thumbnail: '/images/properties/prop-4.jpg',
        location: { area: 'Clifton', city: 'Karachi' },
        bedrooms: 5,
        bathrooms: 4,
        area: { value: 3000, unit: 'sqft' }
      },
      {
        _id: '5',
        title: 'Luxury Penthouse',
        purpose: 'rent',
        price: 200000,
        thumbnail: '/images/properties/prop-5.jpg',
        location: { area: 'Bahria Town', city: 'Lahore' },
        bedrooms: 3,
        bathrooms: 3,
        area: { value: 1800, unit: 'sqft' }
      },
      {
        _id: '6',
        title: 'Charming Farmhouse',
        purpose: 'sale',
        price: 85000000,
        thumbnail: '/images/properties/prop-6.jpg',
        location: { area: 'Gulshan-e-Iqbal', city: 'Karachi' },
        bedrooms: 4,
        bathrooms: 3,
        area: { value: 3500, unit: 'sqft' }
      }
    ];
    setFeatured(dummy);
    setLoadProps(false);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (city) params.set('city', city);
    if (purpose) params.set('purpose', purpose);
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <div className="home">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg-image" />
        <div className="hero-content">
          <div className="hero-badge"><Award size={16} color="var(--primary)" /> Pakistan's #1 Real Estate Platform</div>
          <h1 className="hero-title">
            Find Your Perfect<br />
            <span className="hero-title-accent">Property in Pakistan</span>
          </h1>
          <p className="hero-subtitle">
            Browse thousands of verified homes, apartments, plots and commercial spaces across Pakistan's top cities.
          </p>

          {/* Search bar */}
          <form className="hero-search" onSubmit={handleSearch}>
            <div className="hero-search-field">
              <select value={city} onChange={e => setCity(e.target.value)}>
                <option value="">All Cities</option>
                <option>Islamabad</option>
                <option>Lahore</option>
                <option>Karachi</option>
                <option>Rawalpindi</option>
                <option>Peshawar</option>
                <option>Multan</option>
              </select>
            </div>
            <div className="hero-search-field">
              <select value={purpose} onChange={e => setPurpose(e.target.value)}>
                <option value="">Buy or Rent</option>
                <option value="sale">Buy</option>
                <option value="rent">Rent</option>
              </select>
            </div>
            <div className="hero-search-field hero-search-field--grow">
              <input
                type="text"
                placeholder="DHA, Bahria Town, F-10..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary hero-search-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
              <Search size={18} /> Search
            </button>
          </form>

          {/* Quick links */}
          <div className="hero-quick-links">
            <span className="hero-quick-label">Popular:</span>
            {['DHA Islamabad', 'Bahria Town', 'Gulberg Lahore', 'Clifton Karachi'].map(q => (
              <button key={q} className="quick-tag" onClick={() => {
                setSearch(q); navigate(`/properties?search=${encodeURIComponent(q)}`);
              }}>{q}</button>
            ))}
          </div>
        </div>

        {/* Floating stat cards */}
        <div className="hero-stats">
          {STATS.map(s => (
            <div key={s.label} className="hero-stat">
              <div className="hero-stat-value">{s.value}</div>
              <div className="hero-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Properties ───────────────────────────────────────────── */}
      <section className="properties-section">
        <div className="section-header">
          <div>
            <h2>Featured Properties</h2>
            <p className="section-subtitle">Hand-picked listings from verified agents</p>
          </div>
          <Link to="/properties" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            View All <ArrowRight size={16} />
          </Link>
        </div>

        {loadProps ? (
          <div className="properties-grid">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="property-card">
                <div className="skeleton" style={{ height: 220 }} />
                <div className="property-card-content">
                  <div className="skeleton skeleton-line" style={{ width: '70%' }} />
                  <div className="skeleton skeleton-line" style={{ width: '90%', marginTop: 8 }} />
                  <div className="skeleton skeleton-line" style={{ width: '40%', marginTop: 16 }} />
                </div>
              </div>
            ))}
          </div>
        ) : featured.length > 0 ? (
          <div className="properties-grid">
            {featured.slice(0, 6).map(p => (
              <div className="property-card" key={p._id}>
                <div className="property-card-img-wrapper" style={{ height: '260px' }}>
                    <img
                      src={p.thumbnail || p.images?.[0]?.url || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600'}
                      alt={p.title}
                      className="property-card-img"
                      loading="lazy"
                      onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600'; }}
                    />
                    {/* Price */}
                    {p.price && (
                      <div className="property-card-price">
                        PKR {formatPrice(p.price)}
                      </div>
                    )}
                    {/* Area with Marla/Kanal conversion */}
                    {p.area && (
                      <div className="property-card-area">
                        {formatArea(p.area)}
                      </div>
                    )}
                  <div className={`property-card-tag tag--${p.purpose}`}>
                    For {p.purpose === 'sale' ? 'Sale' : 'Rent'}
                  </div>
                </div>
                <div className="property-card-content">
                  <div className="property-card-location" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={14} color="var(--primary)" /> {p.location?.area}, {p.location?.city}
                  </div>
                  <h3 className="property-card-title">{p.title}</h3>
                  <div className="property-card-specs">
                    {p.bedrooms != null && <span className="spec-item"><Bed size={16} /> {p.bedrooms}</span>}
                    {p.bathrooms != null && <span className="spec-item"><Bath size={16} /> {p.bathrooms}</span>}
                    {p.area?.value && <span className="spec-item"><Square size={16} /> {p.area.value} {p.area.unit}</span>}
                  </div>
                  <div className="property-card-footer">
                    <div className="property-card-price">PKR {formatPrice(p.price)}</div>
                    <Link to={`/property/${p._id}`} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      Details <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No featured properties yet. <Link to="/properties">Browse all properties →</Link></p>
          </div>
        )}
      </section>



      {/* ── Why PakRealty ─────────────────────────────────────────────────── */}
      <section className="features-section">
        <div className="section-header" style={{ justifyContent: 'center', textAlign: 'center' }}>
          <div>
            <h2>Why Choose PakRealty?</h2>
            <p className="section-subtitle">Trusted by thousands of buyers, renters and investors</p>
          </div>
        </div>
        <div className="features-grid">
          {[
            { icon: <ShieldCheck size={32} color="var(--primary)" />, title: 'Verified Listings', desc: 'Every property is reviewed and verified by our team for accuracy.' },
            { icon: <BarChart3 size={32} color="var(--primary)" />, title: 'Investment Analytics', desc: 'Smart ROI calculators and market trend data for investors.' },
            { icon: <Users size={32} color="var(--primary)" />, title: 'Expert Agents', desc: 'Connect directly with professional, licensed real estate agents.' },
            { icon: <Smartphone size={32} color="var(--primary)" />, title: 'Works Everywhere', desc: 'Fully responsive platform that works on any device, anytime.' },
          ].map(f => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>{f.icon}</div>
              <h4 className="feature-title">{f.title}</h4>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      {!isAuthenticated && (
        <section className="cta-section">
          <div className="cta-content">
            <h2>Ready to Find Your Dream Property?</h2>
            <p>Join over 8,500 happy clients who found their perfect home on PakRealty.</p>
            <div className="cta-actions">
              <Link to="/register" className="btn btn-primary btn-lg">Get Started Free</Link>
              <Link to="/properties" className="btn btn-secondary btn-lg">Browse Listings</Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
