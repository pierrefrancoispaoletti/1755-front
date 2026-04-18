# Plan 4 — Migration visuelle publique

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrer les écrans publics (Home, landing Carte, Categories/:slug, ProductItem, TopAppBar, Login, image zoom) vers le design system sombre bordeaux/or existant, sans changer les données ni les contrats back.

**Architecture:** Consommation directe des composants et tokens du DS `src/design-system/`. Remplacement un-pour-un des composants Semantic UI, avec nettoyage des vestiges (Sidebar, ProductsFilteringMenu, ImageModal Semantic, assets 18h, constantes COLOR_*). Chaque écran = commit autonome validé manuellement + via Playwright MCP.

**Tech Stack:** React 17, react-router 5 (HashRouter), DS maison (`src/design-system/*`), Lucide icons, `useCategories()` / `fetchTree`. Pas de Jest (CLAUDE.md).

**Spec source:** `docs/superpowers/specs/2026-04-18-public-visual-migration-design.md`

**Contrainte** : aucun merge sur `main` ni front ni back, aucun `npm run deploy`, aucun `git push origin main`. Tout reste sur `feat/admin-bottom-bar-categories`.

---

## Prérequis

- Branche courante = `feat/admin-bottom-bar-categories`.
- `npm start` fonctionne (serveur dev CRA).
- `$SERVER` dans `src/_const/_const.js` pointe bien sur `https://le-1755.herokuapp.com` (ou localhost si tu veux tester en local — ne pas commiter ce changement).
- Ouvrir une deuxième fenêtre terminal pour suivre `npm start`.
- Au début de **chaque** task : exécuter
  ```bash
  git status
  ```
  pour vérifier qu'on part d'un arbre propre. Si non, s'arrêter et clarifier avec le user.

---

## Task 1 — `ds-root` global et nettoyage `App.js` body color

**Files:**
- Modify: `src/components/App/App.js`
- Modify: `src/components/App/App.css` (léger ajout si nécessaire)

- [ ] **Step 1 : Lire l'état actuel**

Lire `src/components/App/App.js` (288 lignes) pour localiser le `useEffect` qui fait `document.body.style.background` et les consommateurs de `COLOR_1755` / `COLOR_ACARCIARA` / `isBefore18h`.

- [ ] **Step 2 : Supprimer l'effet body color et les imports morts**

Dans `src/components/App/App.js` :

Retirer ces imports :
```js
import { $SERVER, COLOR_1755, COLOR_ACARCIARA } from "../../_const/_const";
import { isBefore18h } from "../../datas/utils";
```
Les remplacer par :
```js
import { $SERVER } from "../../_const/_const";
```

Retirer intégralement ce `useEffect` (lignes ~43-60) :
```js
useEffect(() => {
  const backgroundColor = isBefore18h() ? COLOR_ACARCIARA : COLOR_1755;
  document.body.style.background = backgroundColor;
  const elementsToUpdate = [".ui.segment", ".App", ".loader", ".categories", ".topappbar"];
  elementsToUpdate.forEach((selector) => {
    document.querySelectorAll(selector).forEach((element) => {
      element.style.backgroundColor = backgroundColor;
    });
  });
});
```

- [ ] **Step 3 : Ajouter `ds-root` sur le conteneur App**

Modifier le `return` de `App` : remplacer
```jsx
<div className='App' style={{ position: "relative" }}>
```
par
```jsx
<div className='App ds-root' style={{ position: "relative" }}>
```

- [ ] **Step 4 : Forcer le fond sombre sur `<body>` côté CSS**

Éditer `src/components/App/App.css`. Ajouter en tête de fichier :
```css
body {
  background: #0E0A10;
  color: #F5EFE8;
  margin: 0;
  -webkit-font-smoothing: antialiased;
}
```

Si une règle `body { ... }` existe déjà avec un background, la remplacer par la version ci-dessus.

- [ ] **Step 5 : Vérifier syntaxe JSX**

Run:
```bash
node -e "require('@babel/parser').parse(require('fs').readFileSync('src/components/App/App.js','utf8'), {sourceType:'module', plugins:['jsx']})"
```
Expected: aucune sortie (succès).

- [ ] **Step 6 : Test visuel**

Démarrer le dev :
```bash
npm start
```
Ouvrir `http://localhost:3000`. Vérifier :
- Le fond est sombre (`#0E0A10`).
- Les anciennes variations de couleur selon l'heure ont disparu.
- Aucune erreur console rouge.

Si Playwright MCP dispo :
- Naviguer sur `http://localhost:3000`, screenshot `task1-home-dark.png`, assert présence de `.App.ds-root`.

- [ ] **Step 7 : Commit**

```bash
git add src/components/App/App.js src/components/App/App.css
git commit -m "chore(public): ds-root global, retirer le toggle body color 18h

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2 — Réécrire `TopAppBar` (logo + nom, rien d'autre)

**Files:**
- Modify: `src/components/Small/TopAppBar/index.js`
- Modify: `src/components/Small/TopAppBar/topappbar.css`

- [ ] **Step 1 : Réécrire le composant**

Remplacer intégralement le contenu de `src/components/Small/TopAppBar/index.js` par :
```jsx
import React from "react";
import { Link } from "react-router-dom";
import "./topappbar.css";

const TopAppBar = () => {
  return (
    <header className="topappbar ds-root">
      <Link to="/" className="topappbar-brand" aria-label="Accueil">
        <img
          src="./assets/images/1755medium.png"
          width="32"
          height="32"
          alt="Logo Baravin 1755"
          className="topappbar-logo"
        />
        <span className="topappbar-name">Baravin 1755</span>
      </Link>
    </header>
  );
};

export default TopAppBar;
```

- [ ] **Step 2 : Réécrire le CSS**

Remplacer intégralement `src/components/Small/TopAppBar/topappbar.css` par :
```css
.topappbar {
  position: sticky;
  top: 0;
  z-index: var(--ds-z-appbar, 100);
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 var(--ds-space-4, 16px);
  padding-top: env(safe-area-inset-top, 0px);
  background: var(--ds-bg-surface, #1B1118);
  border-bottom: 1px solid var(--ds-border-subtle, #2C1E25);
}

.topappbar-brand {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-2, 8px);
  text-decoration: none;
  color: inherit;
}

.topappbar-logo {
  display: block;
  object-fit: contain;
}

.topappbar-name {
  font-family: var(--ds-font-serif, "DM Serif Display", Georgia, serif);
  font-size: var(--ds-size-h2, 18px);
  color: var(--ds-accent-gold, #D4A24C);
  line-height: 1;
}
```

- [ ] **Step 3 : Mettre à jour l'appel dans `App.js`**

Dans `src/components/App/App.js`, le `<TopAppBar …>` passe actuellement 5 props. Remplacer le JSX :
```jsx
<TopAppBar
  setSelectedCategory={setSelectedCategory}
  loading={loading}
  user={user}
  setSidebarVisible={setSidebarVisible}
  setOpenLoginModal={setOpenLoginModal}
/>
```
par :
```jsx
<TopAppBar />
```

- [ ] **Step 4 : Vérifier syntaxe**

Run:
```bash
node -e "require('@babel/parser').parse(require('fs').readFileSync('src/components/Small/TopAppBar/index.js','utf8'), {sourceType:'module', plugins:['jsx']})"
```
Expected: pas d'erreur.

- [ ] **Step 5 : Test visuel**

`npm start` toujours en cours. Rafraîchir la page.
- La TopAppBar doit afficher : logo 32×32 à gauche + "Baravin 1755" en serif doré à côté.
- Aucun burger, aucun bouton user, aucun bouton résa.
- La TopAppBar reste sticky en haut au scroll.
- Clic sur le bloc logo/nom → retour à `/`.

Playwright MCP :
```
navigate http://localhost:3000
snapshot
browser_take_screenshot task2-topappbar.png
assert locator "header.topappbar" visible
```

- [ ] **Step 6 : Commit**

```bash
git add src/components/Small/TopAppBar src/components/App/App.js
git commit -m "feat(public): TopAppBar minimale DS — logo + nom sérifé

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3 — Retirer le wrapper `CategoriesSidebar` de `App.js`

**Files:**
- Modify: `src/components/App/App.js`

**Note** : on ne supprime pas le dossier `CategoriesSidebar/` à cette étape. Il sera supprimé en Task 11 (cleanup). On retire juste l'usage.

- [ ] **Step 1 : Supprimer l'import et l'état**

Dans `src/components/App/App.js`, supprimer :
```js
import CategoriesSidebar from "../Small/CategoriesSidebar";
```
et la ligne de state :
```js
const [sidebarVisible, setSidebarVisible] = useState(false);
```

- [ ] **Step 2 : Retirer le wrapper dans le JSX**

Dans le `return` de `App`, remplacer le bloc (lignes ~144 à 281) :
```jsx
<CategoriesSidebar
  user={user}
  setActiveMenu={setActiveMenu}
  …
  setSelectedCategory={setSelectedCategory}
>
  <TopAppBar />
  …
</CategoriesSidebar>
```
par son contenu direct (sans le wrapper) :
```jsx
<TopAppBar />
<Divider hidden />
<Login
  setUser={setUser}
  openLoginModal={openLoginModal}
  setOpenLoginModal={setOpenLoginModal}
  setAppMessage={setAppMessage}
/>
<Switch>
  {/* … toutes les routes, inchangées pour l'instant … */}
</Switch>
<Divider />
<Copyright />
```

La `<BottomAppBar …>` reste juste après, au même niveau.

- [ ] **Step 3 : Vérifier syntaxe**

```bash
node -e "require('@babel/parser').parse(require('fs').readFileSync('src/components/App/App.js','utf8'), {sourceType:'module', plugins:['jsx']})"
```

- [ ] **Step 4 : Test visuel**

Rafraîchir navigateur. Naviguer `/`, `/categories/vins`.
- Les pages s'affichent toujours.
- Plus de Sidebar possible (le burger n'existe plus en Task 2 de toute façon).
- Pas de régression layout (pas de marge/padding étrange).

- [ ] **Step 5 : Commit**

```bash
git add src/components/App/App.js
git commit -m "refactor(public): retirer le wrapper CategoriesSidebar de App.js

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4 — Hook `useCategoriesTree` + page landing `/categories`

**Files:**
- Create: `src/services/useCategoriesTree.js`
- Create: `src/pages/CategoriesLanding/index.js`
- Create: `src/pages/CategoriesLanding/categoriesLanding.css`
- Modify: `src/components/App/App.js` (ajout de la route)

- [ ] **Step 1 : Créer le hook `useCategoriesTree`**

Créer `src/services/useCategoriesTree.js` :
```js
import { useEffect, useState } from "react";
import { fetchTree } from "./categoriesApi";

let cache = null;
let pending = null;
const subscribers = new Set();

function notify() {
  subscribers.forEach((cb) => { try { cb(cache); } catch (e) { /* noop */ } });
}

async function loadOnce() {
  if (pending) return pending;
  pending = fetchTree()
    .then((tree) => {
      cache = Array.isArray(tree) ? tree : [];
      notify();
      return cache;
    })
    .catch((err) => {
      console.error("[useCategoriesTree] fetch tree failed", err);
      cache = [];
      notify();
      return cache;
    });
  return pending;
}

export function useCategoriesTree() {
  const [tree, setTree] = useState(cache || []);
  useEffect(() => {
    if (cache) { setTree(cache); return undefined; }
    const cb = (c) => setTree(c || []);
    subscribers.add(cb);
    loadOnce();
    return () => { subscribers.delete(cb); };
  }, []);
  return tree;
}
```

Ce hook expose les catégories **au format brut** (avec `icon` nom string, `iconColor`, `badge`, `children`, `visible`, `order`), pour permettre aux consommateurs publics de re-rendre les icônes à la taille voulue.

- [ ] **Step 2 : Créer la page `CategoriesLanding`**

Créer `src/pages/CategoriesLanding/index.js` :
```jsx
import React from "react";
import { Link } from "react-router-dom";
import { ICON_MAP } from "../../design-system";
import { useCategoriesTree } from "../../services/useCategoriesTree";
import "./categoriesLanding.css";

const CategoriesLanding = () => {
  const tree = useCategoriesTree();
  const roots = (tree || [])
    .filter((c) => c && c.visible !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <main className="cat-landing ds-root">
      <header className="cat-landing-header">
        <h1 className="cat-landing-title">La carte</h1>
        <p className="cat-landing-sub">Explorer par catégorie</p>
      </header>
      {roots.length === 0 ? (
        <p className="cat-landing-empty">Chargement…</p>
      ) : (
        <div className="cat-landing-grid">
          {roots.map((cat) => {
            const Icon = ICON_MAP[cat.icon] || null;
            return (
              <Link
                key={cat.slug}
                to={`/categories/${cat.slug}`}
                className="cat-landing-card"
              >
                {Icon && (
                  <Icon
                    size={32}
                    strokeWidth={1.75}
                    style={{ color: cat.iconColor || "var(--ds-accent-gold, #D4A24C)" }}
                  />
                )}
                <span className="cat-landing-card-name">{cat.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
};

export default CategoriesLanding;
```

- [ ] **Step 3 : Créer le CSS de la landing**

Créer `src/pages/CategoriesLanding/categoriesLanding.css` :
```css
.cat-landing {
  padding: var(--ds-space-5, 20px) var(--ds-space-4, 16px);
  padding-bottom: calc(80px + var(--ds-safe-bottom, 0px));
  max-width: 640px;
  margin: 0 auto;
}

.cat-landing-header {
  margin-bottom: var(--ds-space-6, 24px);
}

.cat-landing-title {
  font-family: var(--ds-font-serif, "DM Serif Display", Georgia, serif);
  font-size: var(--ds-size-display, 28px);
  color: var(--ds-accent-gold, #D4A24C);
  margin: 0 0 var(--ds-space-1, 4px);
}

.cat-landing-sub {
  color: var(--ds-text-muted, #9A8B90);
  font-size: var(--ds-size-small, 13px);
  margin: 0;
}

.cat-landing-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--ds-space-3, 12px);
}

.cat-landing-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-2, 8px);
  padding: var(--ds-space-5, 20px) var(--ds-space-3, 12px);
  background: var(--ds-bg-surface, #1B1118);
  border: 1px solid var(--ds-border-subtle, #2C1E25);
  border-radius: var(--ds-radius-md, 16px);
  color: var(--ds-text-primary, #F5EFE8);
  text-decoration: none;
  min-height: 110px;
  transition: background 120ms ease;
}

.cat-landing-card:active {
  background: var(--ds-bg-elevated, #241820);
}

.cat-landing-card-name {
  font-family: var(--ds-font-serif, "DM Serif Display", Georgia, serif);
  font-size: var(--ds-size-h2, 18px);
  text-align: center;
}

.cat-landing-empty {
  color: var(--ds-text-muted, #9A8B90);
  font-size: var(--ds-size-small, 13px);
  text-align: center;
  padding: var(--ds-space-6, 24px) 0;
}
```

- [ ] **Step 4 : Brancher la route**

Dans `src/components/App/App.js`, ajouter l'import :
```js
import CategoriesLanding from "../../pages/CategoriesLanding";
```
Dans le `<Switch>`, ajouter la route **avant** la route `/categories/:categorie` :
```jsx
<Route exact path="/categories">
  <CategoriesLanding />
</Route>
<Route path="/categories/:categorie">
  …
</Route>
```

- [ ] **Step 5 : Vérifier syntaxe**

```bash
node -e "require('@babel/parser').parse(require('fs').readFileSync('src/pages/CategoriesLanding/index.js','utf8'), {sourceType:'module', plugins:['jsx']})"
node -e "require('@babel/parser').parse(require('fs').readFileSync('src/services/useCategoriesTree.js','utf8'), {sourceType:'module', plugins:['jsx']})"
node -e "require('@babel/parser').parse(require('fs').readFileSync('src/components/App/App.js','utf8'), {sourceType:'module', plugins:['jsx']})"
```

- [ ] **Step 6 : Test visuel**

Dans le navigateur : aller sur `/categories` (HashRouter → `#/categories`). Vérifier :
- Titre "La carte" en serif doré.
- Grille 2 colonnes avec toutes les catégories racines visibles.
- Chaque card = icône Lucide + nom.
- Tap sur une card → navigue vers `/categories/:slug` (page existante, encore en style Semantic).
- La tab "Carte" de la BottomAppBar pointe bien sur cette landing.

Playwright :
```
navigate http://localhost:3000/#/categories
snapshot
browser_take_screenshot task4-landing.png
browser_click text "Vins"
assert url contains "/categories/vins"
```

- [ ] **Step 7 : Commit**

```bash
git add src/services/useCategoriesTree.js src/pages/CategoriesLanding src/components/App/App.js
git commit -m "feat(public): landing /categories + hook useCategoriesTree

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5 — Réécrire la Home (hero + event + raccourcis)

**Files:**
- Modify: `src/pages/Home/index.js`
- Modify: `src/pages/Home/home.css`

- [ ] **Step 1 : Réécrire `Home/index.js`**

Remplacer tout le contenu par :
```jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { Button, ICON_MAP } from "../../design-system";
import { useCategoriesTree } from "../../services/useCategoriesTree";
import { $SERVER } from "../../_const/_const";
import "./home.css";

const formatEventDate = (d) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  } catch { return ""; }
};

const arrayBufferToBase64 = (buffer) => {
  let binary = "";
  const bytes = [].slice.call(new Uint8Array(buffer));
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return window.btoa(binary);
};

const Home = ({ event }) => {
  const tree = useCategoriesTree();
  const featured = (tree || [])
    .filter((c) => c && c.visible !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .slice(0, 3);

  const hasEvent = event && Object.keys(event).length > 0;
  const vote = typeof window !== "undefined" ? localStorage.getItem("1755-event") : null;
  const [like, setLike] = useState(0);

  useEffect(() => {
    if (hasEvent) setLike(event.like || 0);
    if (vote && event?._id && vote !== event._id) {
      localStorage.removeItem("1755-event");
    }
  }, [event, hasEvent, vote]);

  const handleLike = () => {
    if (vote || !event?._id) return;
    localStorage.setItem("1755-event", event._id);
    axios.post(`${$SERVER}/api/events/updateLikes`, { _id: event._id });
    setLike((n) => n + 1);
  };

  let eventImageSrc = null;
  if (hasEvent && event.image?.data?.data) {
    eventImageSrc = `data:${event.image.contentType};base64,${arrayBufferToBase64(event.image.data.data)}`;
  }

  return (
    <main className="home ds-root">
      <section className="home-hero">
        <div className="home-hero-band">
          <img
            src="./assets/images/1755medium.png"
            alt="Logo Baravin 1755"
            className="home-hero-logo"
          />
        </div>
        <h1 className="home-hero-title">Baravin 1755</h1>
        <p className="home-hero-sub">Bar à vin — Ajaccio</p>
      </section>

      {hasEvent && (
        <article className="home-event">
          {eventImageSrc && (
            <div className="home-event-image" style={{ backgroundImage: `url(${eventImageSrc})` }} />
          )}
          <div className="home-event-body">
            <span className="home-event-label">À l'affiche</span>
            <h2 className="home-event-name">{event.name}</h2>
            {event.date && <p className="home-event-date">{formatEventDate(event.date)}</p>}
            {event.description && <p className="home-event-desc">{event.description}</p>}
            <div className="home-event-like">
              <Button
                variant={vote ? "secondary" : "primary"}
                disabled={!!vote}
                onClick={handleLike}
                aria-label="J'aime cet événement"
              >
                <Heart size={16} fill={vote ? "currentColor" : "none"} />
                <span>{like}</span>
              </Button>
            </div>
          </div>
        </article>
      )}

      {featured.length > 0 && (
        <section className="home-featured">
          <span className="home-featured-label">Explorer la carte</span>
          <div className="home-featured-grid">
            {featured.map((c) => {
              const Icon = ICON_MAP[c.icon] || null;
              return (
                <Link key={c.slug} to={`/categories/${c.slug}`} className="home-featured-tile">
                  {Icon && (
                    <Icon
                      size={24}
                      strokeWidth={1.75}
                      style={{ color: c.iconColor || "var(--ds-accent-gold, #D4A24C)" }}
                    />
                  )}
                  <span className="home-featured-name">{c.name}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
};

export default Home;
```

**Attention** : si le DS `Button` n'a pas de variante `"secondary"`, supprimer le ternaire et mettre `variant="primary"` sans condition, ou lire `src/design-system/components/Button.css` pour confirmer les variantes disponibles avant de générer le code. Ajuster si besoin.

- [ ] **Step 2 : Réécrire `home.css`**

Remplacer tout le contenu de `src/pages/Home/home.css` par :
```css
.home {
  max-width: 640px;
  margin: 0 auto;
  padding-bottom: calc(80px + var(--ds-safe-bottom, 0px));
}

/* Hero */
.home-hero {
  text-align: center;
  padding-bottom: var(--ds-space-5, 20px);
}

.home-hero-band {
  height: 160px;
  background: linear-gradient(180deg, var(--ds-bg-elevated, #241820), var(--ds-bg-deep, #0E0A10));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--ds-space-3, 12px);
}

.home-hero-logo {
  height: 90px;
  width: auto;
  object-fit: contain;
}

.home-hero-title {
  font-family: var(--ds-font-serif, "DM Serif Display", Georgia, serif);
  font-size: var(--ds-size-display, 28px);
  color: var(--ds-accent-gold, #D4A24C);
  margin: 0 0 var(--ds-space-1, 4px);
}

.home-hero-sub {
  color: var(--ds-text-muted, #9A8B90);
  font-size: var(--ds-size-small, 13px);
  margin: 0;
}

/* Event card */
.home-event {
  margin: var(--ds-space-5, 20px) var(--ds-space-4, 16px);
  background: var(--ds-bg-surface, #1B1118);
  border: 1px solid var(--ds-border-subtle, #2C1E25);
  border-radius: var(--ds-radius-md, 16px);
  box-shadow: var(--ds-shadow-card, 0 4px 12px rgba(0,0,0,0.35));
  overflow: hidden;
}

.home-event-image {
  height: 140px;
  background-size: cover;
  background-position: center;
  background-color: var(--ds-bg-elevated, #241820);
}

.home-event-body {
  padding: var(--ds-space-4, 16px);
}

.home-event-label {
  display: inline-block;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: var(--ds-size-tiny, 11px);
  color: var(--ds-text-muted, #9A8B90);
  margin-bottom: var(--ds-space-2, 8px);
}

.home-event-name {
  font-family: var(--ds-font-serif, "DM Serif Display", Georgia, serif);
  font-size: var(--ds-size-h1, 22px);
  color: var(--ds-text-primary, #F5EFE8);
  margin: 0 0 var(--ds-space-1, 4px);
}

.home-event-date {
  color: var(--ds-text-muted, #9A8B90);
  font-size: var(--ds-size-small, 13px);
  margin: 0 0 var(--ds-space-2, 8px);
}

.home-event-desc {
  color: var(--ds-text-primary, #F5EFE8);
  font-size: var(--ds-size-body, 15px);
  line-height: 1.45;
  margin: 0 0 var(--ds-space-3, 12px);
}

.home-event-like .ds-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-2, 8px);
}

/* Featured shortcuts */
.home-featured {
  margin: var(--ds-space-5, 20px) var(--ds-space-4, 16px);
}

.home-featured-label {
  display: block;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: var(--ds-size-tiny, 11px);
  color: var(--ds-text-muted, #9A8B90);
  margin-bottom: var(--ds-space-3, 12px);
}

.home-featured-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--ds-space-2, 8px);
}

.home-featured-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-2, 8px);
  padding: var(--ds-space-3, 12px);
  background: var(--ds-bg-surface, #1B1118);
  border: 1px solid var(--ds-border-subtle, #2C1E25);
  border-radius: var(--ds-radius-md, 16px);
  color: var(--ds-text-primary, #F5EFE8);
  text-decoration: none;
  min-height: 80px;
  transition: background 120ms ease;
}

.home-featured-tile:active {
  background: var(--ds-bg-elevated, #241820);
}

.home-featured-name {
  font-size: var(--ds-size-small, 13px);
  text-align: center;
}
```

- [ ] **Step 3 : Vérifier syntaxe**

```bash
node -e "require('@babel/parser').parse(require('fs').readFileSync('src/pages/Home/index.js','utf8'), {sourceType:'module', plugins:['jsx']})"
```

- [ ] **Step 4 : Test visuel**

Aller sur `/` dans le navigateur. Vérifier :
- Hero bandeau sombre avec logo 1755 centré.
- "Baravin 1755" en serif doré.
- Baseline "Bar à vin — Ajaccio" en muted.
- Si un event est actif : image en tête, label "À l'affiche", nom, date en français, description, bouton like fonctionnel.
- Raccourcis : 3 tuiles cliquables (les 3 premières catégories racines visibles triées par `order`).
- Clic sur une tuile → `/categories/:slug`.

Playwright :
```
navigate http://localhost:3000/
browser_take_screenshot task5-home.png
assert locator "h1.home-hero-title" text "Baravin 1755"
browser_click "a.home-featured-tile" (first)
assert url contains "/categories/"
```

- [ ] **Step 5 : Commit**

```bash
git add src/pages/Home
git commit -m "feat(public): Home éditoriale — hero + event card + raccourcis

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6 — Nouveau composant `CategoryFilterPills`

**Files:**
- Create: `src/components/Small/CategoryFilterPills/index.js`
- Create: `src/components/Small/CategoryFilterPills/categoryFilterPills.css`

Ce composant remplace `ProductsFilteringMenu` (Semantic Menu + Dropdown). Il gère deux niveaux visibles : rangée principale (pills parent) + rangée enfant indentée quand un parent a des sous-enfants.

- [ ] **Step 1 : Créer le composant**

Créer `src/components/Small/CategoryFilterPills/index.js` :
```jsx
import React from "react";
import "./categoryFilterPills.css";

const WINE_PILL_COLORS = {
  rouges: "#6B1A2C",
  roses: "#8a5560",
  blancs: "#9a7a32",
};

const CategoryFilterPills = ({
  subCategories = [],
  products = [],
  activeMenu,
  setActiveMenu,
  dropdownValue,
  setDropdownValue,
  typeSlug,
}) => {
  if (!subCategories || subCategories.length === 0) return null;

  const totalVisible = products.filter((p) => p.visible).length;
  const countBySubCategory = (slug) =>
    products.filter((p) => p.category === slug && p.visible).length;
  const countBySubSub = (slug) =>
    products.filter((p) => p.subCategory === slug && p.visible).length;

  const isWine = typeSlug === "vins";

  const activeParent = subCategories.find((s) => s.slug === activeMenu);
  const hasChildren = !!(activeParent && Array.isArray(activeParent.subCat) && activeParent.subCat.length > 0);

  const onClickParent = (slug) => {
    if (activeMenu === slug) {
      setActiveMenu("");
      setDropdownValue("");
    } else {
      setActiveMenu(slug);
      setDropdownValue("");
    }
  };

  const onClickChild = (slug) => {
    if (dropdownValue === slug) setDropdownValue("");
    else setDropdownValue(slug);
  };

  return (
    <div className="cfp">
      <div className="cfp-row">
        <button
          type="button"
          className={`cfp-pill${!activeMenu ? " cfp-pill--active" : ""}`}
          onClick={() => { setActiveMenu(""); setDropdownValue(""); }}
        >
          Tous<span className="cfp-badge">{totalVisible}</span>
        </button>
        {subCategories.map((s) => {
          const isActive = activeMenu === s.slug;
          const wineColor = isWine ? WINE_PILL_COLORS[s.slug] : null;
          const style = isActive && wineColor
            ? { background: wineColor, borderColor: wineColor, color: s.slug === "blancs" ? "#0E0A10" : "#F5EFE8" }
            : undefined;
          return (
            <button
              key={s.slug}
              type="button"
              className={`cfp-pill${isActive ? " cfp-pill--active" : ""}`}
              style={style}
              onClick={() => onClickParent(s.slug)}
            >
              {s.name}<span className="cfp-badge">{countBySubCategory(s.slug)}</span>
            </button>
          );
        })}
      </div>

      {hasChildren && (
        <>
          <div className="cfp-label">Affiner</div>
          <div className="cfp-subrow">
            {activeParent.subCat.map((sc) => (
              <button
                key={sc.slug}
                type="button"
                className={`cfp-subpill${dropdownValue === sc.slug ? " cfp-subpill--active" : ""}`}
                onClick={() => onClickChild(sc.slug)}
              >
                {sc.name}<span className="cfp-subbadge">{countBySubSub(sc.slug)}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CategoryFilterPills;
```

- [ ] **Step 2 : Créer le CSS**

Créer `src/components/Small/CategoryFilterPills/categoryFilterPills.css` :
```css
.cfp {
  margin-bottom: var(--ds-space-4, 16px);
}

.cfp-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2, 8px);
  margin-bottom: var(--ds-space-2, 8px);
}

.cfp-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-1, 4px);
  padding: 6px 12px;
  border-radius: var(--ds-radius-pill, 999px);
  background: var(--ds-bg-surface, #1B1118);
  border: 1px solid var(--ds-border-subtle, #2C1E25);
  color: var(--ds-text-primary, #F5EFE8);
  font-family: var(--ds-font-sans, "Inter", system-ui, sans-serif);
  font-size: var(--ds-size-small, 13px);
  cursor: pointer;
}

.cfp-pill--active {
  background: var(--ds-accent-wine, #6B1A2C);
  border-color: var(--ds-accent-wine, #6B1A2C);
  color: var(--ds-text-primary, #F5EFE8);
}

.cfp-badge {
  background: rgba(255, 255, 255, 0.08);
  padding: 1px 6px;
  border-radius: var(--ds-radius-pill, 999px);
  font-size: var(--ds-size-tiny, 11px);
}

.cfp-pill--active .cfp-badge {
  background: rgba(0, 0, 0, 0.25);
}

.cfp-label {
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: var(--ds-size-tiny, 11px);
  color: var(--ds-text-muted, #9A8B90);
  margin: 0 0 var(--ds-space-1, 4px) var(--ds-space-3, 12px);
}

.cfp-subrow {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-1, 4px);
  padding-left: var(--ds-space-2, 8px);
  border-left: 2px solid var(--ds-accent-wine, #6B1A2C);
  margin: 0 0 var(--ds-space-3, 12px) var(--ds-space-1, 4px);
}

.cfp-subpill {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-1, 4px);
  padding: 5px 10px;
  border-radius: var(--ds-radius-pill, 999px);
  background: transparent;
  border: 1px solid var(--ds-border-subtle, #2C1E25);
  color: var(--ds-text-muted, #9A8B90);
  font-family: var(--ds-font-sans, "Inter", system-ui, sans-serif);
  font-size: var(--ds-size-tiny, 11px);
  cursor: pointer;
}

.cfp-subpill--active {
  background: var(--ds-accent-gold, #D4A24C);
  border-color: var(--ds-accent-gold, #D4A24C);
  color: var(--ds-bg-deep, #0E0A10);
}

.cfp-subbadge {
  background: rgba(255, 255, 255, 0.06);
  padding: 1px 5px;
  border-radius: var(--ds-radius-pill, 999px);
  font-size: var(--ds-size-tiny, 11px);
}

.cfp-subpill--active .cfp-subbadge {
  background: rgba(0, 0, 0, 0.15);
  color: var(--ds-bg-deep, #0E0A10);
}
```

- [ ] **Step 3 : Vérifier syntaxe**

```bash
node -e "require('@babel/parser').parse(require('fs').readFileSync('src/components/Small/CategoryFilterPills/index.js','utf8'), {sourceType:'module', plugins:['jsx']})"
```

- [ ] **Step 4 : Commit**

```bash
git add src/components/Small/CategoryFilterPills
git commit -m "feat(public): composant CategoryFilterPills (2 niveaux visibles)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7 — Réécrire la page `Categories/:slug` (lecture seule stricte)

**Files:**
- Modify: `src/pages/Categories/index.js`
- Modify: `src/pages/Categories/categories.css`
- Modify: `src/components/App/App.js` (retirer les props admin obsolètes)

- [ ] **Step 1 : Réécrire `Categories/index.js`**

Remplacer tout le contenu par :
```jsx
/* eslint-disable react-hooks/exhaustive-deps */
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import Loader from "../../components/Small/Loader";
import ProductItem from "../../components/Small/ProductItem";
import CategoryFilterPills from "../../components/Small/CategoryFilterPills";
import { useCategories } from "../../services/useCategories";
import { $SERVER } from "../../_const/_const";
import "./categories.css";

const Categories = ({
  setFilteredProducts,
  selectedCategory,
  setSelectedCategory,
  dropdownValue,
  activeMenu,
  setActiveMenu,
  setDropdownValue,
  filteredProducts,
  productsVersion,
  setSelectedProduct,
  setOpenImageModal,
}) => {
  const params = useParams();
  const categories = useCategories();
  const { name, subCategories, slug } = selectedCategory;
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const cacheRef = useRef({});
  const lastVersionRef = useRef(productsVersion);

  useEffect(() => {
    const s = params?.categorie;
    if (!s) return;
    if (selectedCategory?.slug === s) return;
    if (!categories.length) return;
    const match = categories.find((c) => c.slug === s);
    if (match) setSelectedCategory(match);
  }, [params?.categorie, categories]);

  useEffect(() => {
    const type = selectedCategory?.slug;
    if (!type) return;
    const lang = (navigator.language || "fr").toLowerCase().slice(0, 2);
    const cacheKey = `${type}_${lang}`;

    if (productsVersion !== lastVersionRef.current) {
      cacheRef.current = {};
      lastVersionRef.current = productsVersion;
    } else if (cacheRef.current[cacheKey]) {
      setProducts(cacheRef.current[cacheKey]);
      return;
    }

    setLoading(true);
    axios
      .get(`${$SERVER}/api/products`, { params: { type, lang } })
      .then((res) => {
        const data = res.data.data || [];
        cacheRef.current[cacheKey] = data;
        setProducts(data);
      })
      .catch((err) => console.error("fetch products error", err))
      .finally(() => setLoading(false));
  }, [selectedCategory, productsVersion]);

  useEffect(() => {
    if (!products.length) { setFilteredProducts([]); return; }
    if (dropdownValue) {
      setFilteredProducts(products.filter((p) => p.subCategory === dropdownValue));
    } else if (activeMenu) {
      setFilteredProducts(products.filter((p) => p.category === activeMenu));
    } else {
      setFilteredProducts(products);
    }
  }, [products, activeMenu, dropdownValue]);

  const headerTitle = (() => {
    const parent = subCategories?.find((s) => s.slug === activeMenu);
    if (parent) return `${name} — ${parent.name}`;
    return name || "";
  })();

  const visibleProducts = (filteredProducts || [])
    .filter((p) => p.visible)
    .sort((a, b) => {
      if (!!a.choice !== !!b.choice) return a.choice ? -1 : 1;
      return (a.price || 0) - (b.price || 0);
    });

  return (
    <main className="categories ds-root">
      <h1 className="categories-title">{headerTitle}</h1>

      <CategoryFilterPills
        subCategories={subCategories || []}
        products={products}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        dropdownValue={dropdownValue}
        setDropdownValue={setDropdownValue}
        typeSlug={slug}
      />

      {loading && (
        <div className="categories-loader">
          <Loader />
        </div>
      )}

      {!loading && visibleProducts.length === 0 && (
        <p className="categories-empty">Aucun produit disponible pour cette sélection.</p>
      )}

      <div className="categories-products">
        {!loading &&
          visibleProducts.map((p) => (
            <ProductItem
              key={p._id}
              product={p}
              setOpenImageModal={setOpenImageModal}
              setSelectedProduct={setSelectedProduct}
            />
          ))}
      </div>
    </main>
  );
};

export default Categories;
```

Changements fonctionnels :
- Handlers `handleDeleteProduct`, `handleChangeVisibility`, `handleChangeChoice` **supprimés** (lecture seule stricte).
- Tri : `choice: true` prioritaires, puis prix croissant.
- Header simplifié : `"Vins"` ou `"Vins — Rouges"` si un parent est actif.
- `<Transition>` Semantic retiré.
- `ProductsFilteringMenu` → `CategoryFilterPills`.
- Filtre interactions : dropdownValue l'emporte sur activeMenu.

- [ ] **Step 2 : Réécrire `categories.css`**

Remplacer tout le contenu par :
```css
.categories {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--ds-space-4, 16px);
  padding-bottom: calc(80px + var(--ds-safe-bottom, 0px));
  color: var(--ds-text-primary, #F5EFE8);
}

.categories-title {
  font-family: var(--ds-font-serif, "DM Serif Display", Georgia, serif);
  font-size: var(--ds-size-display, 28px);
  color: var(--ds-accent-gold, #D4A24C);
  margin: var(--ds-space-2, 8px) 0 var(--ds-space-4, 16px);
}

.categories-loader {
  position: fixed;
  inset: 0;
  z-index: var(--ds-z-modal, 300);
  background: rgba(14, 10, 16, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
}

.categories-empty {
  color: var(--ds-text-muted, #9A8B90);
  font-size: var(--ds-size-small, 13px);
  text-align: center;
  padding: var(--ds-space-6, 24px) 0;
}

.categories-products {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1, 4px);
}
```

- [ ] **Step 3 : Nettoyer les props dans `App.js`**

Dans `src/components/App/App.js`, trouver l'usage de `<Categories …>` et retirer les props admin obsolètes : `setOpenLoginModal`, `setOpenAddProductModal`, `setOpenEditProductModal`, `setOpenUpdateImageModal`, `user`. Laisser uniquement :
```jsx
<Categories
  filteredProducts={filteredProducts}
  setFilteredProducts={setFilteredProducts}
  productsVersion={productsVersion}
  selectedCategory={selectedCategory}
  setSelectedCategory={setSelectedCategory}
  activeMenu={activeMenu}
  setActiveMenu={setActiveMenu}
  dropdownValue={dropdownValue}
  setDropdownValue={setDropdownValue}
  setOpenImageModal={setOpenImageModal}
  setSelectedProduct={setSelectedProduct}
/>
```

Si cela fait apparaître des variables d'état inutilisées dans `App.js` (ex: `setOpenAddProductModal`), les nettoyer proprement — mais **attention** : certaines peuvent encore servir pour les admins. Vérifier avec `grep` avant de supprimer.

- [ ] **Step 4 : Vérifier syntaxe**

```bash
node -e "require('@babel/parser').parse(require('fs').readFileSync('src/pages/Categories/index.js','utf8'), {sourceType:'module', plugins:['jsx']})"
node -e "require('@babel/parser').parse(require('fs').readFileSync('src/components/App/App.js','utf8'), {sourceType:'module', plugins:['jsx']})"
```

- [ ] **Step 5 : Test visuel**

Naviguer sur `/categories/vins`. Vérifier :
- Titre "Vins" en serif doré.
- Pills "Tous" + Rouges/Rosés/Blancs, badges avec nombres visibles.
- Clic sur "Rouges" → titre devient "Vins — Rouges", sous-pills apparaissent en retrait.
- Clic sur une sous-pill (ex. Bordeaux) → filtre actif en doré.
- Les produits se filtrent correctement.
- `choice: true` remontent en premier.
- Tester aussi `/categories/cocktails` (pas de sous-niveau).
- Tester `/categories/alcools` (2 niveaux comme vins).

Playwright :
```
navigate http://localhost:3000/#/categories/vins
browser_take_screenshot task7-vins-all.png
browser_click text "Rouges"
browser_take_screenshot task7-vins-rouges.png
assert locator "h1.categories-title" text "Vins — Rouges"
```

- [ ] **Step 6 : Commit**

```bash
git add src/pages/Categories src/components/App/App.js
git commit -m "feat(public): Categories DS — header, CategoryFilterPills, RO strict

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8 — Réécrire `ProductItem` (thumbnail + filet vin + choice card)

**Files:**
- Modify: `src/components/Small/ProductItem/index.js`
- Modify: `src/components/Small/ProductItem/productitem.css`

- [ ] **Step 1 : Réécrire le composant**

Remplacer tout le contenu de `src/components/Small/ProductItem/index.js` par :
```jsx
import React from "react";
import "./productitem.css";

const WINE_FILET = {
  rouges: "#6B1A2C",
  roses: "#8a5560",
  blancs: "#9a7a32",
};

const arrayBufferToBase64 = (buffer) => {
  let binary = "";
  const bytes = [].slice.call(new Uint8Array(buffer));
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return window.btoa(binary);
};

const formatPrice = (p) => {
  if (typeof p !== "number") return "";
  return `${p.toFixed(2).replace(".", ",")}€`;
};

const ProductItem = ({
  product,
  setOpenImageModal,
  setSelectedProduct,
}) => {
  if (!product || !product.visible) return null;

  const { name, type, region, description, price, category, choice, image } = product;

  const filetColor = type === "vins" ? WINE_FILET[category] : null;

  let imageSrc = null;
  if (image?.data?.data) {
    imageSrc = `data:${image.contentType};base64,${arrayBufferToBase64(image.data.data)}`;
  }

  const openImage = (e) => {
    e.stopPropagation();
    if (!imageSrc) return;
    setSelectedProduct(product);
    setOpenImageModal(true);
  };

  const regionLine = [region, product.year].filter(Boolean).join(" · ");

  const Wrapper = choice ? "article" : "div";
  const rootClass = choice ? "pi pi--choice" : "pi";

  return (
    <Wrapper className={rootClass}>
      {filetColor && <span className="pi-filet" style={{ background: filetColor }} />}
      {choice && <span className="pi-choice-badge">★ COUP DE CŒUR</span>}
      {imageSrc && (
        <button
          type="button"
          className="pi-thumb"
          onClick={openImage}
          aria-label={`Voir la photo de ${name}`}
        >
          <img src={imageSrc} alt={name} />
        </button>
      )}
      <div className="pi-body">
        <div className="pi-name">{name}</div>
        {regionLine && <div className="pi-region">{regionLine}</div>}
        {description && <p className="pi-desc">{description}</p>}
      </div>
      <div className="pi-price">{formatPrice(price)}</div>
    </Wrapper>
  );
};

export default ProductItem;
```

**Note** : si le modèle `Product` n'a pas de champ `year`, le `regionLine` sera juste la région. Vérifier au besoin côté back — le plan n'ajoute pas ce champ.

- [ ] **Step 2 : Réécrire le CSS**

Remplacer tout le contenu de `src/components/Small/ProductItem/productitem.css` par :
```css
.pi {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--ds-space-3, 12px);
  align-items: start;
  padding: var(--ds-space-3, 12px) var(--ds-space-3, 12px);
  border-bottom: 1px solid var(--ds-border-subtle, #2C1E25);
}

.pi:last-child {
  border-bottom: none;
}

.pi-filet {
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  border-radius: 2px;
}

.pi-thumb {
  width: 48px;
  height: 48px;
  padding: 0;
  border: none;
  border-radius: 8px;
  overflow: hidden;
  background: var(--ds-bg-elevated, #241820);
  cursor: pointer;
}

.pi-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.pi-body {
  min-width: 0;
}

.pi-name {
  font-size: var(--ds-size-body, 15px);
  font-weight: 600;
  color: var(--ds-text-primary, #F5EFE8);
  margin-bottom: 2px;
}

.pi-region {
  font-size: var(--ds-size-tiny, 11px);
  color: var(--ds-text-muted, #9A8B90);
  margin-bottom: 2px;
}

.pi-desc {
  font-size: var(--ds-size-small, 13px);
  color: var(--ds-text-muted, #9A8B90);
  line-height: 1.4;
  margin: 0;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.pi-price {
  font-size: var(--ds-size-body, 15px);
  font-weight: 600;
  color: var(--ds-text-primary, #F5EFE8);
  white-space: nowrap;
  align-self: flex-start;
}

/* Variante choice (coup de cœur) */
.pi--choice {
  background: linear-gradient(180deg, rgba(212, 162, 76, 0.08), transparent);
  border: 1px solid rgba(212, 162, 76, 0.35);
  border-radius: var(--ds-radius-md, 16px);
  padding: var(--ds-space-4, 16px);
  margin: var(--ds-space-2, 8px) 0;
}

.pi--choice + .pi--choice {
  margin-top: 0;
}

.pi-choice-badge {
  position: absolute;
  top: 8px;
  right: 12px;
  font-size: var(--ds-size-tiny, 11px);
  letter-spacing: 0.1em;
  color: var(--ds-accent-gold, #D4A24C);
  text-transform: uppercase;
}
```

- [ ] **Step 3 : Vérifier syntaxe**

```bash
node -e "require('@babel/parser').parse(require('fs').readFileSync('src/components/Small/ProductItem/index.js','utf8'), {sourceType:'module', plugins:['jsx']})"
```

- [ ] **Step 4 : Test visuel**

Retourner sur `/categories/vins`. Vérifier pour chaque row :
- Nom en primary blanc (plus de couleur par category).
- Région (et millésime si présent).
- Description ≤ 2 lignes (ellipsis sinon).
- Prix à droite au format `32,00€`.
- Pour un vin rouge : filet bordeaux à gauche (3px). Rosé : rose terne. Blanc : doré.
- Pour un autre type (cocktails, snacking) : pas de filet.
- Si produit a une image : thumbnail 48×48 à gauche, clic → ouvre le modal image (en Task 9 ce sera le Lightbox).
- Les `choice: true` s'affichent en card dorée avec badge "★ COUP DE CŒUR" haut-droite.

Playwright :
```
navigate http://localhost:3000/#/categories/vins
browser_take_screenshot task8-products.png
assert locator ".pi--choice" exists  # au moins un coup de cœur
```

- [ ] **Step 5 : Commit**

```bash
git add src/components/Small/ProductItem
git commit -m "feat(public): ProductItem DS — thumbnail, filet vin, variante choice

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9 — `ImageLightbox` (remplace `ImageModal`)

**Files:**
- Create: `src/components/Medium/Modals/ImageLightbox/index.js`
- Create: `src/components/Medium/Modals/ImageLightbox/imageLightbox.css`
- Modify: `src/components/App/App.js`

- [ ] **Step 1 : Créer le composant**

Créer `src/components/Medium/Modals/ImageLightbox/index.js` :
```jsx
import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";
import "./imageLightbox.css";

const arrayBufferToBase64 = (buffer) => {
  let binary = "";
  const bytes = [].slice.call(new Uint8Array(buffer));
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return window.btoa(binary);
};

const formatPrice = (p) =>
  typeof p === "number" ? `${p.toFixed(2).replace(".", ",")}€` : "";

const ImageLightbox = ({ openImageModal, setOpenImageModal, product }) => {
  useEffect(() => {
    if (!openImageModal) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpenImageModal(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [openImageModal, setOpenImageModal]);

  if (!openImageModal || !product) return null;

  const { image, name, price } = product;
  let src = null;
  if (image?.data?.data) {
    src = `data:${image.contentType};base64,${arrayBufferToBase64(image.data.data)}`;
  }

  return ReactDOM.createPortal(
    <div
      className="ds-root lb-overlay"
      onClick={() => setOpenImageModal(false)}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="lb-close"
        aria-label="Fermer"
        onClick={(e) => { e.stopPropagation(); setOpenImageModal(false); }}
      >
        <X size={28} />
      </button>
      {src && (
        <img
          src={src}
          alt={name || ""}
          className="lb-image"
          onClick={(e) => e.stopPropagation()}
        />
      )}
      <div className="lb-caption" onClick={(e) => e.stopPropagation()}>
        {name && <div className="lb-name">{name}</div>}
        {typeof price === "number" && <div className="lb-price">{formatPrice(price)}</div>}
      </div>
    </div>,
    document.body
  );
};

export default ImageLightbox;
```

- [ ] **Step 2 : Créer le CSS**

Créer `src/components/Medium/Modals/ImageLightbox/imageLightbox.css` :
```css
.lb-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--ds-z-modal, 300);
  background: rgba(14, 10, 16, 0.92);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-4, 16px);
  padding: var(--ds-space-4, 16px);
}

.lb-close {
  position: absolute;
  top: calc(12px + env(safe-area-inset-top, 0px));
  right: 12px;
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: none;
  color: var(--ds-text-primary, #F5EFE8);
  cursor: pointer;
}

.lb-image {
  max-width: 92vw;
  max-height: 80vh;
  object-fit: contain;
  border-radius: var(--ds-radius-md, 16px);
}

.lb-caption {
  text-align: center;
  color: var(--ds-text-primary, #F5EFE8);
}

.lb-name {
  font-family: var(--ds-font-serif, "DM Serif Display", Georgia, serif);
  font-size: var(--ds-size-h1, 22px);
  color: var(--ds-accent-gold, #D4A24C);
  margin-bottom: var(--ds-space-1, 4px);
}

.lb-price {
  font-size: var(--ds-size-body, 15px);
  font-weight: 600;
}
```

- [ ] **Step 3 : Brancher dans App.js**

Dans `src/components/App/App.js` :

Remplacer l'import :
```js
import ImageModal from "../Medium/Modals/ImageModal";
```
par :
```js
import ImageLightbox from "../Medium/Modals/ImageLightbox";
```

Dans le JSX des routes, remplacer :
```jsx
<ImageModal
  openImageModal={openImageModal}
  setOpenImageModal={setOpenImageModal}
  product={selectedProduct}
/>
```
par :
```jsx
<ImageLightbox
  openImageModal={openImageModal}
  setOpenImageModal={setOpenImageModal}
  product={selectedProduct}
/>
```

- [ ] **Step 4 : Vérifier syntaxe**

```bash
node -e "require('@babel/parser').parse(require('fs').readFileSync('src/components/Medium/Modals/ImageLightbox/index.js','utf8'), {sourceType:'module', plugins:['jsx']})"
node -e "require('@babel/parser').parse(require('fs').readFileSync('src/components/App/App.js','utf8'), {sourceType:'module', plugins:['jsx']})"
```

- [ ] **Step 5 : Test visuel**

Aller sur `/categories/<type>` qui contient au moins un produit avec image. Cliquer sur la thumbnail.
- Overlay sombre plein écran avec image centrée, nom et prix en bas.
- Bouton X en haut-droite → ferme.
- Tap sur le fond noir → ferme.
- `Escape` → ferme.
- Scroll du fond bloqué tant que le lightbox est ouvert.

Playwright :
```
navigate http://localhost:3000/#/categories/cocktails
browser_click "button.pi-thumb" (first)
browser_take_screenshot task9-lightbox.png
assert locator ".lb-overlay" visible
browser_press_key Escape
assert locator ".lb-overlay" not visible
```

- [ ] **Step 6 : Commit**

```bash
git add src/components/Medium/Modals/ImageLightbox src/components/App/App.js
git commit -m "feat(public): ImageLightbox plein écran DS (remplace ImageModal)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 10 — `Login` en Sheet DS

**Files:**
- Modify: `src/components/Medium/Modals/Login/index.js`

- [ ] **Step 1 : Réécrire le composant**

Remplacer tout le contenu de `src/components/Medium/Modals/Login/index.js` par :
```jsx
import React, { useState } from "react";
import axios from "axios";
import { Button, Sheet } from "../../../design-system";
import { $SERVER } from "../../../_const/_const";

const Login = ({
  setOpenLoginModal,
  openLoginModal,
  setUser,
  setAppMessage,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onClose = () => {
    setOpenLoginModal(false);
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    axios
      .post(`${$SERVER}/auth/login`, { email, password })
      .then((response) => {
        setUser(response.data.role);
        setAppMessage({
          success: response.data.status === 200,
          message: response.data.message,
        });
        localStorage.setItem("token-1755", response.data.token);
        setOpenLoginModal(false);
      })
      .catch(() => {
        setError("Échec de la connexion. Vérifie tes identifiants.");
      })
      .finally(() => setLoading(false));
  };

  return (
    <Sheet
      open={openLoginModal}
      onClose={onClose}
      title={<h2 className="login-title">Connexion admin</h2>}
    >
      <form id="auth-form" onSubmit={handleSubmit} className="login-form">
        <label className="login-field">
          <span className="login-label">E-mail</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="login-field">
          <span className="login-label">Mot de passe</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="login-error" role="alert">{error}</p>}
        <div className="login-actions">
          <Button
            variant="primary"
            type="submit"
            disabled={email.length === 0 || password.length === 0 || loading}
            block
          >
            {loading ? "Connexion…" : "Se connecter"}
          </Button>
          <button type="button" className="login-cancel" onClick={onClose}>
            Annuler
          </button>
        </div>
      </form>
      <style>{`
        .login-title {
          font-family: var(--ds-font-serif, "DM Serif Display", Georgia, serif);
          font-size: var(--ds-size-h1, 22px);
          color: var(--ds-accent-gold, #D4A24C);
          margin: 0;
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: var(--ds-space-3, 12px);
        }
        .login-field { display: flex; flex-direction: column; gap: 4px; }
        .login-label {
          font-size: var(--ds-size-small, 13px);
          color: var(--ds-text-muted, #9A8B90);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .login-field input {
          background: var(--ds-bg-elevated, #241820);
          border: 1px solid var(--ds-border-subtle, #2C1E25);
          border-radius: var(--ds-radius-sm, 8px);
          color: var(--ds-text-primary, #F5EFE8);
          padding: 10px 12px;
          font-size: var(--ds-size-body, 15px);
        }
        .login-error {
          color: var(--ds-danger, #C0392B);
          font-size: var(--ds-size-small, 13px);
          margin: 0;
        }
        .login-actions {
          display: flex;
          flex-direction: column;
          gap: var(--ds-space-2, 8px);
        }
        .login-cancel {
          background: transparent;
          border: none;
          color: var(--ds-text-muted, #9A8B90);
          font-size: var(--ds-size-small, 13px);
          padding: 8px;
          cursor: pointer;
        }
      `}</style>
    </Sheet>
  );
};

export default Login;
```

**Note** : le `<style>` inline convient ici vu la petite taille. Si tu préfères, extraire dans un `login.css` à côté — même résultat.

- [ ] **Step 2 : Vérifier syntaxe**

```bash
node -e "require('@babel/parser').parse(require('fs').readFileSync('src/components/Medium/Modals/Login/index.js','utf8'), {sourceType:'module', plugins:['jsx']})"
```

- [ ] **Step 3 : Test visuel**

Depuis n'importe quelle page, cliquer sur la tab "Compte" de la BottomAppBar. Vérifier :
- Sheet DS monte depuis le bas.
- Titre serif doré "Connexion admin".
- Champs email + password stylés DS.
- Bouton "Se connecter" bloqué tant qu'un champ est vide.
- Essayer avec mauvaises creds → message d'erreur rouge.
- Essayer avec bonnes creds → sheet se ferme, user connecté (la BottomAppBar passe en mode admin).
- Bouton "Annuler" ou tap sur le fond → ferme.

Playwright :
```
navigate http://localhost:3000/
browser_click "button[aria-label=Compte]" OR text "Compte"
browser_take_screenshot task10-login.png
assert locator ".ds-sheet" visible
```

- [ ] **Step 4 : Commit**

```bash
git add src/components/Medium/Modals/Login
git commit -m "feat(public): Login en Sheet DS

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 11 — Nettoyage final (assets, consts, utils, dossiers morts)

**Files:**
- Delete: `src/components/Small/CategoriesSidebar/` (dossier entier)
- Delete: `src/components/Small/ProductsFilteringMenu/` (dossier entier)
- Delete: `src/components/Medium/Modals/ImageModal/` (dossier entier)
- Delete: `public/assets/images/aCarciaraNormal.png`
- Delete: `public/assets/images/1755small.png`
- Modify: `src/_const/_const.js` (retirer `COLOR_1755`, `COLOR_ACARCIARA` si plus consommés)
- Modify: `src/datas/utils.js` (retirer `isBefore18h` si plus consommé)
- Modify: `.gitignore` (ajouter `.superpowers/`)

- [ ] **Step 1 : Vérifier qu'aucun consommateur ne reste**

```bash
grep -r "CategoriesSidebar" src/ --include="*.js" --include="*.jsx"
grep -r "ProductsFilteringMenu" src/ --include="*.js" --include="*.jsx"
grep -r "ImageModal" src/ --include="*.js" --include="*.jsx"
grep -r "isBefore18h" src/ --include="*.js" --include="*.jsx"
grep -r "COLOR_1755\|COLOR_ACARCIARA" src/ --include="*.js" --include="*.jsx"
grep -r "aCarciaraNormal\|1755small" src/ public/ --include="*.js" --include="*.jsx" --include="*.css" --include="*.html"
```

Expected: aucun résultat (hors les lignes de définition dans `_const.js` / `utils.js` qu'on va supprimer).

Si un consommateur subsiste (typiquement côté admin), **ne pas supprimer** la ressource — signaler au user et ajuster.

- [ ] **Step 2 : Supprimer les dossiers morts**

```bash
rm -rf src/components/Small/CategoriesSidebar
rm -rf src/components/Small/ProductsFilteringMenu
rm -rf src/components/Medium/Modals/ImageModal
```

- [ ] **Step 3 : Supprimer les assets obsolètes**

```bash
rm -f public/assets/images/aCarciaraNormal.png public/assets/images/1755small.png
```

(Si `public/` a une autre organisation, adapter le chemin. `git status` pour confirmer.)

- [ ] **Step 4 : Nettoyer `_const.js`**

Lire `src/_const/_const.js`. Supprimer les lignes qui définissent `COLOR_1755` et `COLOR_ACARCIARA` si les checks step 1 ont confirmé zéro consommateur restant. Laisser `$SERVER` et `GOOGLE_API_KEY` (si présente encore) intactes.

- [ ] **Step 5 : Nettoyer `datas/utils.js`**

Lire `src/datas/utils.js`. Supprimer la fonction `isBefore18h` si aucun consommateur. Si le fichier devient vide après ça, le supprimer :
```bash
# seulement si utils.js ne contient plus que l'export de isBefore18h
rm src/datas/utils.js
```
Sinon, laisser le fichier avec le reste.

- [ ] **Step 6 : Ajouter `.superpowers/` au `.gitignore`**

Lire `.gitignore`. Si `.superpowers/` n'y est pas, ajouter à la fin :
```
.superpowers/
```

- [ ] **Step 7 : Vérifier le build**

```bash
npm run build
```
Expected: build passe sans erreur (warnings acceptables). Si erreur "Cannot find module CategoriesSidebar" ou équivalent, un import traînant est à nettoyer — remonter, corriger, relancer.

- [ ] **Step 8 : Test visuel global**

`npm start`, naviguer sur toutes les routes publiques :
- `/` (Home avec/sans event)
- `/categories` (landing)
- `/categories/vins` (filtre 2 niveaux)
- `/categories/alcools` (idem)
- `/categories/cocktails` (pas de 2e niveau)
- `/categories/snacking`
- Ouvrir le Lightbox sur une image produit.
- Ouvrir le Login, tester connexion et annulation.
- Se connecter, naviguer sur `/admin/*` → vérifier que l'admin fonctionne toujours.
- Se déconnecter.

Playwright — suite de régression rapide :
```
navigate http://localhost:3000/
browser_take_screenshot regression-home.png
navigate http://localhost:3000/#/categories
browser_take_screenshot regression-landing.png
navigate http://localhost:3000/#/categories/vins
browser_take_screenshot regression-vins.png
navigate http://localhost:3000/#/categories/cocktails
browser_take_screenshot regression-cocktails.png
```

Aucune assertion fonctionnelle supplémentaire — les screenshots servent de trace visuelle.

- [ ] **Step 9 : Commit**

```bash
git add -A
git status  # vérifier qu'aucun fichier sensible n'est ajouté (ni _const.js modifié pour debug)
git commit -m "chore(public): nettoyage assets + consts + dossiers morts

Supprime CategoriesSidebar, ProductsFilteringMenu, ImageModal (remplacés).
Supprime isBefore18h + COLOR_1755 + COLOR_ACARCIARA + aCarciaraNormal.png
+ 1755small.png (plus consommés). Ajoute .superpowers/ au gitignore.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Clôture

- [ ] **Dernier passage de relecture des diffs** : `git log --oneline feat/admin-bottom-bar-categories ^origin/feat/admin-bottom-bar-categories` pour revoir tous les commits de la migration.
- [ ] **PAS de `git push` vers main, PAS de `npm run deploy`.** Le plan s'arrête sur la branche locale. Suite : démo client, feu vert, puis déploiement en session séparée.

## Self-review du plan

**Couverture spec** :
- Chrome (TopAppBar + App.js) → Tasks 1, 2, 3 ✓
- Home → Task 5 ✓
- CategoriesLanding → Task 4 ✓
- Categories/:slug + pills → Tasks 6, 7 ✓
- ProductItem → Task 8 ✓
- ImageLightbox → Task 9 ✓
- Login sheet → Task 10 ✓
- Cleanup (assets, consts, utils) → Task 11 ✓
- Contrainte "pas de merge main" → rappelée en prérequis et en clôture ✓

**Types/noms cohérents** :
- `useCategoriesTree` utilisé en Tasks 4 et 5, défini une seule fois en Task 4 ✓.
- `CategoryFilterPills` défini en Task 6, consommé en Task 7 ✓.
- `ImageLightbox` défini en Task 9, consommé depuis App.js ✓.
- Couleurs vins `#6B1A2C / #8a5560 / #9a7a32` répétées à l'identique dans pills (Task 6) et ProductItem (Task 8) ✓.

**Points résiduels à valider à l'implémentation** :
- Variantes du `Button` DS — vérifier que `"primary"` et (éventuellement) `"secondary"` existent dans `src/design-system/components/Button.css`. Sinon ajuster les usages.
- Champ `year` sur le modèle Product : le format `"Région · année"` sera dégradé à juste la région si le champ n'existe pas.
- Si la CSS Semantic UI globale pollue un des nouveaux composants, isoler via sélecteur plus spécifique ou `.ds-root` en préfixe.
