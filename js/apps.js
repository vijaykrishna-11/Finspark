/**
 * FinSpark - Apps Data
 * 
 * Single source of truth for all app information.
 * To add a new app: add one object to this array and add corresponding
 * entries in each locale file under "apps" key.
 * 
 * App Object Structure:
 * {
 *   id: string,           // Unique identifier (used as key in locale files)
 *   category: string,     // "health" | "transport" | "education" | "government"
 *   icon: string,         // Lucide icon name (see: https://lucide.dev/icons)
 *   link: string,         // Optional: Play Store / App Store / website URL
 *   steps: number         // Number of "how to use" steps (matches locale file)
 * }
 */

const APPS = [
    // ============================================
    // HEALTH CATEGORY
    // ============================================
    {
        id: "agust-ai",
        category: "health",
        icon: "message-circle-heart",
        link: "https://wa.me/917305020361",
        steps: 4
    },
    {
        id: "medisafe",
        category: "health",
        icon: "pill",
        link: "https://play.google.com/store/apps/details?id=com.medisafe.android.client",
        steps: 4
    },
    {
        id: "life360",
        category: "health",
        icon: "map-pin-check",
        link: "https://play.google.com/store/apps/details?id=com.life360.android.safetymapd",
        steps: 4
    },

    // ============================================
    // TRANSPORT & PAYMENTS CATEGORY
    // ============================================
    {
        id: "where-is-my-train",
        category: "transport",
        icon: "train-front",
        link: "https://play.google.com/store/apps/details?id=com.whereismytrain.android",
        steps: 4
    },
    {
        id: "bhim-app",
        category: "transport",
        icon: "wallet",
        link: "https://play.google.com/store/apps/details?id=in.org.npci.upiapp",
        steps: 4
    },

    // ============================================
    // EDUCATION CATEGORY
    // ============================================
    {
        id: "matiks",
        category: "education",
        icon: "calculator",
        link: "https://play.google.com/store/apps/details?id=com.matiks.app",
        steps: 4
    },

    // ============================================
    // GOVERNMENT APPS CATEGORY
    // ============================================
    {
        id: "umang",
        category: "government",
        icon: "building-2",
        link: "https://web.umang.gov.in/landing/",
        steps: 4
    }
];

// Category configuration with icons and order
const CATEGORIES = {
    health: {
        icon: "heart-pulse",
        order: 1
    },
    transport: {
        icon: "bus",
        order: 2
    },
    education: {
        icon: "graduation-cap",
        order: 3
    },
    government: {
        icon: "building-2",
        order: 4
    }
};

// Step icons for how-to-use sections (mapped by step index)
// These provide visual representation for each step
const STEP_ICONS = {
    "agust-ai": ["smartphone", "message-square", "mic", "check-circle"],
    "medisafe": ["download", "plus-circle", "bell", "users"],
    "life360": ["download", "users", "map-pin", "bell"],
    "where-is-my-train": ["search", "train-front", "clock", "bell"],
    "bhim-app": ["smartphone", "user-check", "send", "check-circle"],
    "matiks": ["download", "play-circle", "book-open", "trophy"],
    "umang": ["download", "user-check", "search", "check-circle"]
};

// Export for use in other modules (using window for browser compatibility)
if (typeof window !== 'undefined') {
    window.APPS = APPS;
    window.CATEGORIES = CATEGORIES;
    window.STEP_ICONS = STEP_ICONS;
}