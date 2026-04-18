# Plan 2 — Front : design system + BottomAppBar + shell `/admin`

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Poser le socle visuel et structurel côté front : design system minimal (tokens + composants de base), BottomAppBar persistante (4 onglets visiteur / 5 onglets admin), route `/admin/*` protégée avec pages landing/placeholders. Aucune logique métier (CRUD) dans ce plan — c'est uniquement l'ossature.

**Architecture:** Dossier `src/design-system/` isolé via un wrapper CSS `.ds-root` + CSS variables préfixées `--ds-*`, coexiste avec Semantic UI sans conflit. `BottomAppBar` monté dans `App.js`, son contenu mute selon `pathname` (visiteur hors `/admin/*`, admin sur `/admin/*`). Route `/admin` gardée par un HOC `<RequireAuth>` qui redirige vers `/` si `!user`.

**Tech Stack:** React 17, react-router-dom 5 (HashRouter), CRA 4, `lucide-react` (nouvelle dep), `@fontsource/inter` + `@fontsource/dm-serif-display` (nouvelles deps).

**Conventions projet rappels:**
- Pas de framework de test : vérification via `npm start` + navigateur mobile, `node -e "require('@babel/parser').parse(...)"` pour syntaxe JSX.
- Branche `feat/admin-bottom-bar-categories` (déjà créée).
- `$SERVER` dans `src/_const/_const.js` : ne **jamais** committer le toggle local (`http://localhost:8080`) ; toujours vérifier `git status` et exclure ce fichier s'il ne contient que le toggle.

---

## Files

- **Modifier** : `1755-front/package.json` (nouvelles deps)
- **Créer** : `1755-front/src/design-system/tokens.css`
- **Créer** : `1755-front/src/design-system/fonts.js`
- **Créer** : `1755-front/src/design-system/iconMap.js`
- **Créer** : `1755-front/src/design-system/components/TabBar.jsx`
- **Créer** : `1755-front/src/design-system/components/TabBar.css`
- **Créer** : `1755-front/src/design-system/components/Button.jsx`
- **Créer** : `1755-front/src/design-system/components/Button.css`
- **Créer** : `1755-front/src/design-system/index.js` (barrel)
- **Créer** : `1755-front/src/components/Small/BottomAppBar/index.jsx`
- **Créer** : `1755-front/src/components/Small/BottomAppBar/BottomAppBar.css`
- **Créer** : `1755-front/src/components/Small/RequireAuth/index.jsx`
- **Créer** : `1755-front/src/pages/Admin/Home.jsx` (landing `/admin`)
- **Créer** : `1755-front/src/pages/Admin/Placeholder.jsx` (réutilisé par les 4 sous-pages)
- **Créer** : `1755-front/src/pages/Admin/admin.css`
- **Modifier** : `1755-front/src/components/App/App.js` (mount BottomAppBar + routes admin)
- **Modifier** : `1755-front/src/index.js` (import tokens + fonts)

---

### Task 1 : Installer les nouvelles dépendances

**Files:**
- Modify: `1755-front/package.json`

- [ ] **Step 1 : Vérifier la branche**

Run:
```bash
git -C /Users/pierrefrancoispaoletti/appdevelopment/1755-front branch --show-current
```
Expected: `feat/admin-bottom-bar-categories`

- [ ] **Step 2 : Installer Lucide + fonts**

Run:
```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front && npm install lucide-react @fontsource/inter @fontsource/dm-serif-display
```
Expected: pas d'erreur. Vérifier que `package.json` contient les 3 deps.

- [ ] **Step 3 : Vérifier que le build passe encore**

Run:
```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front && NODE_OPTIONS=--openssl-legacy-provider npx react-scripts build --max-old-space-size=4096 2>&1 | tail -20
```
Expected: `Compiled successfully` ou `Compiled with warnings` (warnings ESLint tolérés).

- [ ] **Step 4 : Commit**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
git add package.json package-lock.json
git commit -m "chore(deps): ajout lucide-react + fonts Inter/DM Serif Display"
```

---

### Task 2 : Tokens CSS du design system

**Files:**
- Create: `1755-front/src/design-system/tokens.css`

- [ ] **Step 1 : Créer le fichier**

Écrire `1755-front/src/design-system/tokens.css` :

```css
.ds-root {
  /* Couleurs — palette sombre inspirée "Decant" */
  --ds-bg-deep: #0E0A10;
  --ds-bg-surface: #1B1118;
  --ds-bg-elevated: #241820;
  --ds-accent-wine: #6B1A2C;
  --ds-accent-wine-hover: #8a2139;
  --ds-accent-gold: #D4A24C;
  --ds-text-primary: #F5EFE8;
  --ds-text-muted: #9A8B90;
  --ds-text-disabled: #5C4F54;
  --ds-border-subtle: #2C1E25;
  --ds-danger: #C0392B;
  --ds-success: #3A7D44;

  /* Typo */
  --ds-font-sans: "Inter", system-ui, -apple-system, sans-serif;
  --ds-font-serif: "DM Serif Display", Georgia, serif;
  --ds-size-display: 28px;
  --ds-size-h1: 22px;
  --ds-size-h2: 18px;
  --ds-size-body: 15px;
  --ds-size-small: 13px;
  --ds-size-tiny: 11px;

  /* Grille 4 px */
  --ds-space-1: 4px;
  --ds-space-2: 8px;
  --ds-space-3: 12px;
  --ds-space-4: 16px;
  --ds-space-5: 20px;
  --ds-space-6: 24px;
  --ds-space-8: 32px;

  /* Radii */
  --ds-radius-sm: 8px;
  --ds-radius-md: 16px;
  --ds-radius-pill: 999px;

  /* Shadows */
  --ds-shadow-card: 0 4px 12px rgba(0, 0, 0, 0.35);
  --ds-shadow-glow: 0 0 16px rgba(212, 162, 76, 0.25);

  /* Z-index */
  --ds-z-appbar: 100;
  --ds-z-sheet: 200;
  --ds-z-modal: 300;

  /* Safe area iOS */
  --ds-safe-bottom: env(safe-area-inset-bottom, 0px);

  font-family: var(--ds-font-sans);
  color: var(--ds-text-primary);
}
```

- [ ] **Step 2 : Vérifier syntaxe CSS (parse simple)**

Run:
```bash
node -e "const css=require('fs').readFileSync('/Users/pierrefrancoispaoletti/appdevelopment/1755-front/src/design-system/tokens.css','utf8'); if(!css.includes('--ds-bg-deep')) throw new Error('tokens manquants'); console.log('OK',css.split('\n').length,'lignes')"
```
Expected: `OK N lignes`.

- [ ] **Step 3 : Commit**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
git add src/design-system/tokens.css
git commit -m "feat(ds): tokens CSS (couleurs, typo, espacements, radii)"
```

---

### Task 3 : Import des fonts

**Files:**
- Create: `1755-front/src/design-system/fonts.js`

- [ ] **Step 1 : Créer le fichier**

Écrire `1755-front/src/design-system/fonts.js` :

```js
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/dm-serif-display/400.css";
```

- [ ] **Step 2 : Vérifier syntaxe**

Run:
```bash
node -e "require('@babel/parser').parse(require('fs').readFileSync('/Users/pierrefrancoispaoletti/appdevelopment/1755-front/src/design-system/fonts.js','utf8'),{sourceType:'module'})"
```
Expected: pas de sortie (succès).

- [ ] **Step 3 : Commit**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
git add src/design-system/fonts.js
git commit -m "feat(ds): import des poids de fonts Inter + DM Serif Display"
```

---

### Task 4 : Whitelist d'icônes Lucide

**Files:**
- Create: `1755-front/src/design-system/iconMap.js`

- [ ] **Step 1 : Créer le fichier**

Écrire `1755-front/src/design-system/iconMap.js` :

```js
import {
  Home,
  BookOpen,
  CalendarCheck,
  User,
  UserCheck,
  Package,
  FolderTree,
  Calendar,
  Palette,
  LogOut,
  Wine,
  WineOff,
  Beer,
  Martini,
  Coffee,
  GlassWater,
  UtensilsCrossed,
  Sandwich,
  Pizza,
  Cookie,
  Cake,
  Croissant,
  Soup,
  Salad,
  ChefHat,
  IceCream,
  Fish,
  Grape,
  Crown,
  ShoppingBag,
  Tag,
  Star,
  Heart,
  Sparkles,
  Flame,
  Leaf,
  Sun,
  Moon,
  Music,
  PartyPopper,
  Ticket,
  MapPin,
  Clock,
  Info,
  Plus,
  Minus,
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Edit,
  Trash,
  Eye,
  EyeOff,
  Image,
  Search,
  Filter,
  Settings,
  Menu,
} from "lucide-react";

export const ICON_MAP = {
  Home,
  BookOpen,
  CalendarCheck,
  User,
  UserCheck,
  Package,
  FolderTree,
  Calendar,
  Palette,
  LogOut,
  Wine,
  WineOff,
  Beer,
  Martini,
  Coffee,
  GlassWater,
  UtensilsCrossed,
  Sandwich,
  Pizza,
  Cookie,
  Cake,
  Croissant,
  Soup,
  Salad,
  ChefHat,
  IceCream,
  Fish,
  Grape,
  Crown,
  ShoppingBag,
  Tag,
  Star,
  Heart,
  Sparkles,
  Flame,
  Leaf,
  Sun,
  Moon,
  Music,
  PartyPopper,
  Ticket,
  MapPin,
  Clock,
  Info,
  Plus,
  Minus,
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Edit,
  Trash,
  Eye,
  EyeOff,
  Image,
  Search,
  Filter,
  Settings,
  Menu,
};

// Sous-ensemble proposé dans l'IconPicker admin (~40 icônes resto/bar)
export const PICKER_ICONS = [
  "Wine", "WineOff", "Beer", "Martini", "Coffee", "GlassWater",
  "UtensilsCrossed", "Sandwich", "Pizza", "Cookie", "Cake", "Croissant",
  "Soup", "Salad", "ChefHat", "IceCream", "Fish", "Grape",
  "Crown", "ShoppingBag", "Tag", "Star", "Heart", "Sparkles",
  "Flame", "Leaf", "Sun", "Moon", "Music", "PartyPopper", "Ticket",
  "MapPin", "Clock", "Info",
];

// Couleurs fréquentes pré-proposées dans le color picker
export const PICKER_COLORS = [
  "#ffffff", "#F5EFE8", "#D4A24C", "#6B1A2C",
  "#8B0000", "#fec5d9", "#f1f285", "#3A7D44",
];

export function getIcon(name) {
  return ICON_MAP[name] || null;
}
```

- [ ] **Step 2 : Vérifier syntaxe**

Run:
```bash
node -e "require('@babel/parser').parse(require('fs').readFileSync('/Users/pierrefrancoispaoletti/appdevelopment/1755-front/src/design-system/iconMap.js','utf8'),{sourceType:'module'})"
```
Expected: pas de sortie.

- [ ] **Step 3 : Commit**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
git add src/design-system/iconMap.js
git commit -m "feat(ds): whitelist d'icônes Lucide (~60) + sous-ensemble IconPicker"
```

---

### Task 5 : Composant Button

**Files:**
- Create: `1755-front/src/design-system/components/Button.jsx`
- Create: `1755-front/src/design-system/components/Button.css`

- [ ] **Step 1 : Créer le CSS**

Écrire `1755-front/src/design-system/components/Button.css` :

```css
.ds-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-2);
  font-family: var(--ds-font-sans);
  font-size: var(--ds-size-body);
  font-weight: 500;
  border: none;
  border-radius: var(--ds-radius-pill);
  padding: var(--ds-space-3) var(--ds-space-5);
  cursor: pointer;
  transition: background-color 120ms ease, transform 120ms ease;
  min-height: 44px;
}
.ds-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.ds-btn--primary { background: var(--ds-accent-wine); color: var(--ds-text-primary); }
.ds-btn--primary:hover:not(:disabled) { background: var(--ds-accent-wine-hover); }
.ds-btn--ghost { background: transparent; color: var(--ds-text-primary); border: 1px solid var(--ds-border-subtle); }
.ds-btn--ghost:hover:not(:disabled) { background: var(--ds-bg-elevated); }
.ds-btn--danger { background: var(--ds-danger); color: var(--ds-text-primary); }
.ds-btn--block { width: 100%; }
.ds-btn--icon-only { padding: var(--ds-space-3); min-width: 44px; }
```

- [ ] **Step 2 : Créer le composant**

Écrire `1755-front/src/design-system/components/Button.jsx` :

```jsx
import React from "react";
import "./Button.css";

const Button = ({
  variant = "primary",
  block = false,
  iconOnly = false,
  className = "",
  children,
  ...rest
}) => {
  const classes = [
    "ds-btn",
    `ds-btn--${variant}`,
    block ? "ds-btn--block" : "",
    iconOnly ? "ds-btn--icon-only" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
};

export default Button;
```

- [ ] **Step 3 : Vérifier syntaxe**

Run:
```bash
node -e "require('@babel/parser').parse(require('fs').readFileSync('/Users/pierrefrancoispaoletti/appdevelopment/1755-front/src/design-system/components/Button.jsx','utf8'),{sourceType:'module',plugins:['jsx']})"
```
Expected: pas de sortie.

- [ ] **Step 4 : Commit**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
git add src/design-system/components/Button.jsx src/design-system/components/Button.css
git commit -m "feat(ds): composant Button (primary, ghost, danger, block, iconOnly)"
```

---

### Task 6 : Composant TabBar

**Files:**
- Create: `1755-front/src/design-system/components/TabBar.jsx`
- Create: `1755-front/src/design-system/components/TabBar.css`

- [ ] **Step 1 : Créer le CSS**

Écrire `1755-front/src/design-system/components/TabBar.css` :

```css
.ds-tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--ds-bg-surface);
  border-top: 1px solid var(--ds-border-subtle);
  display: flex;
  padding-bottom: var(--ds-safe-bottom);
  z-index: var(--ds-z-appbar);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4);
}
.ds-tab {
  flex: 1;
  min-height: 56px;
  background: transparent;
  border: none;
  color: var(--ds-text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
  padding: var(--ds-space-2) var(--ds-space-1);
  font-family: var(--ds-font-sans);
  font-size: var(--ds-size-tiny);
  font-weight: 500;
  transition: color 120ms ease;
  position: relative;
}
.ds-tab svg { width: 22px; height: 22px; }
.ds-tab--active { color: var(--ds-accent-gold); }
.ds-tab--active::before {
  content: "";
  position: absolute;
  top: 0;
  left: 28%;
  right: 28%;
  height: 2px;
  background: var(--ds-accent-gold);
  border-radius: 0 0 2px 2px;
}
.ds-tab--connected svg { color: var(--ds-success); }
.ds-tab:disabled { opacity: 0.4; cursor: default; }
.ds-tab__label { line-height: 1; }
```

- [ ] **Step 2 : Créer le composant**

Écrire `1755-front/src/design-system/components/TabBar.jsx` :

```jsx
import React from "react";
import "./TabBar.css";

/**
 * tabs: [{ key, label, icon: Component, onClick, active: bool, modifier?: string }]
 */
const TabBar = ({ tabs }) => (
  <nav className="ds-tabbar" role="navigation" aria-label="Navigation principale">
    {tabs.map((tab) => {
      const Icon = tab.icon;
      const classes = [
        "ds-tab",
        tab.active ? "ds-tab--active" : "",
        tab.modifier ? `ds-tab--${tab.modifier}` : "",
      ]
        .filter(Boolean)
        .join(" ");
      return (
        <button
          key={tab.key}
          className={classes}
          onClick={tab.onClick}
          aria-label={tab.label}
          aria-current={tab.active ? "page" : undefined}
        >
          {Icon ? <Icon /> : null}
          <span className="ds-tab__label">{tab.label}</span>
        </button>
      );
    })}
  </nav>
);

export default TabBar;
```

- [ ] **Step 3 : Vérifier syntaxe**

Run:
```bash
node -e "require('@babel/parser').parse(require('fs').readFileSync('/Users/pierrefrancoispaoletti/appdevelopment/1755-front/src/design-system/components/TabBar.jsx','utf8'),{sourceType:'module',plugins:['jsx']})"
```
Expected: pas de sortie.

- [ ] **Step 4 : Commit**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
git add src/design-system/components/TabBar.jsx src/design-system/components/TabBar.css
git commit -m "feat(ds): composant TabBar (bottom bar mobile, onglets actifs)"
```

---

### Task 7 : Barrel d'exports design system

**Files:**
- Create: `1755-front/src/design-system/index.js`

- [ ] **Step 1 : Créer le fichier**

Écrire `1755-front/src/design-system/index.js` :

```js
import "./tokens.css";
import "./fonts";

export { default as Button } from "./components/Button";
export { default as TabBar } from "./components/TabBar";
export { ICON_MAP, PICKER_ICONS, PICKER_COLORS, getIcon } from "./iconMap";
```

- [ ] **Step 2 : Vérifier syntaxe**

Run:
```bash
node -e "require('@babel/parser').parse(require('fs').readFileSync('/Users/pierrefrancoispaoletti/appdevelopment/1755-front/src/design-system/index.js','utf8'),{sourceType:'module'})"
```
Expected: pas de sortie.

- [ ] **Step 3 : Commit**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
git add src/design-system/index.js
git commit -m "feat(ds): barrel d'exports (tokens, fonts, composants, icônes)"
```

---

### Task 8 : Composant `BottomAppBar`

**Files:**
- Create: `1755-front/src/components/Small/BottomAppBar/index.jsx`
- Create: `1755-front/src/components/Small/BottomAppBar/BottomAppBar.css`

- [ ] **Step 1 : Créer le CSS spécifique**

Écrire `1755-front/src/components/Small/BottomAppBar/BottomAppBar.css` :

```css
.ds-appbar-root {
  /* wrapper positionné pour scope .ds-root (inherit depuis body className) */
}
/* Padding bottom sur le contenu principal pour ne pas être caché par la bar */
body.has-bottom-appbar { padding-bottom: calc(64px + var(--ds-safe-bottom, 0px)); }
```

- [ ] **Step 2 : Créer le composant**

Écrire `1755-front/src/components/Small/BottomAppBar/index.jsx` :

```jsx
import React, { useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { TabBar, ICON_MAP } from "../../../design-system";
import "./BottomAppBar.css";

const RESA_URL = "https://pierrefrancoispaoletti.github.io/1755-resas";

const BottomAppBar = ({ user, setOpenLoginModal }) => {
  const history = useHistory();
  const location = useLocation();
  const pathname = location.pathname;

  useEffect(() => {
    document.body.classList.add("has-bottom-appbar");
    return () => document.body.classList.remove("has-bottom-appbar");
  }, []);

  const onAdmin = pathname.startsWith("/admin");

  const visitorTabs = [
    {
      key: "home",
      label: "Accueil",
      icon: ICON_MAP.Home,
      active: pathname === "/",
      onClick: () => history.push("/"),
    },
    {
      key: "carte",
      label: "Carte",
      icon: ICON_MAP.BookOpen,
      active: pathname.startsWith("/categories"),
      onClick: () => history.push("/categories"),
    },
    {
      key: "resa",
      label: "Résa",
      icon: ICON_MAP.CalendarCheck,
      active: false,
      onClick: () => window.open(RESA_URL, "_blank", "noopener,noreferrer"),
    },
    {
      key: "compte",
      label: user ? "Admin" : "Compte",
      icon: user ? ICON_MAP.UserCheck : ICON_MAP.User,
      active: false,
      modifier: user ? "connected" : null,
      onClick: () => {
        if (user) history.push("/admin");
        else setOpenLoginModal(true);
      },
    },
  ];

  const adminTabs = [
    {
      key: "a-products",
      label: "Produits",
      icon: ICON_MAP.Package,
      active: pathname.startsWith("/admin/products"),
      onClick: () => history.push("/admin/products"),
    },
    {
      key: "a-categories",
      label: "Catégories",
      icon: ICON_MAP.FolderTree,
      active: pathname.startsWith("/admin/categories"),
      onClick: () => history.push("/admin/categories"),
    },
    {
      key: "a-events",
      label: "Events",
      icon: ICON_MAP.Calendar,
      active: pathname.startsWith("/admin/events"),
      onClick: () => history.push("/admin/events"),
    },
    {
      key: "a-themes",
      label: "Thèmes",
      icon: ICON_MAP.Palette,
      active: pathname.startsWith("/admin/themes"),
      onClick: () => history.push("/admin/themes"),
    },
    {
      key: "a-quit",
      label: "Quitter",
      icon: ICON_MAP.LogOut,
      active: false,
      onClick: () => history.push("/"),
    },
  ];

  const tabs = onAdmin ? adminTabs : visitorTabs;

  return (
    <div className="ds-root ds-appbar-root">
      <TabBar tabs={tabs} />
    </div>
  );
};

export default BottomAppBar;
```

- [ ] **Step 3 : Vérifier syntaxe**

Run:
```bash
node -e "require('@babel/parser').parse(require('fs').readFileSync('/Users/pierrefrancoispaoletti/appdevelopment/1755-front/src/components/Small/BottomAppBar/index.jsx','utf8'),{sourceType:'module',plugins:['jsx']})"
```
Expected: pas de sortie.

- [ ] **Step 4 : Commit**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
git add src/components/Small/BottomAppBar/
git commit -m "feat(appbar): BottomAppBar avec contenu qui mute visiteur/admin"
```

---

### Task 9 : Guard `RequireAuth`

**Files:**
- Create: `1755-front/src/components/Small/RequireAuth/index.jsx`

- [ ] **Step 1 : Créer le composant**

Écrire `1755-front/src/components/Small/RequireAuth/index.jsx` :

```jsx
import React, { useEffect } from "react";
import { Redirect } from "react-router-dom";

const RequireAuth = ({ user, children }) => {
  useEffect(() => {
    // Hook pour logger le blocage si besoin plus tard
  }, [user]);
  if (!user) return <Redirect to="/" />;
  return children;
};

export default RequireAuth;
```

- [ ] **Step 2 : Vérifier syntaxe**

Run:
```bash
node -e "require('@babel/parser').parse(require('fs').readFileSync('/Users/pierrefrancoispaoletti/appdevelopment/1755-front/src/components/Small/RequireAuth/index.jsx','utf8'),{sourceType:'module',plugins:['jsx']})"
```
Expected: pas de sortie.

- [ ] **Step 3 : Commit**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
git add src/components/Small/RequireAuth/
git commit -m "feat(admin): HOC RequireAuth (redirige vers / si !user)"
```

---

### Task 10 : Pages admin placeholder

**Files:**
- Create: `1755-front/src/pages/Admin/admin.css`
- Create: `1755-front/src/pages/Admin/Home.jsx`
- Create: `1755-front/src/pages/Admin/Placeholder.jsx`

- [ ] **Step 1 : Créer le CSS admin**

Écrire `1755-front/src/pages/Admin/admin.css` :

```css
.admin-page {
  min-height: 100vh;
  background: var(--ds-bg-deep);
  color: var(--ds-text-primary);
  padding: var(--ds-space-6) var(--ds-space-4) calc(80px + var(--ds-safe-bottom));
  font-family: var(--ds-font-sans);
}
.admin-page h1 {
  font-family: var(--ds-font-serif);
  font-size: var(--ds-size-display);
  margin: 0 0 var(--ds-space-2);
}
.admin-page p.subtitle {
  color: var(--ds-text-muted);
  font-size: var(--ds-size-body);
  margin: 0 0 var(--ds-space-6);
}
.admin-placeholder {
  border: 1px dashed var(--ds-border-subtle);
  border-radius: var(--ds-radius-md);
  padding: var(--ds-space-6);
  text-align: center;
  color: var(--ds-text-muted);
  margin-top: var(--ds-space-4);
}
.admin-logout {
  margin-top: var(--ds-space-6);
}
```

- [ ] **Step 2 : Créer la landing `/admin`**

Écrire `1755-front/src/pages/Admin/Home.jsx` :

```jsx
import React from "react";
import { Button } from "../../design-system";
import "./admin.css";

const AdminHome = ({ user, setUser }) => {
  const handleLogout = () => {
    localStorage.removeItem("jwt");
    setUser("");
  };
  return (
    <div className="ds-root admin-page">
      <h1>Administration</h1>
      <p className="subtitle">
        Connecté en tant que {user?.username || "admin"}. Choisis une section
        dans la barre du bas.
      </p>
      <div className="admin-placeholder">
        Sélectionne Produits, Catégories, Events ou Thèmes.
      </div>
      <div className="admin-logout">
        <Button variant="ghost" onClick={handleLogout}>
          Déconnexion
        </Button>
      </div>
    </div>
  );
};

export default AdminHome;
```

- [ ] **Step 3 : Créer le Placeholder réutilisable**

Écrire `1755-front/src/pages/Admin/Placeholder.jsx` :

```jsx
import React from "react";
import "./admin.css";

const AdminPlaceholder = ({ title, description }) => (
  <div className="ds-root admin-page">
    <h1>{title}</h1>
    <p className="subtitle">{description}</p>
    <div className="admin-placeholder">
      Section en cours de construction.
    </div>
  </div>
);

export default AdminPlaceholder;
```

- [ ] **Step 4 : Vérifier syntaxes**

Run:
```bash
for f in Home.jsx Placeholder.jsx; do
  node -e "require('@babel/parser').parse(require('fs').readFileSync('/Users/pierrefrancoispaoletti/appdevelopment/1755-front/src/pages/Admin/$f','utf8'),{sourceType:'module',plugins:['jsx']})"
done
```
Expected: pas de sortie.

- [ ] **Step 5 : Commit**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
git add src/pages/Admin/
git commit -m "feat(admin): pages landing + placeholder réutilisable"
```

---

### Task 11 : Câblage dans `App.js` (routes admin + BottomAppBar)

**Files:**
- Modify: `1755-front/src/components/App/App.js`

- [ ] **Step 1 : Ajouter les imports**

Dans `1755-front/src/components/App/App.js`, en haut, après l'import de `TopAppBar` :

```js
import BottomAppBar from "../Small/BottomAppBar";
import RequireAuth from "../Small/RequireAuth";
import AdminHome from "../../pages/Admin/Home";
import AdminPlaceholder from "../../pages/Admin/Placeholder";
import "../../design-system";
```

- [ ] **Step 2 : Ajouter les routes admin dans le `<Switch>`**

Dans le `<Switch>` existant (après la route `/categories/:categorie`), **avant** la route par défaut s'il y en a une, ajouter :

```jsx
<Route exact path="/admin">
  <RequireAuth user={user}>
    <AdminHome user={user} setUser={setUser} />
  </RequireAuth>
</Route>
<Route path="/admin/products">
  <RequireAuth user={user}>
    <AdminPlaceholder title="Produits" description="Gestion du catalogue produits." />
  </RequireAuth>
</Route>
<Route path="/admin/categories">
  <RequireAuth user={user}>
    <AdminPlaceholder title="Catégories" description="Arborescence des catégories." />
  </RequireAuth>
</Route>
<Route path="/admin/events">
  <RequireAuth user={user}>
    <AdminPlaceholder title="Events" description="Événements programmés." />
  </RequireAuth>
</Route>
<Route path="/admin/themes">
  <RequireAuth user={user}>
    <AdminPlaceholder title="Thèmes" description="Thèmes visuels." />
  </RequireAuth>
</Route>
```

- [ ] **Step 3 : Monter `BottomAppBar` à la fin du wrapper racine du composant `App`**

Localiser le JSX racine de `App` (typiquement un `<Container>` ou un `<>`). Juste avant sa fermeture, ajouter :

```jsx
<BottomAppBar user={user} setOpenLoginModal={setOpenLoginModal} />
```

- [ ] **Step 4 : Vérifier syntaxe**

Run:
```bash
node -e "require('@babel/parser').parse(require('fs').readFileSync('/Users/pierrefrancoispaoletti/appdevelopment/1755-front/src/components/App/App.js','utf8'),{sourceType:'module',plugins:['jsx']})"
```
Expected: pas de sortie.

- [ ] **Step 5 : Commit**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
git add src/components/App/App.js
git commit -m "feat(app): monter BottomAppBar + routes /admin/* avec RequireAuth"
```

---

### Task 12 : Vérification manuelle en navigateur

**Files:** —

- [ ] **Step 1 : Lancer le dev server**

Run (terminal dédié) :
```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front && npm start
```
Expected: browser ouvre `http://localhost:3000/`. Pas d'erreur console.

- [ ] **Step 2 : Vérifications visuelles (mode mobile devtools recommandé)**

- La BottomAppBar est visible en bas de l'écran, 4 onglets : Accueil, Carte, Résa, Compte.
- Icône "Compte" grise (icône `User`) quand non connecté.
- Tap sur Accueil → `/` (onglet Accueil surligné en doré).
- Tap sur Carte → `/categories` (onglet Carte surligné).
- Tap sur Résa → nouvel onglet navigateur ouvre `pierrefrancoispaoletti.github.io/1755-resas`.
- Tap sur Compte (non connecté) → modal de login s'ouvre.

- [ ] **Step 3 : Tester le mode admin**

- Se connecter (via la modal), vérifier que l'onglet "Compte" devient "Admin" avec icône verte.
- Tap sur Admin → redirige sur `/admin`.
- La BottomAppBar change : 5 onglets [Produits, Catégories, Events, Thèmes, Quitter].
- Tap sur chaque onglet → les 4 pages placeholder s'affichent correctement, onglet actif surligné.
- Tap sur Quitter → retour à `/`, la BottomAppBar visiteur réapparaît.

- [ ] **Step 4 : Tester le guard**

- Se déconnecter (bouton "Déconnexion" sur `/admin`).
- Taper manuellement `http://localhost:3000/#/admin/products` dans l'URL.
- Expected: redirigé vers `/`.

- [ ] **Step 5 : Vérifier que les pages existantes ne sont pas cassées**

- Home affiche toujours correctement.
- `/categories/:slug` fonctionne (navigation via TopAppBar ou sidebar).
- TopAppBar reste visible (on ne l'a pas encore retiré — sera fait en Plan 3 avec la refonte finale, ou on le garde tel quel si tu préfères).

- [ ] **Step 6 : Arrêter le dev server**

---

### Task 13 : Build de validation

**Files:** —

- [ ] **Step 1 : Build prod**

Run:
```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front && npm run build 2>&1 | tail -30
```
Expected: `Compiled successfully` ou `Compiled with warnings` (warnings ESLint tolérés, pas d'erreurs de compilation).

- [ ] **Step 2 : Vérifier la taille du bundle**

Run:
```bash
ls -lh /Users/pierrefrancoispaoletti/appdevelopment/1755-front/build/static/js/ | head -5
```
Expected: bundle principal pas explosé (quelques centaines de Ko gzippés max). Lucide tree-shake doit limiter l'ajout.

---

### Task 14 : Push de la branche

**Files:** —

- [ ] **Step 1 : Vérifier `git status`**

Run:
```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front && git status && git log --oneline -15
```
Expected: working tree clean. **Vérifier que `src/_const/_const.js` n'est PAS modifié** (cf. convention projet).

- [ ] **Step 2 : Push**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front && git push -u origin feat/admin-bottom-bar-categories
```
Expected: branche créée sur origin.

---

## Récapitulatif

À la fin de ce plan :

- Le design system minimal est en place (tokens, fonts, 2 composants de base).
- La BottomAppBar est montée, 4 onglets visiteur + 5 onglets admin, transitions fonctionnelles.
- La route `/admin/*` existe avec guard `RequireAuth`, 5 pages (landing + 4 placeholders).
- Le TopAppBar actuel coexiste sans régression (il sera simplifié/supprimé en Plan 3 si souhaité).
- Aucun écran public n'a été modifié visuellement (design system scopé via `.ds-root`).
- La branche front est poussée sur origin.

**Prochaine étape** : Plan 3 (admin fonctionnel + consommation publique `/api/categories` + déploiement prod).
