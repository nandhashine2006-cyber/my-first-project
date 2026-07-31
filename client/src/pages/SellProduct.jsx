import React, { useState, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Tag, CheckCircle2, Upload, MapPin, X, AlertCircle } from 'lucide-react';

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

const UNITS = [
  'Kilogram', 'Quintal', 'Ton', 'Bag', 'Bundle', 'Piece', 'Box', 'Litre'
];

const SellProduct = () => {
  const { t, language } = useLanguage();
  const fileInputRef = useRef(null);
  
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [form, setForm] = useState({
    farmerName: '',
    mobileNumber: '',
    productName: '',
    category: '',
    description: '',
    quantity: '',
    unit: 'Kilogram',
    sellingPrice: '',
    marketPrice: '',
    village: '',
    district: '',
    address: '',
    harvestDate: getTodayDateString(),
    availableUntil: '',
    isOrganic: false,
    preferredContactMethod: 'phone',
    selectedLanguage: language
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setErrorMsg('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setErrorMsg('');
    
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Image size exceeds 5MB limit.');
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setErrorMsg('Unsupported image format. Please use JPG, PNG, or WEBP.');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    if (!form.farmerName.trim()) return "Farmer name is required";
    
    const mobileCleaned = form.mobileNumber.replace(/\D/g, '');
    if (mobileCleaned.length !== 10) return "Mobile number must be exactly 10 digits";
    
    if (!form.productName.trim()) return "Product name is required";
    if (!form.category) return "Category is required";
    if (!form.description.trim()) return "Description is required";
    if (Number(form.quantity) <= 0) return "Quantity must be greater than zero";
    if (Number(form.sellingPrice) <= 0) return "Selling price must be greater than zero";
    if (!form.village.trim()) return "Village is required";
    if (!form.district) return "District is required";
    if (!form.address.trim()) return "Address is required";
    if (!imageFile) return "Product image is required";
    
    const harvest = new Date(form.harvestDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (harvest > today) return "Harvest date cannot be a future date";
    
    const available = new Date(form.availableUntil);
    if (available < harvest) return "Available-until date must be after or equal to harvest date";

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        formData.append(key, form[key]);
      });
      formData.append('productImage', imageFile);

      const response = await fetch('http://localhost:5001/api/products', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitted(true);
        // Reset form
        setForm({
          farmerName: '', mobileNumber: '', productName: '', category: '', description: '',
          quantity: '', unit: 'Kilogram', sellingPrice: '', marketPrice: '', village: '',
          district: '', address: '', harvestDate: getTodayDateString(), availableUntil: '',
          isOrganic: false, preferredContactMethod: 'phone', selectedLanguage: language
        });
        removeImage();
      } else {
        setErrorMsg(data.message || 'Failed to submit product.');
      }
    } catch (err) {
      setErrorMsg('Server connection error. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="main-content" style={{ maxWidth: '820px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="dash-card-icon" style={{ marginBottom: 0 }}>
          <Tag size={32} />
        </div>
        <div>
          <h1 style={{ fontSize: '2rem', color: '#064e3b', marginBottom: '0.25rem' }}>Sell Product</h1>
          <p style={{ color: '#64748b' }}>Directly submit your agricultural produce to regional buyers.</p>
        </div>
      </div>

      {errorMsg && (
        <div style={{ padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '0.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      {!submitted ? (
        <div className="card">
          <form onSubmit={handleSubmit}>
            <h3 style={{ fontSize: '1.25rem', color: '#064e3b', marginBottom: '1.25rem', borderBottom: '1px solid #d1fae5', paddingBottom: '0.5rem' }}>
              1. Farmer Details & Location
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Farmer Name *</label>
                <input required type="text" name="farmerName" value={form.farmerName} onChange={handleChange} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Mobile Number *</label>
                <input required type="tel" name="mobileNumber" value={form.mobileNumber} onChange={handleChange} className="form-input" placeholder="10-digit mobile number" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Village / Town *</label>
                <input required type="text" name="village" value={form.village} onChange={handleChange} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">District *</label>
                <select required name="district" value={form.district} onChange={handleChange} className="form-select">
                  <option value="">Select District</option>
                  {TN_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Full Address *</label>
              <textarea required name="address" value={form.address} onChange={handleChange} className="form-input" rows="2"></textarea>
            </div>

            <h3 style={{ fontSize: '1.25rem', color: '#064e3b', margin: '2rem 0 1.25rem', borderBottom: '1px solid #d1fae5', paddingBottom: '0.5rem' }}>
              2. Product Information
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input required type="text" name="productName" value={form.productName} onChange={handleChange} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select required name="category" value={form.category} onChange={handleChange} className="form-select">
                  <option value="">Select Category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Description *</label>
              <textarea required name="description" value={form.description} onChange={handleChange} className="form-input" rows="3" placeholder="Describe quality, variety, and details..."></textarea>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Quantity *</label>
                <input required type="number" step="0.01" min="0.01" name="quantity" value={form.quantity} onChange={handleChange} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Unit *</label>
                <select name="unit" value={form.unit} onChange={handleChange} className="form-select">
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Selling Price (₹) *</label>
                <input required type="number" step="0.01" min="0.01" name="sellingPrice" value={form.sellingPrice} onChange={handleChange} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Market Price (Optional)</label>
                <input type="number" step="0.01" min="0" name="marketPrice" value={form.marketPrice} onChange={handleChange} className="form-input" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Harvest Date *</label>
                <input required type="date" max={getTodayDateString()} name="harvestDate" value={form.harvestDate} onChange={handleChange} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Available Until *</label>
                <input required type="date" name="availableUntil" value={form.availableUntil} onChange={handleChange} className="form-input" />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', padding: '1rem', background: '#ecfdf5', borderRadius: '0.5rem', border: '1px solid #a7f3d0' }}>
              <input type="checkbox" id="organic" name="isOrganic" checked={form.isOrganic} onChange={handleChange} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
              <label htmlFor="organic" style={{ fontWeight: 700, color: '#064e3b', cursor: 'pointer', margin: 0 }}>
                🌱 Certified Naturally Grown / Organic Produce
              </label>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Preferred Contact Method *</label>
              <select name="preferredContactMethod" value={form.preferredContactMethod} onChange={handleChange} className="form-select" style={{ maxWidth: '300px' }}>
                <option value="phone">Phone Call Only</option>
                <option value="whatsapp">WhatsApp Only</option>
                <option value="both">Phone & WhatsApp</option>
              </select>
            </div>

            <h3 style={{ fontSize: '1.25rem', color: '#064e3b', margin: '2rem 0 1.25rem', borderBottom: '1px solid #d1fae5', paddingBottom: '0.5rem' }}>
              3. Product Image
            </h3>

            <div style={{ marginBottom: '2rem' }}>
              {!imagePreview ? (
                <div style={{ border: '2px dashed #cbd5e1', borderRadius: '0.5rem', padding: '2rem', textAlign: 'center', backgroundColor: '#f8fafc', cursor: 'pointer' }} onClick={() => fileInputRef.current.click()}>
                  <Upload size={32} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
                  <p style={{ color: '#475569', fontWeight: 500 }}>Click to upload product image</p>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.5rem' }}>JPG, PNG, WEBP (Max 5MB)</p>
                  <input type="file" accept="image/jpeg, image/png, image/webp" onChange={handleImageChange} ref={fileInputRef} style={{ display: 'none' }} />
                </div>
              ) : (
                <div style={{ position: 'relative', maxWidth: '300px', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  <img src={imagePreview} alt="Preview" style={{ width: '100%', height: 'auto', display: 'block' }} />
                  <button type="button" onClick={removeImage} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: '100%', fontSize: '1.1rem', padding: '1rem', opacity: isSubmitting ? 0.7 : 1 }}>
              {isSubmitting ? 'Submitting...' : 'Submit Product for Approval'}
            </button>
          </form>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <CheckCircle2 size={64} color="#059669" style={{ margin: '0 auto 1.5rem' }} />
          <h2 style={{ color: '#064e3b', marginBottom: '1rem' }}>Product Successfully Registered!</h2>
          <p style={{ color: '#475569', maxWidth: '500px', margin: '0 auto 2rem', fontSize: '1.1rem' }}>
            Your product was submitted successfully and is waiting for admin approval. Once approved, it will be visible in the marketplace.
          </p>
          <button onClick={() => setSubmitted(false)} className="btn btn-primary">
            Submit Another Product
          </button>
        </div>
      )}
    </div>
  );
};

export default SellProduct;
