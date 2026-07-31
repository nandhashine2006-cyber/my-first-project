import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Server, Database, Cloud, Newspaper, Store, Cpu, CheckCircle, XCircle, AlertTriangle, RefreshCw, Lock } from 'lucide-react';
import api from '../services/api';

const SetupStatus = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({
    database: { configured: false, connected: false },
    gemini: { configured: false },
    weather: { configured: false },
    news: { configured: false },
    market: { configured: false }
  });
  const [errorMessage, setErrorMessage] = useState('');

  const fetchStatus = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const resp = await api.get('/system/status');
      if (resp.data && resp.data.success) {
        setStatus(resp.data.data);
      }
    } catch (err) {
      setErrorMessage(err.userMessage || 'Failed to fetch API system status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const services = [
    {
      id: 'database',
      title: 'MongoDB Atlas',
      icon: <Database size={28} color="#059669" />,
      isConfigured: status.database?.configured,
      isConnected: status.database?.connected,
      isOptional: false,
      instruction: 'Add MONGODB_URI to server/.env.',
      description: 'Main persistence cloud layer for Plant AI analyses, farmer mandi prices, products, and news archives.'
    },
    {
      id: 'gemini',
      title: 'Gemini AI Plant Doctor',
      icon: <Cpu size={28} color="#0284c7" />,
      isConfigured: status.gemini?.configured,
      isOptional: false,
      instruction: 'Add GEMINI_API_KEY to server/.env.',
      description: 'Google Generative AI multimodal Vision SDK powering 10-language crop disease diagnosis.'
    },
    {
      id: 'weather',
      title: 'OpenWeather API',
      icon: <Cloud size={28} color="#f59e0b" />,
      isConfigured: status.weather?.configured,
      isOptional: false,
      instruction: 'Add OPENWEATHER_API_KEY to server/.env.',
      description: 'Geocoding and current localized micro-weather forecasts for farmers across Tamil Nadu districts.'
    },
    {
      id: 'news',
      title: 'News API (GNews Provider)',
      icon: <Newspaper size={28} color="#8b5cf6" />,
      isConfigured: status.news?.configured,
      isOptional: false,
      instruction: 'Add NEWS_API_KEY to server/.env.',
      description: 'Verified agricultural news aggregation feed with zero AI-generated fabrication or false dates.'
    },
    {
      id: 'market',
      title: 'Market Price API',
      icon: <Store size={28} color="#10b981" />,
      isConfigured: status.market?.configured,
      isOptional: true,
      instruction: 'Optional. Admin-entered prices will be used.',
      description: 'External mandi API connection. When offline, real-time rates fall back to Admin Updated records.'
    }
  ];

  return (
    <div className="main-content" style={{ maxWidth: '1100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', color: '#064e3b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Server size={32} color="#059669" />
            System & API Setup Status
          </h1>
          <p style={{ color: '#64748b' }}>
            Diagnostic setup verification page for developer preview. Safe configuration checks without exposing private credentials.
          </p>
        </div>

        <button 
          onClick={fetchStatus} 
          disabled={loading}
          className="btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem' }}
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Checking...' : 'Refresh Status'}
        </button>
      </div>

      {errorMessage && (
        <div className="alert-badge alert-danger" style={{ padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #f87171' }}>
          <AlertTriangle size={24} />
          <span>{errorMessage}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {services.map((svc) => (
          <div key={svc.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: svc.isConfigured ? '4px solid #10b981' : svc.isOptional ? '4px solid #3b82f6' : '4px solid #f59e0b', position: 'relative' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ background: '#f1f5f9', padding: '0.75rem', borderRadius: '12px' }}>
                    {svc.icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', color: '#0f172a', margin: 0 }}>{svc.title}</h3>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {svc.isOptional ? 'Optional Provider' : 'Core Required Module'}
                    </span>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '0.95rem', color: '#475569', marginBottom: '1.5rem', minHeight: '45px' }}>
                {svc.description}
              </p>
            </div>

            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.95rem' }}>Configuration Status:</span>
                
                {svc.isConfigured ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#059669', background: '#dcfce7', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700 }}>
                    <CheckCircle size={16} />
                    Configured
                  </span>
                ) : svc.isOptional ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#1d4ed8', background: '#dbeafe', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700 }}>
                    <Lock size={15} />
                    Optional
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#d97706', background: '#fef3c7', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700 }}>
                    <AlertTriangle size={16} />
                    Not Configured
                  </span>
                )}
              </div>

              {svc.id === 'database' && svc.isConfigured && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', borderTop: '1px dashed #cbd5e1', paddingTop: '0.75rem' }}>
                  <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.95rem' }}>Database Connection:</span>
                  {svc.isConnected ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#059669', background: '#dcfce7', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700 }}>
                      <CheckCircle size={16} />
                      Connected
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#b91c1c', background: '#fee2e2', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700 }}>
                      <XCircle size={16} />
                      Connection Failed
                    </span>
                  )}
                </div>
              )}

              {!svc.isConfigured && (
                <div style={{ marginTop: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                  <span style={{ display: 'block', fontSize: '0.85rem', color: svc.isOptional ? '#475569' : '#b45309', fontFamily: 'monospace', fontWeight: 600 }}>
                    ℹ️ {svc.instruction}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '3rem', padding: '1.5rem', background: '#ecfdf5', borderRadius: '12px', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: '1.25rem', color: '#065f46' }}>
        <Lock size={36} color="#059669" style={{ flexShrink: 0 }} />
        <div>
          <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', color: '#064e3b' }}>Security Guaranteed</h4>
          <p style={{ margin: 0, fontSize: '0.95rem', color: '#047857' }}>
            This page evaluates configuration booleans only. For strict production safety, real secret values, MongoDB connection strings, and API tokens are never sent over HTTP nor embedded in browser console memory. Note: Ensure this development setup page is not linked publicly in production environments.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SetupStatus;
