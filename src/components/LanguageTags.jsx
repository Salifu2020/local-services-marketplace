import React, { useState } from 'react';
import { SUPPORTED_LANGUAGES, formatLanguages } from '../utils/languageTags';
import { useTranslation } from 'react-i18next';

/**
 * Language Tags Component
 * Displays languages that a professional speaks
 */
function LanguageTags({ languages = [], editable = false, onChange = null }) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState(languages || []);

  const handleLanguageToggle = (langCode) => {
    if (!editable) return;

    const newLanguages = selectedLanguages.includes(langCode)
      ? selectedLanguages.filter(l => l !== langCode)
      : [...selectedLanguages, langCode];
    
    setSelectedLanguages(newLanguages);
    if (onChange) {
      onChange(newLanguages);
    }
  };

  const formattedLanguages = formatLanguages(selectedLanguages);

  if (editable) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            {t('professional.languages')}
          </label>
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {isEditing ? t('common.save') : t('common.edit')}
          </button>
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageToggle(lang.code)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 transition-colors ${
                    selectedLanguages.includes(lang.code)
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span className="text-sm font-medium">{lang.name}</span>
                  {selectedLanguages.includes(lang.code) && (
                    <span className="text-blue-600">✓</span>
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              {t('professional.speaks')}: {formattedLanguages.map(l => l.name).join(', ')}
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {formattedLanguages.length > 0 ? (
              formattedLanguages.map((lang) => (
                <span
                  key={lang.code}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm"
                >
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-500">{t('professional.languages')}: {t('common.none')}</span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Display only mode
  if (formattedLanguages.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {formattedLanguages.map((lang) => (
        <span
          key={lang.code}
          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-sm border border-blue-200"
          title={t('professional.speaks') + ' ' + lang.name}
        >
          <span>{lang.flag}</span>
          <span>{lang.name}</span>
        </span>
      ))}
    </div>
  );
}

export default LanguageTags;

