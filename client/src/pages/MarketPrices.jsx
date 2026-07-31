import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { TrendingUp, Filter, Search, ShieldAlert, RefreshCw, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { getCommodityImage } from '../data/commodityImages';

const tamilDict = {
  'Tomato': 'தக்காளி',
  'Onion': 'வெங்காயம்',
  'Lemon': 'எலுமிச்சை',
  'Banana': 'வாழைப்பழம்',
  'Coconut': 'தேங்காய்',
  'Paddy': 'நெல்',
  'Turmeric': 'மஞ்சள்',
  'Chilli': 'மிளகாய்',
  'Jasmine': 'மல்லிகை',
  'Rose': 'ரோஜா',
  'Brinjal': 'கத்தரிக்காய்',
  'Drumstick': 'முருங்கைக்காய்',
  'Mango': 'மாம்பழம்',
  'Groundnut': 'நிலக்கடலை'
};

const getLocalName = (commodity) => {
  if (!commodity) return '';
  for (const [en, ta] of Object.entries(tamilDict)) {
    if (commodity.toLowerCase().includes(en.toLowerCase())) {
      return ta;
    }
  }
  return '';
};

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => { clearTimeout(handler); };
  }, [value, delay]);
  return debouncedValue;
}

const MarketPrices = () => {
  const { t, language } = useLanguage();
  
  const [allPrices, setAllPrices] = useState([]);
  const [districts, setDistricts] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiveApi, setIsLiveApi] = useState(false);
  const [sourceTagOverall, setSourceTagOverall] = useState('');

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 600);
  
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [sortBy, setSortBy] = useState('Latest Date');
  
  const [page, setPage] = useState(1);
  
  const categories = [
    'All', 'Vegetables', 'Fruits', 'Flowers', 'Grains', 'Pulses', 
    'Spices', 'Seeds', 'Oilseeds', 'Plantation Crops', 
    'Fertilizers', 'Farming Tools', 'Nursery Plants'
  ];

  const sortOptions = [
    'Latest Date', 'Commodity A-Z', 'Modal Price Low to High', 'Modal Price High to Low', 'Market A-Z'
  ];

  const fetchPrices = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setPage(1);
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/market-prices?limit=5000`);
      if (response.data.success) {
        const data = response.data.data || [];
        setAllPrices(data);
        setIsLiveApi(response.data.isLiveApi);
        setSourceTagOverall(response.data.sourceTag);
        
        const uniqueDistricts = [...new Set(data.map(item => item.district).filter(Boolean))].sort();
        setDistricts(['All', ...uniqueDistricts]);
      } else {
        setError('Failed to fetch market records.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error connecting to API.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  // Local filtering, sorting, and pagination
  const getFilteredAndSortedPrices = () => {
    let filtered = [...allPrices];

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (selectedDistrict !== 'All') {
      filtered = filtered.filter(item => item.district === selectedDistrict);
    }

    if (debouncedSearchTerm && debouncedSearchTerm.trim() !== '') {
      const normalizeText = (text) => text ? text.toLowerCase().replace(/[\s-]/g, '') : '';
      const term = normalizeText(debouncedSearchTerm);
      filtered = filtered.filter(item => {
        const commodity = normalizeText(item.commodity);
        const variety = normalizeText(item.variety);
        const localName = normalizeText(item.localName);
        const market = normalizeText(item.market);
        
        return commodity.includes(term) || variety.includes(term) || localName.includes(term) || market.includes(term);
      });
    }

    if (sortBy === 'Commodity A-Z') {
      filtered.sort((a, b) => (a.commodity || '').localeCompare(b.commodity || ''));
    } else if (sortBy === 'Modal Price Low to High') {
      filtered.sort((a, b) => (a.modalPrice || 0) - (b.modalPrice || 0));
    } else if (sortBy === 'Modal Price High to Low') {
      filtered.sort((a, b) => (b.modalPrice || 0) - (a.modalPrice || 0));
    } else if (sortBy === 'Market A-Z') {
      filtered.sort((a, b) => (a.market || '').localeCompare(b.market || ''));
    } else {
      filtered.sort((a, b) => new Date(b.arrivalDate || 0) - new Date(a.arrivalDate || 0));
    }

    return filtered;
  };

  const filteredPrices = getFilteredAndSortedPrices();
  const limit = 24;
  const totalPages = Math.ceil(filteredPrices.length / limit) || 1;
  
  // Ensure page is within bounds when filters change
  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(1);
    }
  }, [filteredPrices.length, totalPages, page]);

  const prices = filteredPrices.slice((page - 1) * limit, page * limit);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const tr = (text) => language === 'ta' && tamilDict[text] ? tamilDict[text] : text;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    if (isNaN(d)) return dateString;
    return d.toLocaleDateString();
  };

  const getBadgeStyle = (sourceTag) => {
    if (sourceTag === 'Verified Government Source') return { bg: '#dcfce7', color: '#166534', icon: <ShieldAlert size={14} />, text: language === 'ta' ? 'சரிபார்க்கப்பட்ட அரசு தரவு' : 'Verified Government Source' };
    if (sourceTag === 'Cached Official Record') return { bg: '#f1f5f9', color: '#475569', icon: <TrendingUp size={14} />, text: language === 'ta' ? 'சரிபார்க்கப்பட்ட அரசு தரவு' : 'Verified Government Data' };
    if (sourceTag === 'Admin Updated') return { bg: '#fef9c3', color: '#854d0e', icon: <AlertCircle size={14} />, text: 'Admin Updated' };
    return { bg: '#f1f5f9', color: '#475569', icon: <AlertCircle size={14} />, text: 'Sample Data' }; // Sample
  };

  return (
    <div className="main-content">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="dash-card-icon" style={{ marginBottom: 0 }}>
            <TrendingUp size={32} />
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', color: '#064e3b', marginBottom: '0.25rem' }}>{language === 'ta' ? 'சந்தை விலைகள்' : 'Market Prices'}</h1>
            <p style={{ color: '#64748b' }}>Real-time verified Mandi Commodity tracking across Tamil Nadu.</p>
          </div>
        </div>
        
        <button 
          onClick={() => fetchPrices(true)}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          disabled={loading}
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          {language === 'ta' ? 'புதுப்பி' : 'Refresh'}
        </button>
      </div>

      {/* Search & Filters */}
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', marginBottom: '2rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder={language === 'ta' ? "பொருள், சந்தை அல்லது மாவட்டத்தை தேடுங்கள்..." : "Search commodity, market, district..."}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', fontSize: '1rem' }}
            />
          </div>
          {searchTerm && (
            <button type="button" onClick={() => { setSearchTerm(''); setPage(1); }} style={{ padding: '0 1rem', color: '#64748b', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              Clear
            </button>
          )}
        </form>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '200px', display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setPage(1); }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '9999px',
                  border: selectedCategory === cat ? 'none' : '1px solid #cbd5e1',
                  backgroundColor: selectedCategory === cat ? '#059669' : 'white',
                  color: selectedCategory === cat ? 'white' : '#334155',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {language === 'ta' && cat === 'All' ? 'அனைத்தும்' : cat}
              </button>
            ))}
          </div>

          <select 
            value={selectedDistrict} 
            onChange={(e) => { setSelectedDistrict(e.target.value); setPage(1); }}
            style={{ padding: '0.6rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontWeight: 500 }}
          >
            {districts.map(dist => (
              <option key={dist} value={dist}>
                {dist === 'All' ? (language === 'ta' ? 'அனைத்து மாவட்டங்கள்' : 'All Districts') : dist}
              </option>
            ))}
          </select>

          <select 
            value={sortBy} 
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            style={{ padding: '0.6rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontWeight: 500 }}
          >
            {sortOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading && prices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <RefreshCw size={40} className="animate-spin" style={{ margin: '0 auto 1rem', color: '#059669' }} />
          <p>{language === 'ta' ? 'சந்தை தரவு ஏற்றப்படுகிறது...' : 'Loading official market data...'}</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#ef4444', backgroundColor: '#fee2e2', borderRadius: '1rem' }}>
          <AlertCircle size={40} style={{ margin: '0 auto 1rem' }} />
          <p>{error}</p>
        </div>
      ) : prices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', background: 'white', borderRadius: '1rem' }}>
          <Search size={40} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p>{language === 'ta' ? 'தற்போதைய தேடலுக்கு பொருட்கள் கிடைக்கவில்லை.' : 'No commodities found for the current search/filters.'}</p>
        </div>
      ) : (
        <>
          <div className="dashboard-grid" style={{ marginTop: 0 }}>
            {prices.map((item) => {
              const localName = item.localName || getLocalName(item.commodity);
              const badge = getBadgeStyle(item.sourceTag);
              const imgUrl = getCommodityImage(item.commodity);

              return (
                <div key={item._id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem', overflow: 'hidden', backgroundColor: imgUrl ? 'transparent' : '#f8fafc', height: '180px', minHeight: '180px', padding: imgUrl ? 0 : '1rem', borderBottom: '1px solid #e2e8f0' }}>
                    
                    {imgUrl ? (
                      <img 
                        src={imgUrl} 
                        alt={`${item.commodity || item.productName} commodity`} 
                        loading="lazy"
                        className="commodity-card-image"
                      />
                    ) : (
                      <div style={{ color: '#475569', fontSize: '1.1rem', fontWeight: 600, textAlign: 'center', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        Image unavailable &ndash; {item.commodity}
                      </div>
                    )}

                    <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', right: '0.75rem', display: 'flex', justifyContent: 'space-between', zIndex: 2 }}>
                      <span style={{ background: badge.bg, color: badge.color, padding: '0.25rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        {badge.icon} {badge.text}
                      </span>
                      <span style={{ background: '#0f172a', color: 'white', padding: '0.25rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        {item.category}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', color: '#1e293b' }}>
                      {item.commodity} {item.variety && <span style={{ fontSize: '0.9rem', color: '#64748b' }}>({item.variety})</span>}
                    </h2>
                    
                    {(localName || item.district) && (
                      <div style={{ color: '#059669', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem' }}>
                        {localName && <span>{localName} • </span>}
                        {item.district} District
                      </div>
                    )}

                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1rem', border: '1px solid #e2e8f0', flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Modal Price:</span>
                        <strong style={{ color: '#059669', fontSize: '1.25rem' }}>₹{item.modalPrice} <span style={{ fontSize: '0.85rem', color: '#64748b' }}>/ {item.originalUnit}</span></strong>
                      </div>
                      
                      {item.calculatedKgPrice > 0 && (
                        <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#10b981', fontWeight: 600, marginBottom: '0.5rem' }}>
                          (Calculated ₹{item.calculatedKgPrice} / Kg)
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                        <span>Min: ₹{item.minimumPrice}</span>
                        <span>Max: ₹{item.maximumPrice}</span>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Mandi: <strong>{item.market}</strong>
                      </span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                        <span>{language === 'ta' ? 'விலை தேதி' : 'Price Date'}: {formatDate(item.arrivalDate)}</span>
                        {item.fetchedAt && <span>{language === 'ta' ? 'கடைசியாக புதுப்பிக்கப்பட்டது' : 'Last Synced'}: {formatDate(item.fetchedAt)}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: page === 1 ? '#f1f5f9' : 'white', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
              >
                <ChevronLeft size={20} />
              </button>
              <span style={{ fontWeight: 600, color: '#475569' }}>Page {page} of {totalPages}</span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: page === totalPages ? '#f1f5f9' : 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MarketPrices;
