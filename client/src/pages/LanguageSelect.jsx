import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage, supportedLanguages } from '../context/LanguageContext';
import { Languages, CheckCircle2 } from 'lucide-react';

const LanguageSelect = () => {
  const { language, changeLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const handleSelect = (code) => {
    changeLanguage(code);
    navigate('/dashboard');
  };

  return (
    <div className="language-hero">
      <div style={{ maxWidth: '1000px', width: '100%', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(255,255,255,0.7)', borderRadius: '50%', color: '#059669', marginBottom: '1rem', backdropFilter: 'blur(4px)' }}>
            <Languages size={40} />
          </div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem', color: '#064e3b' }}>
            {t('selectLanguage')}
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#064e3b', maxWidth: '600px', margin: '0 auto', fontWeight: 500 }}>
            {t('selectLangDesc')}
          </p>
        </div>

        <div className="language-grid">
          {supportedLanguages.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <div 
                key={lang.code} 
                onClick={() => changeLanguage(lang.code)}
                className={`lang-card ${isSelected ? 'active' : ''}`}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => { if (e.key === 'Enter') changeLanguage(lang.code); }}
                aria-label={`Select ${lang.name}`}
              >
                <span className="lang-native">{lang.nativeName}</span>
                <span className="lang-english">{lang.name}</span>
                {isSelected && (
                  <div style={{ marginTop: '0.5rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 700 }}>
                    <CheckCircle2 size={16} /> Selected
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn btn-primary"
            style={{ fontSize: '1.1rem', padding: '0.85rem 2rem' }}
          >
            {t('continueToDashboard') || 'Continue to Dashboard'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelect;
