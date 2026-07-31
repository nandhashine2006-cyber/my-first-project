import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { MapPin, PhoneCall, MessageCircle, ArrowLeft, Calendar, Info, Package, Leaf } from 'lucide-react';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/products/${id}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          setProduct(result.data);
        } else {
          setError(result.message || 'Failed to fetch product details.');
        }
      } catch (err) {
        setError('Server error while fetching product details.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: '#059669' }}>
          <div className="skeleton" style={{ width: '60px', height: '60px', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
          <h2>Loading details...</h2>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="main-content" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>{error || 'Product not found'}</h2>
        <button onClick={() => navigate('/marketplace')} className="btn btn-primary">
          <ArrowLeft size={18} /> Back to Marketplace
        </button>
      </div>
    );
  }

  const defaultImage = 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600';
  const imgSource = product.imageUrl ? `http://localhost:5001${product.imageUrl}` : defaultImage;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const whatsappMessage = encodeURIComponent(`Hello, I found your ${product.productName} listing on Grow Green, Live Long. Is it still available?`);

  // Format Indian mobile number safely
  const formatMobile = (mobile) => {
    // Basic formatting assuming it's mostly 10 digits
    let cleaned = mobile.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
       return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
    }
    return mobile;
  };

  // Get raw 10 digit or 12 digit number for whatsapp link
  const rawMobile = product.mobileNumber.replace(/\D/g, '');
  const whatsappNumber = rawMobile.length === 10 ? `91${rawMobile}` : rawMobile;

  return (
    <div className="main-content">
      <button 
        onClick={() => navigate('/marketplace')} 
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '1.5rem', fontSize: '1rem', fontWeight: '500' }}
      >
        <ArrowLeft size={18} /> Back to Listings
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', backgroundColor: 'white', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        {/* Responsive Grid for Details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0' }}>
          
          {/* Left Col: Image */}
          <div style={{ position: 'relative', minHeight: '300px' }}>
            <img 
              src={imgSource} 
              alt={product.productName} 
              style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} 
              onError={(e) => { e.target.src = defaultImage; }}
            />
            {product.isOrganic && (
              <div style={{ position: 'absolute', top: '1rem', left: '1rem' }}>
                <span className="badge badge-organic" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>🌱 Certified Organic</span>
              </div>
            )}
          </div>

          {/* Right Col: Info */}
          <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', fontWeight: 600, marginBottom: '1rem' }}>
              <MapPin size={18} /> {product.village}, {product.district} District
            </div>
            
            <h1 style={{ fontSize: '2.5rem', color: '#064e3b', marginBottom: '0.5rem', lineHeight: 1.2 }}>{product.productName}</h1>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
              <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 500 }}>
                {product.category}
              </span>
              <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                Posted on {formatDate(product.createdAt)}
              </span>
              <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                 • {product.views} views
              </span>
            </div>

            <p style={{ color: '#475569', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              {product.description}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem' }}>
              <div>
                <span style={{ display: 'block', color: '#64748b', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Available Quantity</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b', fontWeight: 700, fontSize: '1.25rem' }}>
                  <Package size={20} color="#059669" /> {product.quantity} {product.unit}
                </div>
              </div>
              
              <div>
                <span style={{ display: 'block', color: '#64748b', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Selling Price</span>
                <div style={{ color: '#059669', fontWeight: 800, fontSize: '1.75rem' }}>
                  ₹{product.sellingPrice} <span style={{ fontSize: '1rem', fontWeight: 500, color: '#64748b' }}>/ {product.unit}</span>
                </div>
                {product.marketPrice > 0 && (
                  <div style={{ fontSize: '0.875rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                    Est. Market: ₹{product.marketPrice}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  <Calendar size={16} /> Harvest Date
                </span>
                <strong style={{ color: '#334155' }}>{formatDate(product.harvestDate)}</strong>
              </div>
              <div>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  <Info size={16} /> Available Until
                </span>
                <strong style={{ color: '#334155' }}>{formatDate(product.availableUntil)}</strong>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '2rem 0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', color: '#1e293b' }}>Farmer Details</h3>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#334155' }}>{product.farmerName}</div>
              
              {!showContact ? (
                <button onClick={() => setShowContact(true)} className="btn btn-primary" style={{ padding: '1rem', fontSize: '1.1rem', justifyContent: 'center' }}>
                  Reveal Contact Details
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.3s ease-in' }}>
                  <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem', fontSize: '1.25rem', fontWeight: 700, color: '#064e3b', textAlign: 'center' }}>
                    {formatMobile(product.mobileNumber)}
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <a href={`tel:${rawMobile}`} className="btn btn-outline" style={{ justifyContent: 'center', borderColor: '#059669', color: '#059669' }}>
                      <PhoneCall size={20} /> Call Now
                    </a>
                    
                    {product.preferredContactMethod !== 'phone' && (
                      <a 
                        href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn" 
                        style={{ justifyContent: 'center', backgroundColor: '#25D366', color: 'white' }}
                      >
                        <MessageCircle size={20} /> WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
