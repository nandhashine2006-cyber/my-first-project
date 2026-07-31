import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { ShieldCheck, AlertCircle, Lock } from 'lucide-react';
import Logo from '../components/Logo';

const AdminLogin = () => {
  const { login, isAdmin, loading } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/admin';

  useEffect(() => {
    if (isAdmin) {
      navigate(from, { replace: true });
    }
  }, [isAdmin, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const response = await login(identifier, password);
      if (response && !response.success) {
        setErrorMsg(response.message || 'Invalid login credentials.');
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Checking auth...</div>;

  return (
    <div className="main-content" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ maxWidth: '450px', width: '100%', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <Logo size="medium" />
        </div>
        
        <div style={{ backgroundColor: '#f0fdf4', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#059669' }}>
          <ShieldCheck size={28} />
        </div>
        
        <h2 style={{ fontSize: '1.5rem', textAlign: 'center', color: '#064e3b', fontWeight: 700, marginBottom: '0.5rem' }}>Admin Portal Login</h2>
        <p style={{ color: '#64748b', fontSize: '0.92rem', textAlign: 'center', marginBottom: '2rem' }}>
          Please authenticate with your secure credentials to continue.
        </p>

        {errorMsg && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
            <AlertCircle size={18} />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label className="form-label">Username or Email</label>
            <input 
              type="text" 
              required
              className="form-input" 
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoFocus
            />
          </div>
          
          <div>
            <label className="form-label">Password</label>
            <input 
              type="password" 
              required
              className="form-input" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ marginTop: '0.5rem', padding: '0.85rem', fontWeight: 700, display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            {isSubmitting ? 'Authenticating...' : <><Lock size={18} /> Secure Login</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
