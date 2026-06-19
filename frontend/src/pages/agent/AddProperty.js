import React, { useState } from 'react';
import { Building, PlusCircle, MessageSquare, UserCircle } from 'lucide-react';


import { NavLink, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const AddProperty = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState('House');
  const [purpose, setPurpose] = useState('sale');
  const [bedrooms, setBedrooms] = useState('0');
  const [areaSize, setAreaSize] = useState(''); // numeric area size (sqft)
  const [bathrooms, setBathrooms] = useState('0');
  const [city, setCity] = useState('Islamabad');
  const [area, setArea] = useState('');
  const [address, setAddress] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [loading, setLoading] = useState(false);
const [imageUrlsText, setImageUrlsText] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (description.length < 20) { toast.error('Description must be at least 20 characters long.'); return; }
    if (!price || isNaN(Number(price))) { toast.error('Valid price is required'); return; }
    if (!city.trim()) { toast.error('City is required'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('type', type);
      formData.append('purpose', purpose);
      formData.append('bedrooms', bedrooms);
      formData.append('bathrooms', bathrooms);
      formData.append('city', city);
      formData.append('area', area || '');
      formData.append('address', address || '');
      if (areaSize && !isNaN(Number(areaSize))) {
        formData.append('areaValue', areaSize);
        formData.append('areaUnit', 'sqft');
      }
      
      imageFiles.forEach(file => {
          formData.append('uploadedImages', file);
        });
        // Process pasted image URLs
        if (imageUrlsText.trim()) {
          const urlArray = imageUrlsText
            .split(/[\n,]+/)
            .map(u => u.trim())
            .filter(u => u);
          if (urlArray.length > 0) {
            formData.append('imageUrls', JSON.stringify(urlArray));
          }
        }

      const res = await api.post('/properties', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data) {
        toast.success('Property listing created successfully!');
        navigate('/agent/properties');
      }
    } catch (err) {
      console.error('Error adding property:', err);
      toast.error(
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.error ||
        err.message ||
        'Failed to add property listing'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <ul className="sidebar-menu">
          <li><NavLink to="/agent/dashboard" className="sidebar-link"> Summary</NavLink></li>
          <li><NavLink to="/agent/properties" className="sidebar-link"><Building size={18} /> My Listings</NavLink></li>
          <li><NavLink to="/agent/add-property" className="sidebar-link active"><PlusCircle size={18} /> Add Property</NavLink></li>
          <li><NavLink to="/agent/inquiries" className="sidebar-link"><MessageSquare size={18} /> Inquiries</NavLink></li>
          <li><NavLink to="/agent/profile" className="sidebar-link"><UserCircle size={18} /> My Profile</NavLink></li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content">
        <h2>Add New Property Listing</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Create a detailed listing for potential buyers/renters.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Property Title</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. 5 Marla Luxury House in Bahria Town"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Detailed Description (Min 20 characters)</label>
            <textarea
              className="form-control"
              rows="5"
              placeholder="Provide a complete description of the property, its amenities, utilities..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            ></textarea>
          </div>

          <div className="grid-responsive-2">
            <div className="form-group">
              <label>Price (PKR)</label>
              <input
                type="number"
                className="form-control"
                placeholder="e.g. 15000000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
               <label>Purpose</label>
               <select className="form-control" value={purpose} onChange={(e) => setPurpose(e.target.value)}>
                 <option value="sale">For Sale</option>
                 <option value="rent">For Rent</option>
               </select>
               <div className="form-group">
                 <label>Area Size (sqft)</label>
                 <input
                   type="number"
                   className="form-control"
                   placeholder="e.g. 2500"
                   value={areaSize}
                   onChange={(e) => setAreaSize(e.target.value)}
                   min="0"
                   required
                 />
               </div>
            </div>
          </div>

          <div className="grid-responsive-3">
            <div className="form-group">
              <label>Property Type</label>
              <select className="form-control" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="House">House</option>
                <option value="Apartment">Apartment</option>
                <option value="Plot">Plot</option>
                <option value="Shop">Shop</option>
                <option value="Office">Office</option>
              </select>
            </div>

            <div className="form-group">
              <label>Bedrooms</label>
              <input
                type="number"
                className="form-control"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label>Bathrooms</label>
              <input
                type="number"
                className="form-control"
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                min="0"
                required
              />
            </div>
          </div>

          <h3 style={{ margin: '1.5rem 0 1rem' }}>Location Information</h3>

          <div className="grid-responsive-2">
            <div className="form-group">
              <label>City</label>
              <select className="form-control" value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="Islamabad">Islamabad</option>
                <option value="Lahore">Lahore</option>
                <option value="Karachi">Karachi</option>
                <option value="Rawalpindi">Rawalpindi</option>
                <option value="Peshawar">Peshawar</option>
                <option value="Multan">Multan</option>
              </select>
            </div>

            <div className="form-group">
              <label>Area / Sector</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. DHA Phase 5"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Street / Block Address</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. House 12, Street 4, Block B"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Upload Property Images (Max 5)</label>
            <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius)', padding: '2rem', textAlign: 'center', background: 'var(--surface-hover)' }}>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setImageFiles(Array.from(e.target.files))}
                style={{ display: 'block', width: '100%', cursor: 'pointer' }}
              />
              <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                {imageFiles.length > 0 ? `${imageFiles.length} files selected` : 'Drag and drop or click to select images'}
              </p>
            </div>
            <div className="form-group">
              <label>Paste Image URLs (one per line)</label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Enter image URLs, one per line"
                value={imageUrlsText}
                onChange={(e) => setImageUrlsText(e.target.value)}
              ></textarea>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '2rem' }}
            disabled={loading}
          >
            {loading ? 'Creating Listing...' : 'Create Property Listing'}
          </button>
        </form>
      </main>
    </div>
  );
};

export default AddProperty;
