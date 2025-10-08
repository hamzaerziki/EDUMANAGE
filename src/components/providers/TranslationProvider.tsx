import React, { useState, useEffect } from 'react';
import { TranslationContext } from '@/hooks/useTranslation';
import { Language, getTranslation } from '@/lib/translations';
import { useTranslation } from 'react-i18next';

interface TranslationProviderProps {
  children: React.ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved as Language) || 'fr';
  });

  useEffect(() => {
    localStorage.setItem('app-language', language);
    i18n.changeLanguage(language);
    
    // Keep app LTR always; only change language attribute and font for Arabic
    document.dir = 'ltr';
    document.documentElement.lang = language === 'ar' ? 'ar' : language;
    if (language === 'ar') {
      document.documentElement.style.fontFamily = "'Noto Sans Arabic', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif";
    } else {
      document.documentElement.style.fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif";
    }
    
    // Notify listeners
    const event = new CustomEvent('languageChanged', { detail: { language } });
    window.dispatchEvent(event);
  }, [language, i18n]);

  const value = {
    language,
    setLanguage,
    t: getTranslation(language),
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};