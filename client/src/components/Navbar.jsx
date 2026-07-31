import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Globe, Home, UserCheck } from 'lucide-react';
import Logo from './Logo';
import { useAdminAuth } from '../context/AdminAuthContext';

const Navbar = () => {
  const { language, changeLanguage, t, supportedLanguages } = useLanguage();
  const { isAdmin } = useAdminAuth();
  const location = useLocation();

  // On the initial Welcome and Language Select pages, we can show simple branding
  const isIntroPage = location.pathname === '/' || location.pathname === '/language-select';

  return (
    <header className="navbar">
      <Link to={isIntroPage ? '/' : '/dashboard'} className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: '45px', height: '45px' }}>
          <Logo size="circular" />
        </div>
        <span style={{ fontWeight: 800, color: '#064e3b' }}>{t('projectName')}</span>
      </Link>

      <div className="nav-actions">
        {!isIntroPage && (
          <Link to="/dashboard" className="btn btn-outline" style={{ padding: '0.4rem 0.85rem', minHeight: '38px', fontSize: '0.85rem' }}>
            <Home size={16} />
            <span className="nav-link-text">{t('home')}</span>
          </Link>
        )}

        {!isIntroPage && isAdmin && (
          <Link to="/admin" className="btn btn-outline" style={{ padding: '0.4rem 0.85rem', minHeight: '38px', fontSize: '0.85rem' }}>
            <UserCheck size={16} />
            <span className="nav-link-text">{t('adminPortal') || 'Admin Dashboard'}</span>
          </Link>
        )}

        <div className="language-selector-wrap" title="Change Language">
          <Globe size={18} color="#059669" />
          <select 
            value={language} 
            onChange={(e) => changeLanguage(e.target.value)}
            className="language-select"
            aria-label="Select Language"
          >
            {supportedLanguages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName} ({lang.name})
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
