import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAdminAuth } from '../context/AdminAuthContext';
import { 
  Stethoscope, 
  CloudRain, 
  TrendingUp, 
  Tag, 
  ShoppingBag, 
  Newspaper, 
  ArrowRight, 
  ShieldCheck,
  Lock
} from 'lucide-react';

const HomeDashboard = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { isAdmin } = useAdminAuth();

  const modules = [
    {
      id: 'plant-doctor',
      title: t('plantDoctor'),
      description: t('docDesc'),
      icon: <Stethoscope size={28} />,
      path: '/plant-doctor',
      badge: 'AI Diagnostic'
    },
    {
      id: 'weather',
      title: t('weather'),
      description: t('weatherDesc'),
      icon: <CloudRain size={28} />,
      path: '/weather',
      badge: 'Live Forecast'
    },
    {
      id: 'market-prices',
      title: t('marketPrices'),
      description: t('marketDesc'),
      icon: <TrendingUp size={28} />,
      path: '/market-prices',
      badge: 'Mandi Rates'
    },
    {
      id: 'sell-product',
      title: t('sellProduct'),
      description: t('sellDesc'),
      icon: <Tag size={28} />,
      path: '/sell-product',
      badge: 'Farmer Portal'
    },
    {
      id: 'marketplace',
      title: t('marketplace'),
      description: t('marketplaceDesc'),
      icon: <ShoppingBag size={28} />,
      path: '/marketplace',
      badge: 'Direct Buy/Sell'
    },
    {
      id: 'news',
      title: t('news'),
      description: t('newsDesc'),
      icon: <Newspaper size={28} />,
      path: '/news',
      badge: 'Tamil Nadu Feed'
    }
  ];

  return (
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        {isAdmin ? (
          <button 
            onClick={() => navigate('/admin')}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#0f172a', border: 'none' }}
          >
            <ShieldCheck size={18} />
            <span>Admin Dashboard</span>
          </button>
        ) : (
          <button 
            onClick={() => navigate('/admin/login')}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            <Lock size={16} />
            <span>Admin Login</span>
          </button>
        )}
      </div>

      <div className="dashboard-grid">
        {modules.map((mod, index) => (
          <div 
            key={mod.id} 
            className="card premium-module-card"
            style={{ animationDelay: `${index * 0.08}s` }}
          >
            <div className="card-content-wrapper">
              <div className="card-top-row">
                <div className="dash-card-icon premium-icon">
                  {React.cloneElement(mod.icon, { size: 32 })}
                </div>
                <span className="badge badge-status premium-badge">
                  {t(mod.id + 'Badge') || mod.badge}
                </span>
              </div>

              <h2 className="premium-card-title">
                {mod.title}
              </h2>
              <p className="premium-card-desc">
                {mod.description}
              </p>
            </div>

            <button 
              onClick={() => navigate(mod.path)} 
              className="btn btn-primary premium-action-btn"
            >
              <span>{t('open')}</span>
              <ArrowRight size={20} className="arrow-icon" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomeDashboard;
