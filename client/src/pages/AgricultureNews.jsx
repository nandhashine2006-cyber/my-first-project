import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Newspaper, ExternalLink, Calendar, Bookmark, RefreshCw, AlertTriangle, CheckCircle, Search } from 'lucide-react';
import api from '../services/api';
import defaultNewsImg from '../assets/commodities/paddy.jpg';

const AgricultureNews = () => {
  const { t, language } = useLanguage();
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLiveApi, setIsLiveApi] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('Tamil Nadu Agriculture');

  const topics = [
    'Tamil Nadu Agriculture',
    'Government Schemes',
    'Organic Farming',
    'Agricultural Technology',
    'Weather Alerts'
  ];

  const fetchNews = async (topic = selectedTopic) => {
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const resp = await api.get(`/news?category=${encodeURIComponent(topic)}&limit=12&lang=${language}`);
      if (resp.data && resp.data.success) {
        setNewsList(resp.data.data || []);
        setIsLiveApi(Boolean(resp.data.isLiveApi));
        if (resp.data.notice) setNotice(resp.data.notice);
      }
    } catch (err) {
      setError(err.userMessage || 'Could not reach agriculture news provider.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [selectedTopic]);

  const handleTopicClick = (topic) => {
    setSelectedTopic(topic);
  };

  return (
    <div className="main-content" style={{ maxWidth: '1100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="dash-card-icon" style={{ marginBottom: 0 }}>
            <Newspaper size={32} />
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', color: '#064e3b', marginBottom: '0.25rem' }}>{t('news')}</h1>
            <p style={{ color: '#64748b', margin: 0 }}>Verified GNews aggregation and MongoDB archives with zero AI-generated fabrication.</p>
          </div>
        </div>

        <button 
          onClick={() => fetchNews(selectedTopic)} 
          disabled={loading}
          className="btn btn-outline"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem' }}
        >
          <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Refreshing...' : 'Refresh News'}</span>
        </button>
      </div>

      {/* Topics Filter Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '2rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginRight: '0.5rem' }}>
          📰 Filter Verified Topics:
        </span>
        {topics.map((topic) => (
          <button
            key={topic}
            onClick={() => handleTopicClick(topic)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '25px',
              border: selectedTopic === topic ? '1.5px solid #059669' : '1px solid #cbd5e1',
              backgroundColor: selectedTopic === topic ? '#dcfce7' : '#ffffff',
              color: selectedTopic === topic ? '#065f46' : '#334155',
              fontWeight: selectedTopic === topic ? 700 : 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {topic}
          </button>
        ))}
      </div>

      {/* Feed Status Indicator */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {(() => {
          let text = 'LIVE VERIFIED NEWS';
          let color = '#065f46';
          let bg = '#dcfce7';
          let border = '#86efac';
          let icon = <CheckCircle size={15} color="#059669" />;
          
          if (loading) {
            text = 'UPDATING...';
            color = '#64748b';
            bg = '#f1f5f9';
            border = '#cbd5e1';
            icon = <RefreshCw size={15} className="animate-spin" color={color} />;
          } else if (!newsList || newsList.length === 0) {
            text = 'NO VERIFIED NEWS AVAILABLE';
            color = '#b91c1c';
            bg = '#fef2f2';
            border = '#f87171';
            icon = <AlertTriangle size={15} color={color} />;
          } else if (!isLiveApi) {
            text = 'CACHED VERIFIED NEWS';
            color = '#92400e';
            bg = '#fffbeb';
            border = '#fde68a';
            icon = <Bookmark size={15} color={color} />;
          }

          return (
            <span style={{ 
              backgroundColor: bg, 
              color: color, 
              padding: '0.35rem 0.9rem', 
              borderRadius: '20px', 
              fontSize: '0.85rem', 
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              border: `1px solid ${border}`
            }}>
              {icon} {text}
            </span>
          );
        })()}
        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Last Updated: {new Date().toLocaleTimeString()}
        </span>
      </div>

      {error && (
        <div style={{ padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #f87171', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 500 }}>
          <AlertTriangle size={22} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div style={{ padding: '0.85rem 1.25rem', borderRadius: '12px', marginBottom: '1.75rem', backgroundColor: '#fffbeb', color: '#92400e', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', fontWeight: 500 }}>
          <AlertTriangle size={20} style={{ flexShrink: 0, color: '#f59e0b' }} />
          <span>{notice}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b' }}>
          <RefreshCw size={44} className="animate-spin" style={{ margin: '0 auto 1rem', color: '#059669' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.3rem' }}>Retrieving Verified Agricultural Updates...</h3>
          <p style={{ margin: 0, fontSize: '0.95rem' }}>Filtering duplications and indexing localized farm subsidy bulletins.</p>
        </div>
      ) : newsList && newsList.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {newsList.map((article, idx) => (
            <div key={article._id || idx} className="card" style={{ padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', overflow: 'hidden', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
              <div style={{ minHeight: '260px', position: 'relative', background: '#f1f5f9' }}>
                <img 
                  src={article.newsImage || defaultNewsImg} 
                  alt={article.title} 
                  onError={(e) => { e.target.src = defaultNewsImg; }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                />
              </div>

              <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span className="badge badge-status" style={{ background: '#dcfce7', color: '#065f46', border: '1px solid #86efac', fontWeight: 700, fontSize: '0.8rem' }}>
                      {article.topic || selectedTopic}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
                      <Calendar size={15} color="#059669" /> 
                      {new Date(article.publishedDate || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  <h2 style={{ fontSize: '1.45rem', color: '#0f172a', marginBottom: '0.85rem', lineHeight: 1.35, fontWeight: 700 }}>
                    {article.title}
                  </h2>
                  <p style={{ color: '#475569', fontSize: '0.96rem', marginBottom: '1.75rem', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {article.summary}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <span style={{ fontSize: '0.88rem', color: '#334155', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    Source: <strong style={{ color: '#059669', background: '#ecfdf5', padding: '0.2rem 0.6rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <CheckCircle size={14} color="#059669" /> {article.sourceName || 'Verified Agricultural Desk'}
                    </strong>
                  </span>
                  <a 
                    href={article.originalUrl || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-primary" 
                    style={{ padding: '0.55rem 1.25rem', minHeight: '40px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#047857' }}
                  >
                    <span>Read Original Bulletin</span>
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '4.5rem 2rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
          <Newspaper size={48} style={{ margin: '0 auto 1rem', color: '#94a3b8' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.3rem' }}>No verified news found for this category</h3>
          <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.95rem' }}>
            We could not find any verified articles for "{selectedTopic}". Please try a different topic or check back later.
          </p>
        </div>
      )}
    </div>
  );
};

export default AgricultureNews;
