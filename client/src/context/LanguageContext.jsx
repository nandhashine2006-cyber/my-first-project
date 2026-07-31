import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../translations/translations';

const LanguageContext = createContext();

export const supportedLanguages = [
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
];

export const LanguageProvider = ({ children }) => {
  // Initialize language from localStorage or default to English
  const [language, setLanguage] = useState(() => {
    const savedLang = localStorage.getItem('grow_green_lang');
    return savedLang && translations[savedLang] ? savedLang : 'en';
  });

  // Keep language in sync with localStorage after refreshes
  useEffect(() => {
    localStorage.setItem('grow_green_lang', language);
    document.documentElement.lang = language;
  }, [language]);

  const changeLanguage = (newLang) => {
    if (translations[newLang]) {
      setLanguage(newLang);
    }
  };

  // Translation lookup helper function
  const t = (key) => {
    if (translations[language] && translations[language][key] !== undefined) {
      return translations[language][key];
    }
    if (translations['en'] && translations['en'][key] !== undefined) {
      return translations['en'][key];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, supportedLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
