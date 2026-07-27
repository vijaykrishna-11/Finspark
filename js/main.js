/**
 * FinSpark - Main Application Entry Point
 * 
 * Initializes the application:
 * - Sets up language switcher
 * - Initializes i18n
 * - Renders initial content
 * - Handles language change events
 */

(function() {
    'use strict';

    // ============================================
    // DOM Elements
    // ============================================
    const languageSwitcher = document.querySelector('.language-switcher');
    const languageToggle = document.getElementById('language-toggle');
    const languageMenu = document.getElementById('language-menu');
    const languageCurrent = document.getElementById('language-current');
    const languageOptions = Array.from(document.querySelectorAll('[data-language-option]'));

    function showLoadingState() {
        const container = document.getElementById('app-container');
        if (container) {
            container.innerHTML = `
                <div class="loading" aria-live="polite">
                    <div class="loading-spinner"></div>
                    <p data-i18n="ui.loading">Loading...</p>
                </div>
            `;
        }
    }

    function setActiveLanguageOption(language) {
        let activeLabel = '';

        languageOptions.forEach((option) => {
            const isActive = option.dataset.language === language;
            option.classList.toggle('language-option--active', isActive);
            option.setAttribute('aria-selected', String(isActive));
            option.tabIndex = isActive ? 0 : -1;

            if (isActive) {
                activeLabel = option.textContent.trim();
            }
        });

        if (languageCurrent && activeLabel) {
            languageCurrent.textContent = activeLabel;
        }
    }

    function closeLanguageMenu(restoreFocus = false) {
        if (!languageMenu || !languageSwitcher || languageMenu.hidden) {
            return;
        }

        languageMenu.hidden = true;
        languageSwitcher.classList.remove('is-open');

        if (languageToggle) {
            languageToggle.setAttribute('aria-expanded', 'false');
            if (restoreFocus) {
                languageToggle.focus();
            }
        }
    }

    function openLanguageMenu(shouldFocusActiveOption = false) {
        if (!languageMenu || !languageSwitcher || !languageToggle) {
            return;
        }

        languageMenu.hidden = false;
        languageSwitcher.classList.add('is-open');
        languageToggle.setAttribute('aria-expanded', 'true');

        const activeOption = languageOptions.find((option) => option.classList.contains('language-option--active')) || languageOptions[0];
        if (shouldFocusActiveOption && activeOption) {
            activeOption.focus();
        }
    }

    function focusLanguageOption(index) {
        if (!languageOptions.length) {
            return;
        }

        const nextIndex = (index + languageOptions.length) % languageOptions.length;
        languageOptions[nextIndex].focus();
    }

    // ============================================
    // Event Handlers
    // ============================================

    /**
     * Change the active language
     * @param {string} language - Language code
     */
    async function changeLanguage(language) {
        if (!language || language === I18n.getCurrentLanguage()) {
            closeLanguageMenu(true);
            return;
        }

        closeLanguageMenu(true);
        showLoadingState();

        try {
            await I18n.setLanguage(language);
            Render.refresh();
        } catch (error) {
            console.error('Failed to change language:', error);
            Render.refresh();
        }
    }

    function toggleLanguageMenu() {
        if (!languageMenu) {
            return;
        }

        if (languageMenu.hidden) {
            openLanguageMenu();
        } else {
            closeLanguageMenu(true);
        }
    }

    function handleLanguageTogglePointerDown(event) {
        if (event.button !== undefined && event.button !== 0) {
            return;
        }

        event.preventDefault();
        toggleLanguageMenu();
    }

    function handleLanguageToggleKeydown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleLanguageMenu();
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            closeLanguageMenu(true);
            return;
        }

        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            openLanguageMenu(true);

            if (event.key === 'ArrowUp') {
                focusLanguageOption(languageOptions.length - 1);
            }
        }
    }

    function handleLanguageOptionPointerDown(event) {
        if (event.button !== undefined && event.button !== 0) {
            return;
        }

        event.preventDefault();
        const language = event.currentTarget.dataset.language;
        changeLanguage(language);
    }

    function handleLanguageOptionKeydown(event) {
        const currentIndex = languageOptions.indexOf(event.currentTarget);

        if (event.key === 'Escape') {
            event.preventDefault();
            closeLanguageMenu(true);
            return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            const language = event.currentTarget.dataset.language;
            changeLanguage(language);
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            focusLanguageOption(currentIndex + 1);
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            focusLanguageOption(currentIndex - 1);
            return;
        }

        if (event.key === 'Home') {
            event.preventDefault();
            focusLanguageOption(0);
            return;
        }

        if (event.key === 'End') {
            event.preventDefault();
            focusLanguageOption(languageOptions.length - 1);
        }
    }

    function handleDocumentPointerDown(event) {
        if (languageSwitcher && !languageSwitcher.contains(event.target)) {
            closeLanguageMenu();
        }
    }

    function handleDocumentKeydown(event) {
        if (event.key === 'Escape') {
            closeLanguageMenu();
        }
    }

    /**
     * Handle language changed event (dispatched by I18n)
     * @param {CustomEvent} event - Language changed event
     */
    function handleLanguageChanged(event) {
        const { language } = event.detail;
        setActiveLanguageOption(language);
    }

    // ============================================
    // Initialization
    // ============================================

    /**
     * Initialize the application
     */
    async function init() {
        console.log('🚀 FinSpark - Initializing...');

        try {
            // Initialize i18n (loads saved/detected language)
            const initialLanguage = await I18n.init();
            console.log(`🌐 Language initialized: ${initialLanguage}`);
            
            setActiveLanguageOption(initialLanguage);

            if (languageToggle) {
                languageToggle.addEventListener('pointerdown', handleLanguageTogglePointerDown);
                languageToggle.addEventListener('keydown', handleLanguageToggleKeydown);
            }

            languageOptions.forEach((option) => {
                option.addEventListener('pointerdown', handleLanguageOptionPointerDown);
                option.addEventListener('keydown', handleLanguageOptionKeydown);
            });

            if (languageSwitcher) {
                document.addEventListener('pointerdown', handleDocumentPointerDown);
                document.addEventListener('keydown', handleDocumentKeydown);
            }

            // Listen for language change events
            window.addEventListener('languageChanged', handleLanguageChanged);

            // Initial render
            Render.render();
            
            // Initialize Lucide icons for header
            if (typeof lucide !== 'undefined' && lucide.createIcons) {
                lucide.createIcons();
            }

            console.log('✅ FinSpark - Ready!');

        } catch (error) {
            console.error('❌ FinSpark - Initialization failed:', error);
            
            // Show error message
            const container = document.getElementById('app-container');
            if (container) {
                container.innerHTML = `
                    <div class="loading" role="alert">
                        <p style="color: #dc2626;">Failed to load content. Please refresh the page.</p>
                        <p style="font-size: 0.875rem; color: #71717a; margin-top: 0.5rem;">
                            If running locally, ensure you're using a static server (not file://).
                        </p>
                    </div>
                `;
            }
        }
    }

    // ============================================
    // Start Application
    // ============================================

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM already loaded
        init();
    }

})();