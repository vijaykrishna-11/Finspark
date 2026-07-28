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
    const appContainer = document.getElementById('app-container');

    const VOICE_LANGUAGE_MAP = {
        en: 'en-IN',
        hi: 'hi-IN',
        ta: 'ta-IN',
        kn: 'kn-IN',
        te: 'te-IN',
        ml: 'ml-IN'
    };

    const LANGUAGE_NAME_HINTS = {
        en: ['english'],
        hi: ['hindi'],
        ta: ['tamil'],
        kn: ['kannada'],
        te: ['telugu'],
        ml: ['malayalam']
    };

    let activeVoiceAppId = null;
    let activeUtterance = null;
    let availableVoices = [];
    let voicesReadyPromise = null;
    let recentlyHandledByPointerDown = false;

    function refreshVoices() {
        if (!('speechSynthesis' in window)) {
            availableVoices = [];
            return;
        }

        availableVoices = window.speechSynthesis.getVoices() || [];
    }

    function waitForVoices() {
        if (!('speechSynthesis' in window)) {
            return Promise.resolve([]);
        }

        refreshVoices();
        if (availableVoices.length) {
            return Promise.resolve(availableVoices);
        }

        if (voicesReadyPromise) {
            return voicesReadyPromise;
        }

        voicesReadyPromise = new Promise((resolve) => {
            let settled = false;

            const complete = () => {
                if (settled) {
                    return;
                }

                settled = true;
                refreshVoices();
                resolve(availableVoices);
            };

            const handleVoicesChanged = () => {
                complete();
            };

            window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged, { once: true });
            setTimeout(complete, 900);
        }).finally(() => {
            voicesReadyPromise = null;
        });

        return voicesReadyPromise;
    }

    function hasVoiceForLanguage(languageCode) {
        if (!availableVoices.length) {
            return false;
        }

        const exactLocale = VOICE_LANGUAGE_MAP[languageCode] || 'en-IN';
        const baseLanguage = exactLocale.split('-')[0].toLowerCase();
        const hints = LANGUAGE_NAME_HINTS[languageCode] || [];

        return availableVoices.some((voice) => {
            const lang = (voice.lang || '').toLowerCase();
            const name = (voice.name || '').toLowerCase();
            return lang === exactLocale.toLowerCase() ||
                   lang.startsWith(`${baseLanguage}-`) ||
                   lang === baseLanguage ||
                   hints.some((hint) => name.includes(hint));
        });
    }

    function getPreferredVoice(languageCode) {
        if (!availableVoices.length) {
            return null;
        }

        const exactLocale = VOICE_LANGUAGE_MAP[languageCode] || 'en-IN';
        const baseLanguage = exactLocale.split('-')[0].toLowerCase();

        const exactMatch = availableVoices.find((voice) => (voice.lang || '').toLowerCase() === exactLocale.toLowerCase());
        if (exactMatch) {
            return exactMatch;
        }

        const baseMatch = availableVoices.find((voice) => (voice.lang || '').toLowerCase().startsWith(`${baseLanguage}-`) || (voice.lang || '').toLowerCase() === baseLanguage);
        if (baseMatch) {
            return baseMatch;
        }

        const hints = LANGUAGE_NAME_HINTS[languageCode] || [];
        const hintMatch = availableVoices.find((voice) => {
            const name = (voice.name || '').toLowerCase();
            return hints.some((hint) => name.includes(hint));
        });
        if (hintMatch) {
            return hintMatch;
        }

        return availableVoices.find((voice) => voice.default) || availableVoices[0] || null;
    }

    function getEnglishVoice() {
        return availableVoices.find((voice) => {
            const lang = (voice.lang || '').toLowerCase();
            return lang.startsWith('en-') || lang === 'en';
        }) || availableVoices[0] || null;
    }

    function getVoiceStatusElement(appId) {
        return document.querySelector(`[data-voice-status-for="${appId}"]`);
    }

    function setVoiceStatus(appId, message) {
        if (!appId) {
            return;
        }

        const statusElement = getVoiceStatusElement(appId);
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    function clearVoiceStatuses() {
        document.querySelectorAll('[data-voice-status-for]').forEach((statusElement) => {
            statusElement.textContent = '';
        });
    }

    function stopVoicePlayback(updateStatus = true, appIdOverride = null) {
        if (activeUtterance) {
            activeUtterance.wasCancelledByUser = true;
        }

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }

        const targetAppId = appIdOverride || activeVoiceAppId;
        if (updateStatus && targetAppId) {
            setVoiceStatus(targetAppId, I18n.t('ui.voiceStopped'));
        }

        activeUtterance = null;
        activeVoiceAppId = null;
    }

    function buildVoiceNarration(appId) {
        const appTranslation = I18n.getAppTranslation(appId);
        if (!appTranslation) {
            return '';
        }

        const steps = (appTranslation.howToUse || []).map((stepText, index) => `${index + 1}. ${stepText}`).join(' ');
        return `${appTranslation.name}. ${appTranslation.use}. ${I18n.t('ui.howToUse')}. ${steps}`;
    }

    function buildEnglishNarration(appId) {
        // Build narration using English translations for voice fallback
        const appTranslation = I18n.getEnglishAppTranslation(appId);
        if (!appTranslation) {
            return '';
        }

        const howToUseLabel = I18n.getEnglishText('ui.howToUse');
        const steps = (appTranslation.howToUse || []).map((stepText, index) => `${index + 1}. ${stepText}`).join(' ');
        return `${appTranslation.name}. ${appTranslation.use}. ${howToUseLabel}. ${steps}`;
    }

    async function speakAppGuide(appId) {
        if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
            setVoiceStatus(appId, I18n.t('ui.voiceNotSupported'));
            return;
        }

        const narration = buildVoiceNarration(appId);
        if (!narration) {
            setVoiceStatus(appId, I18n.t('ui.voiceError'));
            return;
        }

        stopVoicePlayback(false);
        clearVoiceStatuses();

        // Set activeVoiceAppId early so Stop button works during setup
        activeVoiceAppId = appId;

        const language = I18n.getCurrentLanguage();
        await waitForVoices();

        const hasNativeVoice = hasVoiceForLanguage(language);
        let selectedVoice;
        let usingFallback = false;

        if (hasNativeVoice) {
            selectedVoice = getPreferredVoice(language);
        } else {
            selectedVoice = getEnglishVoice();
            usingFallback = true;
        }

        if (!selectedVoice) {
            setVoiceStatus(appId, I18n.t('ui.voiceNotSupported'));
            return;
        }

        // If using English fallback, we need to speak English content
        // because English voice cannot pronounce Indian scripts
        let textToSpeak = narration;
        if (usingFallback && language !== 'en') {
            setVoiceStatus(appId, I18n.t('ui.voiceLanguageUnavailable'));
            textToSpeak = buildEnglishNarration(appId);
            await new Promise((resolve) => setTimeout(resolve, 1500));
        }

        if (!textToSpeak) {
            setVoiceStatus(appId, I18n.t('ui.voiceError'));
            return;
        }

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = selectedVoice.lang || VOICE_LANGUAGE_MAP[language] || 'en-IN';
        utterance.voice = selectedVoice;
        utterance.rate = 0.95;
        utterance.pitch = 1;

        activeVoiceAppId = appId;
        activeUtterance = utterance;

        utterance.onstart = () => {
            setVoiceStatus(appId, I18n.t('ui.voiceSpeaking'));
        };

        utterance.onend = () => {
            if (!utterance.wasCancelledByUser) {
                setVoiceStatus(appId, I18n.t('ui.voiceDone'));
            }
            activeUtterance = null;
            activeVoiceAppId = null;
        };

        utterance.onerror = () => {
            if (utterance.wasCancelledByUser) {
                activeUtterance = null;
                return;
            }
            setVoiceStatus(appId, I18n.t('ui.voiceError'));
            activeUtterance = null;
            activeVoiceAppId = null;
        };

        window.speechSynthesis.speak(utterance);
    }

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

        stopVoicePlayback(false);
        clearVoiceStatuses();

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

    function isPrimaryPointerActivation(event) {
        if (event.pointerType === 'mouse') {
            return event.button === 0;
        }

        return true;
    }

    function handleLanguageTogglePointerDown(event) {
        if (!isPrimaryPointerActivation(event)) {
            return;
        }

        event.preventDefault();
        recentlyHandledByPointerDown = true;
        setTimeout(() => { recentlyHandledByPointerDown = false; }, 300);
        toggleLanguageMenu();
    }

    function handleLanguageToggleClick(event) {
        if (recentlyHandledByPointerDown) {
            return;
        }

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
        if (!isPrimaryPointerActivation(event)) {
            return;
        }

        event.preventDefault();
        recentlyHandledByPointerDown = true;
        setTimeout(() => { recentlyHandledByPointerDown = false; }, 300);
        const language = event.currentTarget.dataset.language;
        changeLanguage(language);
    }

    function handleLanguageOptionClick(event) {
        if (recentlyHandledByPointerDown) {
            return;
        }

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

    function handleDocumentClick(event) {
        if (languageSwitcher && !languageSwitcher.contains(event.target)) {
            closeLanguageMenu();
        }
    }

    function handleDocumentKeydown(event) {
        if (event.key === 'Escape') {
            closeLanguageMenu();
        }
    }

    function handleVoiceControlPointerDown(event) {
        const button = event.target.closest('[data-voice-action][data-app-id]');
        if (!button) {
            return;
        }

        if (!isPrimaryPointerActivation(event)) {
            return;
        }

        event.preventDefault();

        const appId = button.dataset.appId;
        const action = button.dataset.voiceAction;

        if (!appId || !action) {
            return;
        }

        if (action === 'listen') {
            speakAppGuide(appId).catch(() => {
                setVoiceStatus(appId, I18n.t('ui.voiceError'));
            });
            return;
        }

        if (action === 'stop') {
            stopVoicePlayback(true, appId);
        }
    }

    function handleVoiceControlClick(event) {
        if (event.defaultPrevented) {
            return;
        }

        const button = event.target.closest('[data-voice-action][data-app-id]');
        if (!button) {
            return;
        }

        if (event.button !== undefined && event.button !== 0) {
            return;
        }

        event.preventDefault();

        const appId = button.dataset.appId;
        const action = button.dataset.voiceAction;

        if (!appId || !action) {
            return;
        }

        if (action === 'listen') {
            speakAppGuide(appId).catch(() => {
                setVoiceStatus(appId, I18n.t('ui.voiceError'));
            });
            return;
        }

        if (action === 'stop') {
            stopVoicePlayback(true, appId);
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
                languageToggle.addEventListener('click', handleLanguageToggleClick);
                languageToggle.addEventListener('keydown', handleLanguageToggleKeydown);
            }

            languageOptions.forEach((option) => {
                option.addEventListener('pointerdown', handleLanguageOptionPointerDown);
                option.addEventListener('click', handleLanguageOptionClick);
                option.addEventListener('keydown', handleLanguageOptionKeydown);
            });

            if (languageSwitcher) {
                document.addEventListener('pointerdown', handleDocumentPointerDown);
                document.addEventListener('click', handleDocumentClick);
                document.addEventListener('keydown', handleDocumentKeydown);
            }

            if (appContainer) {
                appContainer.addEventListener('pointerdown', handleVoiceControlPointerDown);
                appContainer.addEventListener('click', handleVoiceControlClick);
            }

            // Listen for language change events
            window.addEventListener('languageChanged', handleLanguageChanged);

            if ('speechSynthesis' in window) {
                refreshVoices();
                window.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
            }

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