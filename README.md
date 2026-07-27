# FinSpark - Bridging the Digital Gap

<p align="center">
  <strong>Digital literacy helper apps for non-tech-savvy and older users</strong>
</p>

A fully static, multi-language informational website showcasing digital literacy apps. Built with vanilla HTML, CSS, and JavaScript — no frameworks, no build tools required.

## 🌟 Features

- **Multi-language Support**: English, Tamil (தமிழ்), Kannada (ಕನ್ನಡ), Telugu (తెలుగు), Malayalam (മലയാളം), Hindi (हिन्दी)
- **Runtime Language Switching**: Change language instantly without page reload
- **Accessible Design**: Large fonts, high contrast, WCAG AA compliant
- **Mobile-First**: Fully responsive for all devices
- **Data-Driven Architecture**: Easy to add new apps and languages
- **Zero Dependencies**: No npm, no build process — just static files

## 📁 Project Structure

```
├── index.html              # Main HTML page
├── css/
│   └── styles.css          # All styling (mobile-first, responsive)
├── js/
│   ├── apps.js             # App data (single source of truth)
│   ├── i18n.js             # Internationalization module
│   ├── render.js           # Dynamic content rendering
│   └── main.js             # Application initialization
├── locales/
│   ├── en.json             # English translations
│   ├── ta.json             # Tamil translations
│   ├── kn.json             # Kannada translations
│   ├── te.json             # Telugu translations
│   ├── ml.json             # Malayalam translations
│   └── hi.json             # Hindi translations
├── netlify.toml            # Netlify deployment config
└── README.md               # This file
```

## 🚀 How to Run Locally

Since this site fetches JSON files, you need a static server (not `file://` protocol).

### Option 1: Python (Recommended)

```bash
# Python 3
cd website
python -m http.server 8000

# Open http://localhost:8000
```

### Option 2: VS Code Live Server

1. Install the "Live Server" extension in VS Code
2. Right-click `index.html` → "Open with Live Server"

### Option 3: Node.js

```bash
# Install serve globally
npm install -g serve

# Run server
cd website
serve .

# Open the URL shown in terminal
```

## 🌐 How to Deploy to Netlify

### Option 1: Drag and Drop

1. Go to [netlify.com](https://www.netlify.com/)
2. Sign up / Log in
3. Go to "Sites" → Drag the project folder onto the deploy area
4. Done! Your site is live.

### Option 2: Connect Git Repository

1. Push this project to GitHub/GitLab/Bitbucket
2. Go to [netlify.com](https://www.netlify.com/) → "Add new site" → "Import an existing project"
3. Select your repository
4. Settings:
   - **Build command**: (leave empty)
   - **Publish directory**: `.` (root)
5. Click "Deploy"

## ➕ How to Add a New App

Adding a new app requires **2 simple steps**:

### Step 1: Add app object to `js/apps.js`

```javascript
{
    id: "my-new-app",           // Unique ID (used as key in locale files)
  category: "health",          // "health" | "transport" | "education" | "government"
    icon: "heart",               // Lucide icon name (see lucide.dev/icons)
    link: "https://...",         // Optional: download/website URL
    steps: 4                     // Number of how-to-use steps
}
```

Also add step icons in `STEP_ICONS`:

```javascript
"my-new-app": ["download", "user", "settings", "check-circle"]
```

### Step 2: Add translations to ALL locale files

In each file (`locales/en.json`, `ta.json`, etc.), add under `"apps"`:

```json
"my-new-app": {
    "name": "My New App",
    "use": "Description of what the app does.",
    "howToUse": [
        "Step 1 text",
        "Step 2 text",
        "Step 3 text",
        "Step 4 text"
    ]
}
```

That's it! The app will appear automatically.

## 🌍 How to Add a New Language

### Step 1: Create locale file

Copy `locales/en.json` to `locales/xx.json` (where `xx` is the language code), then translate all values.

### Step 2: Add option to language switcher

In `index.html`, add an option to the language dropdown:

```html
<select id="language-select">
  <!-- existing options -->
  <option value="xx">Language Name in Native Script</option>
</select>
```

### Step 3: Update supported languages (optional)

In `js/i18n.js`, add the language code to `SUPPORTED_LANGUAGES`:

```javascript
const SUPPORTED_LANGUAGES = ["en", "ta", "kn", "te", "ml", "hi", "xx"];
```

## 🎨 Design System

- **Primary Theme**: Purple gradient (#4a1c8b → #8e44ad → #c026d3)
- **Font**: Noto Sans family (supports all Indian scripts)
- **Icons**: Lucide Icons (via CDN)
- **Accessibility**:
  - Large tap targets (min 56px)
  - High contrast (WCAG AA)
  - Semantic HTML with ARIA labels
  - Keyboard navigation support

## 📱 App Categories

| Category                 | Apps                        |
| ------------------------ | --------------------------- |
| **Health & Safety**      | Agust AI, Medisafe, Life360 |
| **Transport & Payments** | Where is My Train, BHIM App |
| **Education**            | Matiks                      |
| **Government Apps**      | UMANG                       |

## 🛠️ Technical Details

- **No Build Required**: Pure HTML/CSS/JS
- **Icons**: Lucide Icons via CDN (unpkg.com)
- **Fonts**: Google Fonts (Noto Sans family)
- **Browser Support**: All modern browsers + IE11 (partial)
- **Performance**: Lightweight, fast loading

## 📄 License

MIT License - Feel free to use and modify for your needs.

---

<p align="center">
  Made with ❤️ by <strong>Team FinSpark</strong> | 2026
</p>
