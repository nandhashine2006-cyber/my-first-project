import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ShieldAlert } from 'lucide-react';
import Logo from './Logo';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
            <Logo size="small" />
            <h3 className="footer-title" style={{ margin: 0 }}>{t('projectName')}</h3>
          </div>
          <p className="footer-text">{t('footerTagline')}</p>
        </div>

        <div className="footer-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <ShieldAlert size={20} color="#fbbf24" />
            <h4 className="footer-title" style={{ fontSize: '1rem', color: '#fef9c3', margin: 0 }}>
              Farmer Advisory Notice
            </h4>
          </div>
          <p className="footer-text" style={{ fontSize: '0.85rem', color: '#d1fae5' }}>
            {t('emergencyWarning')}
          </p>
        </div>

        <div className="footer-section" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p className="footer-text" style={{ fontSize: '0.9rem' }}>
            <strong>Regional Technology:</strong> Powered by Google Gemini AI & OpenWeather Insights.<br />
            <strong>Targeted Region:</strong> Tamil Nadu Agricultural Districts.
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>{t('copyright')}</p>
      </div>
    </footer>
  );
};

export default Footer;
