/**
 * Language Tags Utility
 * Helper functions for managing professional language tags
 */

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
];

/**
 * Get language name by code
 */
export function getLanguageName(code) {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
  return lang ? lang.name : code;
}

/**
 * Get language flag by code
 */
export function getLanguageFlag(code) {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
  return lang ? lang.flag : '🌐';
}

/**
 * Format languages array for display
 */
export function formatLanguages(languages) {
  if (!languages || !Array.isArray(languages) || languages.length === 0) {
    return [];
  }
  
  return languages.map(code => ({
    code,
    name: getLanguageName(code),
    flag: getLanguageFlag(code),
  }));
}


