import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

// Use Vite's glob import to gracefully handle missing logo file
const assetMap = import.meta.glob('../assets/logo.png', { eager: true, import: 'default' });
const logoImg = assetMap['../assets/logo.png'] || null;

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="welcome-hero">
      <div className="welcome-content">
        <div className="welcome-logo-circle">
          {logoImg ? (
            <img src={logoImg} alt="Logo" className="welcome-logo-img" />
          ) : (
            <div className="welcome-logo-fallback" />
          )}
        </div>

        <h1 className="welcome-title">
          பசுமையாக வளர்க்கவும், நீடித்து வாழவும்
        </h1>
        
        <p className="welcome-subtitle">
          தமிழ்நாடு விவசாயிகளுக்கான நவீன டிஜிட்டல் துணை
        </p>

        <button 
          onClick={() => navigate('/language-select')}
          className="welcome-btn"
        >
          <span>தொடங்கலாம்</span>
          <ArrowRight size={24} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

export default Welcome;
