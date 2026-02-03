const fs = require('fs');
const path = require('path');

// Load translation files
const translations = {
  en: require('../locales/en.json'),
  el: require('../locales/el.json'),
};

/**
 * Get translation for a key based on language
 * @param {string} key - Translation key (e.g., 'auth.invalidCredentials')
 * @param {string} lang - Language code ('en' or 'el')
 * @param {object} params - Optional parameters for string interpolation
 * @returns {string} - Translated string
 */
function t(key, lang = 'en', params = {}) {
  // Default to English if language not supported
  const locale = translations[lang] || translations.en;
  
  // Split key by dots to navigate nested object
  const keys = key.split('.');
  let value = locale;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback to English if key not found
      value = translations.en;
      for (const fallbackKey of keys) {
        if (value && typeof value === 'object' && fallbackKey in value) {
          value = value[fallbackKey];
        } else {
          return key; // Return key itself if not found
        }
      }
      break;
    }
  }
  
  // Handle string interpolation
  if (typeof value === 'string' && params) {
    Object.keys(params).forEach(param => {
      value = value.replace(`{${param}}`, params[param]);
    });
  }
  
  return value;
}

/**
 * Middleware to extract language from request headers
 */
function languageMiddleware(req, res, next) {
  // Get language from Accept-Language header
  const acceptLanguage = req.headers['accept-language'];
  
  // Extract language code (en, el, etc.)
  let lang = 'en'; // default
  if (acceptLanguage) {
    // Accept-Language can be like "en-US,en;q=0.9" or just "en" or "el"
    const primaryLang = acceptLanguage.split(',')[0].split('-')[0].toLowerCase();
    if (translations[primaryLang]) {
      lang = primaryLang;
    }
  }
  
  // Attach language and translation function to request
  req.lang = lang;
  req.t = (key, params) => t(key, lang, params);
  
  next();
}

module.exports = {
  t,
  languageMiddleware,
};
