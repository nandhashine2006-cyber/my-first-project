import React, { useState } from 'react';
import { Leaf } from 'lucide-react';

// Dynamically resolve official logo from client/src/assets/logo.png without breaking compilation when missing
const assetMap = import.meta.glob('../assets/logo.png', { eager: true, import: 'default' });
const logoImg = assetMap['../assets/logo.png'] || null;

const Logo = ({ size = 'medium', className = '', style = {} }) => {
  const [hasError, setHasError] = useState(false);

  // Responsive sizing configurations to preserve original aspect ratio, colors, and quality
  const dimensions = {
    small: { height: '36px', maxWidth: '140px', iconSize: 26 },      // For Navbar and Footer
    medium: { height: '72px', maxWidth: '220px', iconSize: 48 },     // For Login/Welcome & Admin Auth Screen
    large: { height: '160px', maxWidth: '90vw', iconSize: 80 },      // For Welcome Page (large centered logo)
    circular: { height: '100%', maxWidth: '100%', iconSize: 48 }     // For Circular Badge
  }[size] || { height: '50px', maxWidth: '160px', iconSize: 32 };

  // Fallback to simple leaf icon if logo.png is temporarily missing or failed to load
  if (!logoImg || hasError) {
    return (
      <div 
        className={`logo-fallback-leaf ${className}`} 
        style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          color: '#059669', 
          padding: '0.25rem',
          borderRadius: size === 'circular' ? '50%' : 'var(--radius-md)',
          ...style 
        }}
        title="Official Grow Green, Live Long Logo Placeholder"
      >
        <Leaf size={dimensions.iconSize} />
      </div>
    );
  }

  const imgElement = (
    <img
      src={logoImg}
      alt="Grow Green, Live Long Official Logo"
      className={`project-official-logo ${className}`}
      style={{
        height: dimensions.height,
        width: size === 'circular' ? '100%' : 'auto',
        maxWidth: dimensions.maxWidth,
        objectFit: 'contain',
        display: 'block',
        transition: 'all 0.3s ease',
        borderRadius: size === 'circular' ? '50%' : '0',
        ...style
      }}
      onError={() => setHasError(true)}
    />
  );

  if (size === 'circular') {
    return (
      <div className={`logo-circular-wrapper ${className}`}>
        {imgElement}
      </div>
    );
  }

  return imgElement;
};

export default Logo;
