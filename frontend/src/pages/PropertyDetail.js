import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { MapPin, Bed, Bath, Square, Heart, Phone, Mail, Key, ArrowLeft, Car, ChefHat, CheckCircle, Eye, Navigation } from 'lucide-react';

const formatPrice = (price) => {
  if (!price && price !== 0) return 'Price on Request';
  if (price >= 10_000_000) return `PKR ${(price / 10_000_000).toFixed(2)} Crore`;
  if (price >= 100_000)    return `PKR ${(price / 100_000).toFixed(2)} Lakh`;
  return `PKR ${price.toLocaleString()}`;
};

const PropertyDetail = () => {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { isAuthenticated } = useAuth();

  const [property,       setProperty]       = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [activeImg,      setActiveImg]      = useState(0);
  const [message,        setMessage]        = useState('I am interested in this property. Please contact me.');
  const [inquiryType,    setInquiryType]    = useState('general');
  const [preferredContact, setPreferredContact] = useState('email');
  const [sending,        setSending]        = useState(false);
  const [saved,          setSaved]          = useState(false);

  useEffect(() => {
    let active = true;
    const fetch = async () => {
      try {
        const res = await api.get(`/properties/${id}`);
        if (active) setProperty(res.data);
      } catch {
        toast.error('Property not found');
        navigate('/properties');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetch();
    return () => { active = false; };
  }, [id, navigate]);

  const handleSave = async () => {
    if (!isAuthenticated) { navigate('/login', { state: { from: { pathname: `/property/${id}` } } }); return; }
    try {
      await api.post(`/users/favorites/${id}`);
      setSaved(true);
      toast.success('Saved to favorites!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save property');
    }
  };

  const handleInquiry = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/login', { state: { from: { pathname: `/property/${id}` } } }); return; }
    if (!message.trim()) { toast.error('Please enter a message'); return; }
    setSending(true);
    try {
      await api.post('/inquiries', {
        propertyId: id,
        message,
        inquiryType,
        preferredContact,
      });
      toast.success('Inquiry sent! The agent will contact you shortly.');
      setMessage('');
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Failed to send inquiry');
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className="flex-center" style={{ minHeight: '60vh' }}>
      <div className="spinner" />
    </div>
  );

  if (!property) return null;

  const images = property.images?.length > 0
    ? property.images.map(img => ({ ...img, url: getImageUrl(img.url) }))
    : [{ url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800', alt: property.title }];

  const agentName = property.agentId?.name || property.contactInfo?.name || 'PakRealty Agent';
  const agentPhone = property.agentId?.phone || property.contactInfo?.phone || '';
  const agentEmail = property.agentId?.email || property.contactInfo?.email || '';

  return (
    <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', padding: '2rem var(--pad)', paddingBottom: '100px' }}>

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="btn btn-secondary btn-sm"
        style={{ marginBottom: '1.5rem' }}
      >
        <ArrowLeft size={16} /> Back to Listings
      </button>

      <div className="property-detail-layout">

        {/* ── Left: Images + Details ───────────────────────────────────── */}
        <div>
          {/* Main image */}
          <div style={{ position: 'relative', height: '460px', borderRadius: 'var(--r-lg)', overflow: 'hidden', marginBottom: '1rem', background: 'var(--surface-2)' }}>
            <img
              src={images[activeImg]?.url}
              alt={property.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.target.src = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800'; }}
            />
            <div style={{ position: 'absolute', top: '1rem', left: '1rem', display: 'flex', gap: '0.5rem' }}>
              <span className={`property-card-tag tag--${property.purpose}`}>
                For {property.purpose === 'sale' ? 'Sale' : 'Rent'}
              </span>
              <span className="property-card-tag" style={{ background: 'rgba(15,23,42,0.75)' }}>
                {property.type}
              </span>
            </div>
            <button
              onClick={handleSave}
              style={{
                position: 'absolute', top: '1rem', right: '1rem',
                background: saved ? '#ef4444' : 'rgba(255,255,255,0.9)',
                border: 'none', borderRadius: '50%', width: '44px', height: '44px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                transition: 'all 0.2s',
              }}
              title={saved ? 'Saved!' : 'Save to favorites'}
            >
              <Heart size={20} color={saved ? '#fff' : '#ef4444'} fill={saved ? '#fff' : 'none'} />
            </button>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
              {images.map((img, i) => (
                <img
                  key={i}
                  src={img.url}
                  alt={img.alt || `Photo ${i+1}`}
                  onClick={() => setActiveImg(i)}
                  style={{
                    width: '90px', height: '65px', objectFit: 'cover', borderRadius: 'var(--r)',
                    cursor: 'pointer', flexShrink: 0,
                    border: i === activeImg ? '2.5px solid var(--primary)' : '2px solid var(--border)',
                    opacity: i === activeImg ? 1 : 0.7, transition: 'all 0.2s',
                  }}
                />
              ))}
            </div>
          )}

          {/* Title & Location */}
          <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', marginBottom: '0.5rem' }}>{property.title}</h1>
          <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-2)', marginBottom: '1.5rem' }}>
            <MapPin size={18} color="var(--primary)" />
            {[property.location?.address, property.location?.area, property.location?.city].filter(Boolean).join(', ')}
          </p>

          {/* Stats bar */}
          <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            {[
              { icon: <Bed size={16} />,    label: 'Bedrooms',  value: property.bedrooms  ?? '—' },
              { icon: <Bath size={16} />,   label: 'Bathrooms', value: property.bathrooms ?? '—' },
              { icon: <Square size={16} />, label: 'Area',      value: property.area?.value ? `${property.area.value} ${property.area.unit}` : '—' },
              { icon: <Key size={16} />,    label: 'Status',    value: property.status || 'Available' },
            ].map(s => (
              <div key={s.label}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--text-2)', marginBottom: '0.3rem' }}>
                  {s.icon} {s.label}
                </div>
                <strong style={{ fontSize: '1.1rem', color: 'var(--secondary)' }}>{s.value}</strong>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>Description</h3>
            <p style={{ color: 'var(--text-2)', lineHeight: 1.8, whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
              {property.description || 'No description provided.'}
            </p>
          </div>

          {/* Additional details */}
          {(property.parking || property.kitchens) && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Additional Details</h3>
              <div className="grid-responsive-2" style={{ gap: '0.75rem' }}>
                {property.parking  && <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Car size={16} color="var(--primary)" /> <strong>Parking:</strong> {property.parking} spaces</div>}
                {property.kitchens && <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><ChefHat size={16} color="var(--primary)" /> <strong>Kitchens:</strong> {property.kitchens}</div>}
                {property.isVerified && <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CheckCircle size={16} color="#10b981" /> <strong>Status:</strong> Verified listing</div>}
                {property.views > 0  && <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Eye size={16} color="var(--primary)" /> <strong>Views:</strong> {property.views}</div>}
              </div>
            </div>
          )}

          {/* ── Map Location ─────────────────────────────────────────────── */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Navigation size={20} color="var(--primary)" /> Location on Map
            </h3>
            <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-2)', marginBottom: '1rem', fontSize: '0.9rem' }}>
              <MapPin size={15} color="var(--primary)" />
              {[property.location?.address, property.location?.area, property.location?.city, 'Pakistan'].filter(Boolean).join(', ')}
            </p>
            <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)', height: '320px', background: 'var(--surface-2)' }}>
              <iframe
                title="Property Location"
                width="100%"
                height="100%"
                style={{ border: 0, display: 'block' }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(
                  [property.location?.area, property.location?.city, 'Pakistan'].filter(Boolean).join(', ')
                )}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                allowFullScreen
              />
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                [property.location?.area, property.location?.city, 'Pakistan'].filter(Boolean).join(', ')
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Navigation size={14} /> Open in Google Maps
            </a>
          </div>
        </div>

        {/* ── Right: Price + Inquiry ───────────────────────────────────── */}
        <div style={{ position: 'sticky', top: 'calc(var(--nav-h) + 1rem)' }}>
          <div className="card" style={{ boxShadow: 'var(--shadow-md)' }}>

            {/* Price */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                Asking Price
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>
                {formatPrice(property.price)}
              </div>
              {property.purpose === 'rent' && (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-2)' }}>per month</div>
              )}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1.25rem 0' }} />

{/* Agent info */}
<div style={{ marginBottom: '1.25rem' }}>
  <h4 style={{ marginBottom: '0.75rem' }}>Contact Agent</h4>
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
    {property.agentId?.photo ? (
      <img src={property.agentId.photo} alt={agentName} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }} />
    ) : (
      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>
        {agentName[0]?.toUpperCase()}
      </div>
    )}
    <div>
      <div style={{ fontWeight: 700 }}>{agentName}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>Verified Agent</div>
    </div>
  </div>
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
    {agentPhone && (
      <a href={`tel:${agentPhone}`} className="btn btn-primary" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
        <Phone size={16} /> Call {agentPhone}
      </a>
    )}
    {agentEmail && (
      <a href={`mailto:${agentEmail}`} className="btn btn-secondary" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
        <Mail size={16} /> Email Agent
      </a>
    )}
  </div>
</div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1.25rem 0' }} />

            {/* Inquiry form */}
            <form onSubmit={handleInquiry}>
              <h4 style={{ marginBottom: '1rem' }}>Send Inquiry</h4>

              <div className="form-group">
                <label>Inquiry Type</label>
                <select className="form-control" value={inquiryType} onChange={e => setInquiryType(e.target.value)}>
                  <option value="general">General Information</option>
                  <option value="inspection">Schedule a Visit</option>
                  <option value="offer">Make an Offer</option>
                  <option value="rental">Rental Inquiry</option>
                </select>
              </div>

              <div className="form-group">
                <label>Preferred Contact</label>
                <select className="form-control" value={preferredContact} onChange={e => setPreferredContact(e.target.value)}>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>

              <div className="form-group">
                <label>Message</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="I am interested in this property..."
                  required
                  style={{ resize: 'vertical' }}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={sending}>
                {sending ? <span className="btn-spinner" /> : null}
                {sending ? 'Sending...' : isAuthenticated ? 'Send Inquiry' : 'Login to Inquire'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── Mobile Sticky Contact ──────────────────────────────────────── */}
      <div className="mobile-sticky-contact">
        <a href={agentPhone ? `tel:${agentPhone}` : '#'} className="btn btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
          <Phone size={18} /> Call
        </a>
        <a href={agentEmail ? `mailto:${agentEmail}` : '#'} className="btn btn-secondary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
          <Mail size={18} /> Message
        </a>
      </div>
    </div>
  );
};

export default PropertyDetail;
