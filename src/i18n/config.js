import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';
import frTranslations from './locales/fr.json';

// Language detection configuration
const detectionOptions = {
  // Order of detection methods
  order: ['localStorage', 'navigator', 'htmlTag'],
  
  // Keys to lookup language from
  lookupLocalStorage: 'i18nextLng',
  
  // Cache user language
  caches: ['localStorage'],
  
  // Don't cache if language is not found
  excludeCacheFor: ['cimode'],
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations,
      },
      es: {
        translation: esTranslations,
      },
      fr: {
        translation: frTranslations,
      },
    },
    fallbackLng: 'en',
    debug: import.meta.env.MODE === 'development',
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    detection: detectionOptions,
    
    // React-specific options
    react: {
      useSuspense: false, // Disable suspense for better compatibility
    },
    
    // Ensure i18n is ready before components use it
    initImmediate: true,
  });

export default i18n;

