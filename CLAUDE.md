# 1755-front

Front React de la carte du restaurant Baravin1755. Déployé sur GitHub Pages avec le domaine custom `https://baravin1755.com`.

Back compagnon : `/Users/pierrefrancoispaoletti/appdevelopment/1755-back` (Heroku `le-1755`).

## Stack

- React 17 + react-router 5 (HashRouter)
- CRA 4 (`react-scripts`) — build via `NODE_OPTIONS=--openssl-legacy-provider`
- Design system maison dans `src/design-system/` (palette sombre bordeaux/or, Inter + DM Serif Display, composants Button/Sheet/TabBar/ListItem/IconPicker + iconMap Lucide)
- `lucide-react@0.244.0` **pinné** (versions récentes ESM-only cassent CRA 4 / Webpack 4)
- axios (fallback `fetch` pour le streaming admin `/api/products/allProducts`)
- semantic-ui-react encore présent pour quelques wrappers résiduels (`<Transition>` dans App.js, `<Container>` sur `/confidentialite-de-lapp`). Plus de modal Semantic côté admin ni public depuis Plan 4.

## Commandes

```bash
npm start            # dev server (CRA)
npm run build        # build prod
npm run deploy       # build + gh-pages -b master -d build
```

Après `npm run deploy`, **toujours** `git push origin main` pour synchroniser la branche source (gh-pages ne push que `master`).

## Conventions

### `$SERVER` dans `src/_const/_const.js`

La valeur committée pointe **toujours** sur `https://le-1755.herokuapp.com`. Pour tester contre un back local, modifier manuellement vers `http://localhost:8080` (port 8080 parce qu'AirPlay occupe 5000 sur macOS) et **ne jamais commiter** cette modif.

Avant tout `git add` ou `git commit` : vérifier `git status` et exclure `src/_const/_const.js` s'il ne contient que le toggle d'URL. `/src/_const` est dans `.gitignore` partiellement mais `_const.js` est tracké (vestige historique) — la discipline manuelle reste nécessaire.

### Pas de merge sur `main`

Aucun `git push origin main`, aucun `npm run deploy` sans feu vert explicite du user. Le travail vit sur `feat/admin-bottom-bar-categories` jusqu'à validation. Idem côté back.

### Pas de tests automatisés

Pas de Jest/Mocha configuré. Vérification manuelle :
- Syntaxe JSX : `node -e "require('@babel/parser').parse(require('fs').readFileSync('<path>','utf8'), {sourceType:'module', plugins:['jsx']})"`
- UI : `npm start` + navigateur.
- Playwright MCP disponible pour screenshots/assertions si la session le propose.

Ne pas introduire de test framework sans demande explicite.

### Git commits

- `git -c commit.gpgsign=false commit -m "..."` pour éviter les prompts GPG.
- Stage les fichiers explicitement (pas `git add -A`).
- Messages courts, conventional commits (`feat(public):`, `fix(admin):`, `chore:`, `docs(plan):`).

## Architecture clé

### Chrome et shell (App.js)

L'ordre JSX : `<TopAppBar>` (sticky, sombre, logo + nom sérifé), `<Login>` (Sheet DS portal), `<Switch>` routes, `<BottomAppBar>` (fixed bottom, safe-area iOS). La classe `ds-root` est posée sur le `<div className="App ds-root">` racine pour que les variables CSS `--ds-*` cascadent partout.

### Routes

- `/` → Home (hero + event card + 3 raccourcis catégories + footer compact).
- `/categories` → `CategoriesLanding` (grille 2-col des catégories racines visibles).
- `/categories/:categorie` → `Categories` avec `CategoryFilterPills` 2 niveaux.
- `/confidentialite-de-lapp` → texte légal.
- `/admin` + `/admin/{categories,products,events,themes}` → `<RequireAuth>` wrapper.

### Chargement des produits

- **Visiteur public** : `Categories` fait un fetch lazy `GET /api/products?type=<slug>&lang=<iso2>` avec cache `useRef` indexé par `${type}_${lang}`. Guard contre `selectedCategory` stale : on ne fetch que si `selectedCategory.slug === params.categorie` (évite une race lors du change de catégorie via BottomAppBar).
- **Admin connecté** : `App.js` fetch en plus `/api/products/allProducts` (VF brute). Guard par `if (!user) return`.
- **Reset** : au change de slug, `Categories` reset `activeMenu`, `dropdownValue` et vide `products` avant le nouveau fetch.

### Design system

Tokens dans `src/design-system/tokens.css` via variables CSS (`--ds-bg-deep`, `--ds-accent-wine`, `--ds-accent-gold`, typo, espacement, radii). Composants :
- `Button` (variants `primary`, `ghost`, `danger`, modifier `block`).
- `Sheet` (monte depuis le bas, portal sur `document.body` — Semantic `Sidebar.Pushable` casse `position: fixed` sinon, donc portal obligatoire pour tout overlay).
- `TabBar` pour la BottomAppBar.
- `ListItem` avec icon + badge + title + subtitle + trail.
- `IconPicker` pour l'édition catégorie admin.

`iconMap.js` expose `ICON_MAP` (table nom → composant Lucide). Icônes de catégories lookup via `ICON_MAP[cat.icon]`.

### Catégories en DB

Arbre via `GET /api/categories?tree=1` (back Mongoose model `Category`, hiérarchie `parentId`). Deux hooks avec cache module-level + broadcast :
- `useCategories()` — format legacy (`subCategories`, `subCat`), icônes pré-rendues. Consommé par admin CRUD produits, Categories public, CategoryFilterPills.
- `useCategoriesTree()` — tree brut. Consommé par Home featured et CategoriesLanding pour re-rendre les icônes à la taille voulue.

Invalidation : `invalidateCategoriesCache()` + `invalidateCategoriesTreeCache()` après mutation admin. Actuellement wiré sur `moveCategory` et `deleteCategory` dans `/admin/categories`. À étendre au CRUD via `CategoryEditSheet` si besoin.

### Invalidation cache produits après mutations admin

`App.js` détient un compteur `productsVersion`. Les modals `AddProduct`, `EditProduct`, `UpdateImageModal` appellent `setProductsVersion(v => v+1)` sur succès. `Categories` observe ce compteur via un `useRef` → purge `cacheRef.current` quand ça change → refetch frais.

### Images produits

Le back renvoie `image.data` dans 2 shapes différentes selon la langue :
- `lang=fr` : `{ type: "Buffer", data: [bytes...] }` (Mongoose doc brut sérialisé via toJSON).
- autres : base64 string (back fait `p.toObject()` qui casse en string).

Côté front, tout passe par `src/services/image.buildImageSrc(image)` qui gère les 2 shapes. Consommé par `ProductItem`, `ImageLightbox`, Home event card, `UpdateImageModal` preview.

### Traduction

Côté front : aucune. Les descriptions arrivent du back déjà localisées selon `navigator.language.slice(0,2)`. La clé Google Translate n'est **plus** dans le bundle (était `GOOGLE_API_KEY` dans `_const.js`, retirée en 2026-04). `react-auto-translate` désinstallée.

### Loader

`src/components/Small/Loader/` est un overlay standard. Dans `Categories`, wrappé dans `.categories-loader` (`position: fixed; inset: 0; z-index: var(--ds-z-modal)`, fond semi-transparent).

### Admin

- `/admin/categories` : drill-down 3 niveaux, CRUD via `CategoryEditSheet`. Boutons ↑/↓ pour reorder (swap via `moveCategory × 2`), boutons d'action compacts (pills 28px muted).
- `/admin/products` : combobox catégorie typeable (dropdown filtré + croix clear), filtres Visibilité (pills Tous/Visibles/Masqués) + toggle Coups de cœur. Cards `ListItem` avec icône catégorie résolue en cascade `subCategory → category → type`, badge Star doré si `choice: true`. Tap sur card = édition. Boutons d'action identiques à `/admin/categories`.
- `/admin/events` : CRUD via `AddEvent` et `EditEvent` en Sheet DS.
- `/admin/themes` : lecture seule (V2 pour édition).

Toutes les modals admin (`AddEvent`, `EditEvent`, `AddProduct`, `EditProduct`, `UpdateImageModal`) partagent le CSS `src/components/Medium/Modals/AddProduct/productModal.css`. Actions en row : Annuler à gauche, Enregistrer/Ajouter à droite. Les sélections Type/Catégorie/Sous-catégorie utilisent des pills DS (remplacent les Radio Semantic en cascade). `needsCategory` / `needsSubCategory` dérivés dynamiquement du tree (`subCategories.length` / `subCat.length`), plus de hardcoded.

## Structure de données produit (depuis le back)

```js
{
  _id, name, description, region, price, type,
  category, subCategory, choice, visible, image
}
```

`translations` et `descriptionHash` existent côté back mais sont masqués dans les réponses publiques (endpoint `GET /api/products`).

## Points d'attention

- Route back produits : `/api/products?type=X&lang=Y` (publique, localisée) ou `/api/products/allProducts` (admin, VF). Ne pas confondre.
- Mutations admin (`POST /api/products/updateProduct`, etc.) renvoient toute la DB produits (tous types confondus). Filtrer par `type` côté consumer si besoin.
- BG mode sombre : `html`, `body` et `.App` ont tous `#0E0A10` en background + `min-height: 100vh` sur body et .App pour éviter la bande blanche sous le footer.
- `react-image-file-resizer` utilisé dans `AddProduct`, `AddEvent`, `UpdateImageModal` pour compresser à 363×360 JPEG qualité `COMPRESSION_QUALITY` (dans `_const.js`) avant upload multipart.
- Le compteur de like event (`POST /api/events/updateLikes`) se base sur `localStorage['1755-event']` côté front (1 vote par device + event).

## Documentation projet

Specs et plans d'exécution dans `docs/superpowers/` :
- `specs/2026-04-18-admin-bottom-bar-design.md` — design admin bottom bar.
- `specs/2026-04-18-i18n-server-side-design.md` — traduction serveur-side.
- `specs/2026-04-18-public-visual-migration-design.md` — migration visuelle publique.
- `plans/2026-04-18-plan-1-back-categories.md`
- `plans/2026-04-18-plan-2-front-shell.md`
- `plans/2026-04-18-plan-3-admin-functional.md`
- `plans/2026-04-18-plan-4-public-visual-migration.md`
