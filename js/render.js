/**
 * FinSpark - Render Module
 * 
 * Dynamically builds category sections and app cards from:
 * - APPS array (js/apps.js)
 * - Active locale translations (via I18n module)
 */

const Render = (function() {
    'use strict';

    // ============================================
    // Configuration
    // ============================================
    const CONTAINER_ID = 'app-container';

    // ============================================
    // Private Methods
    // ============================================

    /**
     * Group apps by category
     * @param {Array} apps - Array of app objects
     * @returns {Object} Apps grouped by category
     */
    function groupByCategory(apps) {
        return apps.reduce((groups, app) => {
            const category = app.category;
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(app);
            return groups;
        }, {});
    }

    /**
     * Create Lucide icon element
     * @param {string} iconName - Lucide icon name
     * @param {string} className - Optional CSS class
     * @returns {string} Icon HTML string
     */
    function createIcon(iconName, className = '') {
        return `<i data-lucide="${iconName}" class="${className}" aria-hidden="true"></i>`;
    }

    /**
     * Create a single step element
     * @param {number} stepIndex - Step index (0-based)
     * @param {string} stepText - Step text
     * @param {string} iconName - Lucide icon name
     * @returns {string} Step HTML string
     */
    function createStepElement(stepIndex, stepText, iconName) {
        return `
            <div class="step" role="listitem">
                <div class="step-marker">
                    <span class="step-number" aria-label="Step ${stepIndex + 1}">${stepIndex + 1}</span>
                    <span class="step-icon">${createIcon(iconName)}</span>
                </div>
                <p class="step-text">${escapeHtml(stepText)}</p>
            </div>
        `;
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Raw text
     * @returns {string} Escaped text
     */
    function escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Create quick navigation menu for category sections
     * @param {string[]} categories - Sorted category keys
     * @returns {string} Navigation HTML string
     */
    function createCategoryMenu(categories) {
        const linksHtml = categories.map((category) => {
            const categoryConfig = window.CATEGORIES[category];
            const categoryTitle = I18n.t(`categories.${category}`);

            return `
                <a class="section-menu-link" href="#category-${category}">
                    <span class="section-menu-icon category-icon--${category}" aria-hidden="true">
                        ${createIcon(categoryConfig.icon)}
                    </span>
                    <span class="section-menu-text">${escapeHtml(categoryTitle)}</span>
                </a>
            `;
        }).join('');

        return `
            <nav class="section-menu">
                <div class="section-menu-links">
                    ${linksHtml}
                </div>
            </nav>
        `;
    }

    /**
     * Create app card HTML
     * @param {Object} app - App object from APPS array
     * @param {Object} appTranslation - Translated app content
     * @returns {string} App card HTML string
     */
    function createAppCard(app, appTranslation) {
        if (!appTranslation) {
            console.warn(`Missing translation for app: ${app.id}`);
            return '';
        }

        const { name, use, howToUse } = appTranslation;
        const stepIcons = window.STEP_ICONS[app.id] || [];
        
        // Generate steps HTML
        const stepsHtml = (howToUse || []).map((stepText, index) => {
            const iconName = stepIcons[index] || 'circle';
            return createStepElement(index, stepText, iconName);
        }).join('');

        // Generate download button if link exists
        const downloadHtml = app.link ? `
            <a href="${escapeHtml(app.link)}" 
               target="_blank" 
               rel="noopener noreferrer" 
               class="app-download"
               aria-label="${I18n.t('ui.download')} ${escapeHtml(name)}">
                ${createIcon('external-link')}
                <span>${I18n.t('ui.download')}</span>
            </a>
        ` : '';

        return `
            <article class="app-card" aria-labelledby="app-${app.id}-title">
                <header class="app-card-header">
                    <div class="app-icon" aria-hidden="true">
                        ${createIcon(app.icon)}
                    </div>
                    <h3 class="app-name" id="app-${app.id}-title">${escapeHtml(name)}</h3>
                </header>
                
                <div class="app-description">
                    <p class="app-use-label">${I18n.t('ui.whatIsItFor')}</p>
                    <p class="app-use-text">${escapeHtml(use)}</p>
                </div>
                
                <div class="how-to-use">
                    <p class="how-to-use-label">
                        ${createIcon('list-ordered')}
                        ${I18n.t('ui.howToUse')}
                    </p>
                    <div class="steps-container" role="list" aria-label="${I18n.t('ui.steps')}">
                        ${stepsHtml}
                    </div>
                </div>
                
                ${downloadHtml}
            </article>
        `;
    }

    /**
     * Create category section HTML
     * @param {string} category - Category key
     * @param {Array} apps - Apps in this category
     * @returns {string} Category section HTML string
     */
    function createCategorySection(category, apps) {
        const categoryConfig = window.CATEGORIES[category];
        const categoryTitle = I18n.t(`categories.${category}`);
        
        // Generate app cards
        const cardsHtml = apps.map(app => {
            const appTranslation = I18n.getAppTranslation(app.id);
            return createAppCard(app, appTranslation);
        }).join('');

        return `
            <section class="category-section" id="category-${category}" aria-labelledby="category-${category}-title">
                <header class="category-header category-header--${category}">
                    <div class="category-icon category-icon--${category}">
                        ${createIcon(categoryConfig.icon)}
                    </div>
                    <h2 class="category-title" id="category-${category}-title">${escapeHtml(categoryTitle)}</h2>
                </header>
                <div class="app-grid">
                    ${cardsHtml}
                </div>
            </section>
        `;
    }

    /**
     * Initialize Lucide icons in container
     */
    function initializeIcons() {
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    }

    // ============================================
    // Public API
    // ============================================

    return {
        /**
         * Render all categories and apps
         */
        render() {
            const container = document.getElementById(CONTAINER_ID);
            if (!container) {
                console.error(`Container #${CONTAINER_ID} not found`);
                return;
            }

            // Group apps by category
            const grouped = groupByCategory(window.APPS);
            
            // Sort categories by order
            const sortedCategories = Object.keys(grouped).sort((a, b) => {
                const orderA = window.CATEGORIES[a]?.order || 999;
                const orderB = window.CATEGORIES[b]?.order || 999;
                return orderA - orderB;
            });

            const menuHtml = createCategoryMenu(sortedCategories);

            // Generate HTML for all categories
            const sectionsHtml = sortedCategories.map(category => {
                return createCategorySection(category, grouped[category]);
            }).join('');

            // Update container
            container.innerHTML = menuHtml + sectionsHtml;

            // Initialize Lucide icons
            initializeIcons();
        },

        /**
         * Re-render (called when language changes)
         */
        refresh() {
            this.render();
        }
    };
})();

// Export for global access
if (typeof window !== 'undefined') {
    window.Render = Render;
}