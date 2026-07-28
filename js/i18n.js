/**
 * FinSpark - Internationalization (i18n) Module
 * 
 * Handles language switching, locale loading, and text translation.
 * - Fetches locale JSON files
 * - Applies translations via data-i18n attributes
 * - Saves language preference to localStorage
 * - Falls back to English for missing keys
 */

const I18n = (function() {
    'use strict';

    // ============================================
    // Configuration
    // ============================================
    const SUPPORTED_LANGUAGES = ['en', 'ta', 'kn', 'te', 'ml', 'hi'];
    const DEFAULT_LANGUAGE = 'en';
    const STORAGE_KEY = 'finspark-language';
    const LOCALES_PATH = 'locales';

    // ============================================
    // State
    // ============================================
    let currentLanguage = DEFAULT_LANGUAGE;
    let translations = {};
    let fallbackTranslations = {}; // English fallback

    // ============================================
    // Private Methods
    // ============================================

    /**
     * Detect browser's preferred language
     * @returns {string} Language code
     */
    function detectBrowserLanguage() {
        const browserLang = navigator.language || navigator.userLanguage;
        const langCode = browserLang.split('-')[0].toLowerCase();
        return SUPPORTED_LANGUAGES.includes(langCode) ? langCode : DEFAULT_LANGUAGE;
    }

    /**
     * Get saved language from localStorage
     * @returns {string|null} Language code or null
     */
    function getSavedLanguage() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved && SUPPORTED_LANGUAGES.includes(saved) ? saved : null;
        } catch (e) {
            // localStorage might be blocked
            console.warn('Could not access localStorage:', e);
            return null;
        }
    }

    /**
     * Save language preference to localStorage
     * @param {string} lang - Language code
     */
    function saveLanguage(lang) {
        try {
            localStorage.setItem(STORAGE_KEY, lang);
        } catch (e) {
            console.warn('Could not save to localStorage:', e);
        }
    }

    /**
     * Fetch locale JSON file
     * @param {string} lang - Language code
     * @returns {Promise<Object>} Translations object
     */
    async function fetchLocale(lang) {
        const cacheBuster = '20260728-3';
        const url = `${LOCALES_PATH}/${lang}.json?v=${cacheBuster}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Failed to load locale "${lang}":`, error);
            throw error;
        }
    }

    /**
     * Get nested value from object using dot notation
     * @param {Object} obj - Source object
     * @param {string} path - Dot-separated path (e.g., "site.title")
     * @returns {*} Value at path or undefined
     */
    function getNestedValue(obj, path) {
        if (!obj || !path) return undefined;
        
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    /**
     * Translate a key using current translations with English fallback
     * @param {string} key - Translation key (dot notation)
     * @returns {string} Translated text or key if not found
     */
    function translate(key) {
        // Try current language first
        let value = getNestedValue(translations, key);
        
        // Fallback to English
        if (value === undefined && currentLanguage !== DEFAULT_LANGUAGE) {
            value = getNestedValue(fallbackTranslations, key);
        }
        
        // Return key if nothing found (for debugging)
        return value !== undefined ? value : key;
    }

    /**
     * Apply translations to all elements with data-i18n attribute
     */
    function applyTranslations() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translated = translate(key);
            
            // Update text content
            element.textContent = translated;
            
            // Update aria-label if element has one
            if (element.hasAttribute('aria-label')) {
                element.setAttribute('aria-label', translated);
            }
        });

        // Update document title
        const titleKey = 'site.title';
        const titleValue = translate(titleKey);
        if (titleValue !== titleKey) {
            document.title = titleValue;
        }

        // Update html lang attribute
        document.documentElement.lang = currentLanguage;
    }

    /**
     * Load English fallback translations
     */
    async function loadFallback() {
        if (Object.keys(fallbackTranslations).length === 0) {
            try {
                fallbackTranslations = await fetchLocale(DEFAULT_LANGUAGE);
            } catch (error) {
                console.error('Failed to load fallback translations');
            }
        }
    }

    // ============================================
    // Public API
    // ============================================

    return {
        /**
         * Get current language code
         * @returns {string} Current language code
         */
        getCurrentLanguage() {
            return currentLanguage;
        },

        /**
         * Get list of supported languages
         * @returns {string[]} Array of language codes
         */
        getSupportedLanguages() {
            return [...SUPPORTED_LANGUAGES];
        },

        /**
         * Get current translations object
         * @returns {Object} Translations
         */
        getTranslations() {
            return translations;
        },

        /**
         * Translate a single key
         * @param {string} key - Translation key (dot notation)
         * @returns {string} Translated text
         */
        t(key) {
            return translate(key);
        },

        /**
         * Get app-specific translations
         * @param {string} appId - App ID
         * @returns {Object|undefined} App translations
         */
        getAppTranslation(appId) {
            const appTranslations = getNestedValue(translations, `apps.${appId}`);
            if (appTranslations) return appTranslations;
            
            // Fallback to English
            return getNestedValue(fallbackTranslations, `apps.${appId}`);
        },

        /**
         * Get English app translation (for voice fallback)
         * @param {string} appId - App ID
         * @returns {Object|undefined} English app translations
         */
        getEnglishAppTranslation(appId) {
            return getNestedValue(fallbackTranslations, `apps.${appId}`);
        },

        /**
         * Get English UI string (for voice fallback)
         * @param {string} key - Translation key
         * @returns {string} English text
         */
        getEnglishText(key) {
            const value = getNestedValue(fallbackTranslations, key);
            return value !== undefined ? value : key;
        },

        /**
         * Initialize i18n with saved/detected language
         * @returns {Promise<string>} Resolved language code
         */
        async init() {
            // Load English fallback first
            await loadFallback();

            // Determine initial language
            const saved = getSavedLanguage();
            const detected = detectBrowserLanguage();
            currentLanguage = saved || detected;

            // Load selected language
            await this.setLanguage(currentLanguage);
            
            return currentLanguage;
        },

        /**
         * Set language and apply translations
         * @param {string} lang - Language code
         * @returns {Promise<void>}
         */
        async setLanguage(lang) {
            if (!SUPPORTED_LANGUAGES.includes(lang)) {
                console.warn(`Unsupported language: ${lang}, falling back to ${DEFAULT_LANGUAGE}`);
                lang = DEFAULT_LANGUAGE;
            }

            try {
                // Load new translations
                translations = await fetchLocale(lang);
                currentLanguage = lang;
                
                // Save preference
                saveLanguage(lang);
                
                // Apply to static elements
                applyTranslations();
                
                // Dispatch event for dynamic content
                window.dispatchEvent(new CustomEvent('languageChanged', { 
                    detail: { language: lang, translations } 
                }));

            } catch (error) {
                // Fallback to English if loading fails
                if (lang !== DEFAULT_LANGUAGE) {
                    console.warn(`Falling back to ${DEFAULT_LANGUAGE}`);
                    await this.setLanguage(DEFAULT_LANGUAGE);
                } else {
                    throw error;
                }
            }
        },

        /**
         * Re-apply translations (useful after dynamic content updates)
         */
        refresh() {
            applyTranslations();
        }
    };
})();

// Export for global access
if (typeof window !== 'undefined') {
    window.I18n = I18n;
}