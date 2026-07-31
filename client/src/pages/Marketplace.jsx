import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ShoppingBag, Search, MapPin, Filter, X, RefreshCw, PhoneCall, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

const TN_DISTRICTS = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri', 'Dindigul',
  'Erode', 'Kallakurichi', 'Kanchipuram', 'Kanyakumari', 'Karur', 'Krishnagiri', 'Madurai',
  'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai',
  'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi', 'Thanjavur', 'Theni',
  'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli', 'Tirupathur', 'Tiruppur', 'Tiruvallur',
  'Tiruvannamalai', 'Tiruvarur', 'Vellore', 'Viluppuram', 'Virudhunagar'
];

const CATEGORIES = [
  'Fruits', 'Vegetables', 'Flowers', 'Seeds', 'Grains', 'Pulses', 'Spices',
  'Oilseeds', 'Organic Products', 'Nursery Plants', 'Fertilizers', 'Farming Tools', 'Other'
];

const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'quantity-high', label: 'Quantity: High to Low' },
  { value: 'name', label: 'Name: A-Z' }
];

const Marketplace = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [filters, setFilters] = useState({
    q: '',
    category: '',
    district: '',
    village: '',
    organic: false,
    sort: 'latest',
    page: 1
  });
  
  const [searchInput, setSearchInput] = useState('');
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });
  const [showFilters, setShowFilters] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams();
      if (filters.q) queryParams.append('q', filters.q);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.district) queryParams.append('district', filters.district);
      if (filters.village) queryParams.append('village', filters.village);
      if (filters.organic) queryParams.append('organic', 'true');
      if (filters.sort) queryParams.append('sort', filters.sort);
      queryParams.append('page', filters.page);
      
      const response = await fetch(`http://localhost:5001/api/products?${queryParams.toString()}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        setProducts(data.data);
        if (data.pagination) setPagination(data.pagination);
      } else {
        setError(data.message || 'Failed to load products');
      }
    } catch (err) {
      setError('Server connection error');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters(prev => ({ ...prev, q: searchInput, page: 1 }));
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      page: 1
    }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, q: searchInput, page: 1 }));
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      q: '', category: '', district: '', village: '', organic: false, sort: 'latest', page: 1
    });
  };

  const formatDate = (date) => new Date(date).toLocaleDateString();
  const defaultImage = 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600';

  return (
    <div className="main-content">
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="dash-card-icon" style={{ marginBottom: 0 }}>
            <ShoppingBag size={32} />
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', color: '#064e3b', marginBottom: '0.25rem' }}>Marketplace</h1>
            <p style={{ color: '#64748b' }}>Direct farm-to-buyer produce listings.</p>
          </div>
        </div>
        
        <button onClick={fetchProducts} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw size={18} /> Refresh
        </button>
      </div>

      <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
          
          <form onSubmit={handleSearchSubmit} style={{ flex: '1 1 300px', display: 'flex', position: 'relative' }}>
            <Search size={20} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search products, village, description..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '3rem', width: '100%' }}
            />
          </form>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={() => setShowFilters(!showFilters)} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={18} /> Filters
            </button>
            <select name="sort" value={filters.sort} onChange={handleFilterChange} className="form-select" style={{ width: '180px' }}>
              {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>

        {showFilters && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
            <select name="category" value={filters.category} onChange={handleFilterChange} className="form-select" style={{ flex: '1 1 200px' }}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            
            <select name="district" value={filters.district} onChange={handleFilterChange} className="form-select" style={{ flex: '1 1 200px' }}>
              <option value="">All Districts</option>
              {TN_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            
            <input type="text" name="village" value={filters.village} onChange={handleFilterChange} placeholder="Filter by Village" className="form-input" style={{ flex: '1 1 200px' }} />
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', flex: '1 1 200px' }}>
              <input type="checkbox" name="organic" checked={filters.organic} onChange={handleFilterChange} style={{ width: '20px', height: '20px' }} />
              <span>Organic Only</span>
            </label>
            
            <button onClick={clearFilters} className="btn" style={{ background: '#f1f5f9', color: '#475569' }}>
              <X size={18} /> Clear Filters
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#059669' }}>
          <h2>Loading products...</h2>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>
          <h2>{error}</h2>
        </div>
      ) : products.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <ShoppingBag size={48} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ color: '#475569', marginBottom: '1rem' }}>No products found</h2>
          <p style={{ color: '#64748b' }}>Try adjusting your filters or search terms.</p>
          <button onClick={clearFilters} className="btn btn-outline" style={{ marginTop: '1rem' }}>Clear Filters</button>
        </div>
      ) : (
        <>
          <div className="dashboard-grid">
            {products.map((item) => (
              <div key={item._id} className="card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '200px', overflow: 'hidden', position: 'relative' }}>
                  <img src={item.imageUrl ? `http://localhost:5001${item.imageUrl}` : defaultImage} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.src = defaultImage; }} />
                  {item.isOrganic && (
                    <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem' }}>
                      <span className="badge badge-organic">🌱 Organic</span>
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}>
                    <span className="badge" style={{ backgroundColor: '#059669', color: 'white' }}>Available</span>
                  </div>
                </div>

                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#059669', fontSize: '0.8rem', fontWeight: 600 }}>
                        <MapPin size={14} /> {item.village}, {item.district}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{formatDate(item.createdAt)}</span>
                    </div>
                    
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '0.25rem', color: '#1e293b' }}>{item.productName}</h2>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '1rem' }}>{item.category}</span>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginBottom: '1.25rem' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Qty</span>
                        <strong style={{ fontSize: '1rem', color: '#1e293b' }}>{item.quantity} {item.unit}</strong>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Price</span>
                        <strong style={{ fontSize: '1.25rem', color: '#059669' }}>₹{item.sellingPrice}</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link to={`/marketplace/${item._id}`} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center', padding: '0.5rem' }}>
                        <Eye size={16} /> Details
                      </Link>
                      <Link to={`/marketplace/${item._id}`} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '0.5rem' }}>
                        <PhoneCall size={16} /> Contact
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
              <button 
                onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={filters.page === 1}
                className="btn btn-outline"
              >
                <ChevronLeft size={20} /> Prev
              </button>
              <span style={{ fontWeight: 600, color: '#334155' }}>Page {pagination.page} of {pagination.totalPages}</span>
              <button 
                onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
                disabled={filters.page === pagination.totalPages}
                className="btn btn-outline"
              >
                Next <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Marketplace;
