import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, Bed, Bath, Square, Scale } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CITIES = ['Islamabad', 'Lahore', 'Karachi', 'Rawalpindi', 'Peshawar', 'Multan', 'Quetta', 'Faisalabad'];
const TYPES  = ['House', 'Apartment', 'Plot', 'Commercial', 'Shop', 'Office', 'Farm', 'Other'];

const formatPrice = (price) => {
  if (!price && price !== 0) return 'Price on Request';
  if (price >= 10_000_000) return `PKR ${(price / 10_000_000).toFixed(2)} Cr`;
  if (price >= 100_000)    return `PKR ${(price / 100_000).toFixed(2)} Lac`;
  return `PKR ${price.toLocaleString()}`;
};

const PropertyListing = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [properties,   setProperties]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [totalPages,   setTotalPages]   = useState(1);
  const [totalCount,   setTotalCount]   = useState(0);
  const [currentPage,  setCurrentPage]  = useState(1);
  const [showFilters,  setShowFilters]  = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    search:   searchParams.get('search')   || '',
    city:     searchParams.get('city')     || '',
    type:     searchParams.get('type')     || '',
    purpose:  searchParams.get('purpose')  || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
  });

  const setFilter = (key) => (e) => setFilters(f => ({ ...f, [key]: e.target.value }));

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, limit: 9 };
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });

      const res = await api.get('/properties', { params });
      setProperties(res.data?.properties || []);
      setTotalPages(res.data?.pagination?.pages || 1);
      setTotalCount(res.data?.pagination?.total || 0);
    } catch (err) {
      toast.error('Failed to load properties. Is the backend running?');
      console.error('fetchProperties error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch when page changes or URL params change
  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    const newParams = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) newParams[k] = v; });
    setCurrentPage(1);
    setSearchParams(newParams);
  };

  const handleClearFilters = () => {
    const cleared = { search: '', city: '', type: '', purpose: '', minPrice: '', maxPrice: '' };
    setFilters(cleared);
    setCurrentPage(1);
    setSearchParams({});
  };

  const handleAddToCompare = (property) => {
    let list = [];
    try { list = JSON.parse(localStorage.getItem('compareList') || '[]'); } catch {}
    if (list.some(p => p._id === property._id)) { toast.error('Already in compare list'); return; }
    if (list.length >= 3) { toast.error('Max 3 properties to compare at a time'); return; }
    list.push(property);
    localStorage.setItem('compareList', JSON.stringify(list));
    toast.success('Added to comparison!');
  };

  const Skeleton = () => (
    <div className="property-card skeleton-card">
      <div className="skeleton skeleton-img" />
      <div className="property-card-content">
        <div className="skeleton skeleton-line" style={{ width: '60%', height: '14px' }} />
        <div className="skeleton skeleton-line" style={{ width: '90%', height: '20px', marginTop: '8px' }} />
        <div className="skeleton skeleton-line" style={{ width: '75%', height: '14px', marginTop: '8px' }} />
        <div className="skeleton skeleton-line" style={{ width: '40%', height: '24px', marginTop: '16px' }} />
      </div>
    </div>
  );

  return (
    <div className="listing-page">

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div className="listing-header">
        <div className="listing-header-inner">
          <h1>Property Listings</h1>
          <p>{totalCount > 0 ? `${totalCount} properties available` : 'Search properties across Pakistan'}</p>
        </div>
      </div>

      <div className="listing-body">

        {/* ── Filter toggle for mobile ────────────────────────────────────── */}
        <button className="filter-toggle-btn" onClick={() => setShowFilters(s => !s)}>
          🔍 {showFilters ? 'Hide' : 'Show'} Filters
        </button>

        <div className="listing-layout">

          {/* ── Filters sidebar ──────────────────────────────────────────── */}
          <aside className={`filters-sidebar${showFilters ? ' filters-sidebar--open' : ''}`}>
            <div className="filters-card">
              <h3 className="filters-title">Filter Properties</h3>
              <form onSubmit={handleFilterSubmit}>

                <div className="form-group">
                  <label>Search</label>
                  <input type="text" className="form-control" placeholder="DHA, Bahria, etc."
                    value={filters.search} onChange={setFilter('search')} />
                </div>

                <div className="form-group">
                  <label>City</label>
                  <select className="form-control" value={filters.city} onChange={setFilter('city')}>
                    <option value="">All Cities</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Type</label>
                  <select className="form-control" value={filters.type} onChange={setFilter('type')}>
                    <option value="">All Types</option>
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Purpose</label>
                  <select className="form-control" value={filters.purpose} onChange={setFilter('purpose')}>
                    <option value="">Any</option>
                    <option value="sale">Buy</option>
                    <option value="rent">Rent</option>
                  </select>
                </div>

                <div className="form-row-mini">
                  <div className="form-group">
                    <label>Min Price (PKR)</label>
                    <input type="number" className="form-control" placeholder="0"
                      value={filters.minPrice} onChange={setFilter('minPrice')} min="0" />
                  </div>
                  <div className="form-group">
                    <label>Max Price (PKR)</label>
                    <input type="number" className="form-control" placeholder="Any"
                      value={filters.maxPrice} onChange={setFilter('maxPrice')} min="0" />
                  </div>
                </div>

                <div className="filter-actions">
                  <button type="button" className="btn btn-secondary" onClick={handleClearFilters}>Clear</button>
                  <button type="submit" className="btn btn-primary">Apply Filters</button>
                </div>
              </form>
            </div>
          </aside>

          {/* ── Property grid ─────────────────────────────────────────────── */}
          <main className="listing-main">
            <div className="listing-topbar">
              <span className="listing-count">
                {loading ? 'Loading...' : `Showing ${totalCount > 0 ? ((currentPage - 1) * 9) + 1 : 0} - ${Math.min(currentPage * 9, totalCount)} of ${totalCount} results`}
              </span>
              {Object.values(filters).some(Boolean) && (
                <button className="btn btn-secondary btn-sm" onClick={handleClearFilters}>
                  ✕ Clear all filters
                </button>
              )}
            </div>

            {loading ? (
              <div className="properties-grid">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}
              </div>
            ) : properties.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🏘️</div>
                <h3>No properties found</h3>
                <p>Try adjusting your filters or clearing them to see all available properties.</p>
                <button className="btn btn-primary" onClick={handleClearFilters}>Clear Filters</button>
              </div>
            ) : (
              <>
                <div className="properties-grid">
                  {properties.map(property => (
                    <div className="property-card" key={property._id}>
                      <div className="property-card-img-wrapper">
                        <img
                          src={property.thumbnail || property.images?.[0]?.url || `https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600`}
                          alt={property.title}
                          className="property-card-img"
                          loading="lazy"
                          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600'; }}
                        />
                        <div className={`property-card-tag tag--${property.purpose}`}>
                          For {property.purpose === 'sale' ? 'Sale' : 'Rent'}
                        </div>
                        <button
                          className="compare-btn"
                          title="Add to Compare"
                          onClick={() => handleAddToCompare(property)}
                        >
                          <Scale size={16} /> Compare
                        </button>
                      </div>

                      <div className="property-card-content">
                        <div className="property-card-location">
                          <MapPin size={14} />
                          <span>{[property.location?.area, property.location?.city].filter(Boolean).join(', ') || 'Pakistan'}</span>
                        </div>

                        <h3 className="property-card-title">{property.title}</h3>

                        <div className="property-card-specs">
                          {property.bedrooms != null && (
                            <span className="spec-item"><Bed size={14} /> {property.bedrooms} Beds</span>
                          )}
                          {property.bathrooms != null && (
                            <span className="spec-item"><Bath size={14} /> {property.bathrooms} Baths</span>
                          )}
                          {property.area?.value && (
                            <span className="spec-item"><Square size={14} /> {property.area.value} {property.area.unit}</span>
                          )}
                        </div>

                        <div className="property-card-footer">
                          <div className="property-card-price">{formatPrice(property.price)}</div>
                          <Link to={`/property/${property._id}`} className="btn btn-primary btn-sm">
                            Details →
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                    >
                      ← Prev
                    </button>

                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          className={`btn btn-sm${page === currentPage ? ' btn-primary' : ' btn-secondary'}`}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      );
                    })}

                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default PropertyListing;
