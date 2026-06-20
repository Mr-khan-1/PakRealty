import React, { useState } from 'react';
import { Building, PlusCircle, MessageSquare, UserCircle, CheckCircle } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const AddProperty = () => {
  const navigate = useNavigate();
  const [title,          setTitle]          = useState('');
  const [description,    setDescription]    = useState('');
  const [price,          setPrice]          = useState('');
  const [type,           setType]           = useState('House');
  const [purpose,        setPurpose]        = useState('sale');
  const [bedrooms,       setBedrooms]       = useState('0');
  const [bathrooms,      setBathrooms]      = useState('0');
  const [areaSize,       setAreaSize]       = useState('');
  const [areaUnit,       setAreaUnit]       = useState('sqft');
  const [city,           setCity]           = useState('Islamabad');
  const [area,           setArea]           = useState('');
  const [address,        setAddress]        = useState('');
  const [imageFiles,     setImageFiles]     = useState([]);
  const [imageUrlsText,  setImageUrlsText]  = useState('');
  const [loading,        setLoading]        = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim())         { toast.error('Title is required'); return; }
    if (description.length < 20) { toast.error('Description must be at least 20 characters long.'); return; }
    if (!price || isNaN(Number(price))) { toast.error('Valid price is required'); return; }
    if (!city.trim())          { toast.error('City is required'); return; }
    if (!area.trim())          { toast.error('Area / Sector is required'); return; }
    if (!address.trim())       { toast.error('Street / Block address is required'); return; }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title',       title);
      formData.append('description', description);
      formData.append('price',       price);
      formData.append('type',        type);
      formData.append('purpose',     purpose);
      formData.append('bedrooms',    bedrooms);
      formData.append('bathrooms',   bathrooms);
      formData.append('city',        city);
      formData.append('area',        area);
      formData.append('address',     address);

      if (areaSize && !isNaN(Number(areaSize))) {
        formData.append('areaValue', areaSize);
        formData.append('areaUnit',  areaUnit);
      }

      // Uploaded image files
      imageFiles.forEach(file => formData.append('uploadedImages', file));

      // Pasted image URLs
      if (imageUrlsText.trim()) {
        const urlArray = imageUrlsText
          .split(/[\n,]+/)
          .map(u => u.trim())
          .filter(u => u.startsWith('http'));
        if (urlArray.length > 0) {
          formData.append('imageUrls', JSON.stringify(urlArray));
        }
      }

      const res = await api.post('/properties', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data) {
        toast.success('Property listing created successfully!');
        navigate('/agent/properties');
      }
    } catch (err) {
      console.error('Error adding property:', err);
      const msg =
        err.response?.data?.errors?.map(e => e.msg).join(', ') ||
        err.response?.data?.error ||
        err.message ||
        'Failed to add property listing';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle   = { width: '100%', padding: '0.65rem 0.9rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.9rem', boxSizing: 'border-box' };
  const labelStyle   = { display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-secondary)' };
  const groupStyle   = { marginBottom: '1.25rem' };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <ul className="sidebar-menu">
          <li><NavLink to="/agent/dashboard"    className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}> Summary</NavLink></li>
          <li><NavLink to="/agent/properties"   className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}><Building size={18} /> My Listings</NavLink></li>
          <li><NavLink to="/agent/add-property" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}><PlusCircle size={18} /> Add Property</NavLink></li>
          <li><NavLink to="/agent/inquiries"    className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}><MessageSquare size={18} /> Inquiries</NavLink></li>
          <li><NavLink to="/agent/profile"      className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}><UserCircle size={18} /> My Profile</NavLink></li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content">
        <h2>Add New Property Listing</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Create a detailed listing for potential buyers/renters.
        </p>

        <form onSubmit={handleSubmit}>
          {/* ── Basic Info ──────────────────────────────────────────────────── */}
          <div style={groupStyle}>
            <label style={labelStyle}>Property Title *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. 5 Marla Luxury House in Bahria Town"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div style={groupStyle}>
            <label style={labelStyle}>Detailed Description (Min 20 characters) *</label>
            <textarea
              className="form-control"
              rows="5"
              placeholder="Provide a complete description of the property, its amenities, utilities..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
            <small style={{ color: description.length >= 20 ? '#10b981' : 'var(--text-secondary)', fontSize: '0.78rem' }}>
              {description.length} characters {description.length >= 20 ? '✓' : `(need ${20 - description.length} more)`}
            </small>
          </div>

          {/* ── Price + Purpose ─────────────────────────────────────────────── */}
          <div className="grid-responsive-2">
            <div style={groupStyle}>
              <label style={labelStyle}>Price (PKR) *</label>
              <input
                type="number"
                className="form-control"
                placeholder="e.g. 15000000"
                value={price}
                onChange={e => setPrice(e.target.value)}
                min="0"
                required
              />
            </div>

            <div style={groupStyle}>
              <label style={labelStyle}>Purpose *</label>
              <select className="form-control" value={purpose} onChange={e => setPurpose(e.target.value)}>
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
            </div>
          </div>

          {/* ── Type + Beds + Baths ─────────────────────────────────────────── */}
          <div className="grid-responsive-3">
            <div style={groupStyle}>
              <label style={labelStyle}>Property Type *</label>
              <select className="form-control" value={type} onChange={e => setType(e.target.value)}>
                <option value="House">House</option>
                <option value="Apartment">Apartment</option>
                <option value="Plot">Plot</option>
                <option value="Commercial">Commercial</option>
                <option value="Shop">Shop</option>
                <option value="Office">Office</option>
                <option value="Farm">Farmhouse</option>
                <option value="Industrial">Industrial</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div style={groupStyle}>
              <label style={labelStyle}>Bedrooms</label>
              <input
                type="number"
                className="form-control"
                value={bedrooms}
                onChange={e => setBedrooms(e.target.value)}
                min="0"
              />
            </div>

            <div style={groupStyle}>
              <label style={labelStyle}>Bathrooms</label>
              <input
                type="number"
                className="form-control"
                value={bathrooms}
                onChange={e => setBathrooms(e.target.value)}
                min="0"
              />
            </div>
          </div>

          {/* ── Area Size ───────────────────────────────────────────────────── */}
          <div className="grid-responsive-2">
            <div style={groupStyle}>
              <label style={labelStyle}>Area Size</label>
              <input
                type="number"
                className="form-control"
                placeholder="e.g. 5"
                value={areaSize}
                onChange={e => setAreaSize(e.target.value)}
                min="0"
              />
            </div>
            <div style={groupStyle}>
              <label style={labelStyle}>Area Unit</label>
              <select className="form-control" value={areaUnit} onChange={e => setAreaUnit(e.target.value)}>
                <option value="sqft">Square Feet</option>
                <option value="marla">Marla</option>
                <option value="kanal">Kanal</option>
              </select>
            </div>
          </div>

          {/* ── Location ────────────────────────────────────────────────────── */}
          <h3 style={{ margin: '0.5rem 0 1rem' }}>Location Information</h3>

          <div className="grid-responsive-2">
            <div style={groupStyle}>
              <label style={labelStyle}>City *</label>
              <select className="form-control" value={city} onChange={e => setCity(e.target.value)}>
                <option value="Islamabad">Islamabad</option>
                <option value="Lahore">Lahore</option>
                <option value="Karachi">Karachi</option>
                <option value="Rawalpindi">Rawalpindi</option>
                <option value="Peshawar">Peshawar</option>
                <option value="Multan">Multan</option>
                <option value="Faisalabad">Faisalabad</option>
                <option value="Quetta">Quetta</option>
                <option value="Sialkot">Sialkot</option>
                <option value="Gujranwala">Gujranwala</option>
              </select>
            </div>

            <div style={groupStyle}>
              <label style={labelStyle}>Area / Sector *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. DHA Phase 5"
                value={area}
                onChange={e => setArea(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={groupStyle}>
            <label style={labelStyle}>Street / Block Address *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. House 12, Street 4, Block B"
              value={address}
              onChange={e => setAddress(e.target.value)}
              required
            />
          </div>

          {/* ── Images ──────────────────────────────────────────────────────── */}
          <h3 style={{ margin: '0.5rem 0 1rem' }}>Property Images</h3>

          <div style={groupStyle}>
            <label style={labelStyle}>Upload Images (Max 5)</label>
            <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', textAlign: 'center', background: 'var(--surface-hover)' }}>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={e => setImageFiles(Array.from(e.target.files).slice(0, 5))}
                style={{ display: 'block', width: '100%', cursor: 'pointer' }}
              />
              {imageFiles.length > 0 && (
                <p style={{ marginTop: '0.75rem', color: '#10b981', fontSize: '0.85rem', fontWeight: '600' }}>
                  ✓ {imageFiles.length} file{imageFiles.length > 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          </div>

          <div style={groupStyle}>
            <label style={labelStyle}>Or Paste Image URLs (one per line)</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
              value={imageUrlsText}
              onChange={e => setImageUrlsText(e.target.value)}
            />
          </div>

          {/* ── Submit ──────────────────────────────────────────────────────── */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem', padding: '0.9rem', fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Creating Listing…' : <><CheckCircle size={18} /> Create Property Listing</>}
          </button>
        </form>
      </main>
    </div>
  );
};

export default AddProperty;
