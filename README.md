# 1755-front

Front React de la carte du restaurant Baravin1755.

- **Prod** : https://baravin1755.com (GitHub Pages sur le repo `pierrefrancoispaoletti/1755-front`, branche `master` via `gh-pages`).
- **Back compagnon** : https://le-1755.herokuapp.com (repo `1755-back`, Heroku app `le-1755`).

## Stack

- React 17 + react-router 5 (HashRouter)
- CRA 4 / react-scripts (build avec `NODE_OPTIONS=--openssl-legacy-provider`)
- Design system maison `src/design-system/` (palette sombre bordeaux/or, Inter + DM Serif Display, composants Button / TabBar / Sheet / ListItem / IconPicker, iconMap Lucide)
- axios (fallback `fetch` pour le streaming admin)
- `lucide-react@0.244.0` (pinné, versions récentes ESM-only cassent CRA 4 / Webpack 4)
- **Semantic UI totalement retiré** depuis 2026-04-20

## Commandes

```bash
npm start            # dev server sur http://localhost:3000
npm run build        # build prod
npm run deploy       # build + gh-pages -b master -d build
```

Après `npm run deploy`, **toujours** faire `git push origin main` pour synchroniser la branche source (gh-pages ne pousse que `master`).

## Environnement local

`src/_const/_const.js` contient l'URL du back. **La valeur committée pointe toujours sur `https://le-1755.herokuapp.com`.** Pour tester en local contre un back local, modifier la ligne manuellement vers `http://localhost:8080` (port 8080 parce qu'AirPlay occupe 5000 sur macOS) et **ne jamais commiter** cette modif.

Avant tout `git add` / `git commit` : vérifier `git status` et exclure `src/_const/_const.js` s'il ne contient que le toggle d'URL.

## Structure

```
src/
├── _const/          # $SERVER + constantes (gitignored car toggle local)
├── components/
│   ├── App/         # App.js racine, routes, chrome, état lifté
│   ├── Medium/Modals/
│   │   ├── AddEvent/ EditEvent/
│   │   ├── AddProduct/ EditProduct/ UpdateImageModal/  # modals admin en Sheet DS
│   │   ├── ImageLightbox/                              # zoom image produit public
│   │   └── Login/                                      # login admin en Sheet DS
│   └── Small/
│       ├── BottomAppBar/                 # tab bar persistante (visiteur + admin)
│       ├── CategoryFilterPills/          # pills 2 niveaux sur /categories/:slug
│       ├── Copyright/                    # footer compact sur la Home
│       ├── Loader/
│       ├── ProductItem/                  # row produit DS (thumbnail + filet vin + choice)
│       ├── RequireAuth/                  # garde-fou /admin/*
│       └── TopAppBar/                    # bandeau logo + nom sérifé
├── design-system/
│   ├── tokens.css                        # --ds-* variables palette / typo / espacement
│   ├── iconMap.js                        # Lucide icons par nom
│   ├── components/ (Button, Sheet, TabBar, ListItem, IconPicker)
│   └── index.js
├── pages/
│   ├── Admin/ (Categories, Products, Events, Themes, Home, CategoryEditSheet)
│   ├── Categories/                       # /categories/:slug (lecture seule stricte)
│   ├── CategoriesLanding/                # /categories (landing grille 2-col)
│   └── Home/                              # / avec hero + event + raccourcis + footer
└── services/
    ├── categoriesApi.js                   # fetchTree, fetchFlat, CRUD JWT
    ├── useCategories.js                   # hook tree legacy (avec icônes JSX rendues)
    ├── useCategoriesTree.js               # hook tree brut (pour rendu custom)
    ├── categoriesAdapter.js               # treeToLegacy (filtre visible à tous niveaux)
    └── image.js                           # buildImageSrc (shape fr/non-fr)
```

## Architecture clé

### Routing et shell

`App.js` monte dans l'ordre : `<TopAppBar>` (sticky, sombre), `<Login>` (Sheet DS portal), `<Switch>` des routes, `<BottomAppBar>` (fixed bottom, safe-area). Les routes publiques sont `/`, `/categories`, `/categories/:categorie`, `/confidentialite-de-lapp`. Les routes `/admin/*` sont wrappées par `<RequireAuth>`.

### Chargement des produits

- **Visiteur** : `Categories` (`src/pages/Categories/index.js`) fait un fetch lazy `GET /api/products?type=<slug>&lang=<iso2>` au mount, avec cache en session (`useRef`) indexé par `${type}_${lang}`. Invalidation via `productsVersion` (compteur dans App.js). Guard contre `selectedCategory` stale : on ne fetch que si `selectedCategory.slug === params.categorie`.
- **Admin connecté** : `App.js` fetch en plus `/api/products/allProducts` (VF brute). Guard par `if (!user) return`.

### Design system

Tous les composants publics et admin consomment `src/design-system/` :
- Tokens CSS dans `tokens.css` (cascade via `.ds-root` posée sur `<div className="App ds-root">` + racine de chaque page).
- `<Sheet>` utilise `ReactDOM.createPortal` sur `document.body` (mémoire : Semantic UI `Sidebar.Pushable` casse `position: fixed` sinon).
- `ImageLightbox` = portal plein écran, fermeture `Escape` / tap overlay.

### Catégories en DB

L'arbre vient de `GET /api/categories?tree=1` (back Mongoose model `Category`, hiérarchie par `parentId`). Deux hooks :
- `useCategories()` — renvoie le format legacy (`subCategories`, `subCat`) avec icônes Lucide pré-rendues. Consommé par pages admin, Categories public, modals produit.
- `useCategoriesTree()` — renvoie le tree brut (icon en string, iconColor, order, visible). Consommé par Home featured et CategoriesLanding qui re-rendent les icônes à la taille voulue.

Invalidation : `invalidateCategoriesCache()` + `invalidateCategoriesTreeCache()` — à appeler après chaque mutation admin catégorie (actuellement wiré dans `/admin/categories` reorder et delete, à étendre aux autres CRUD si besoin).

### Admin `/admin/*`

Drill-down 3 niveaux pour les catégories, CRUD produits via `AddProduct` / `EditProduct` / `UpdateImageModal` en Sheet DS. Liste produits avec combobox catégorie typeable, filtres Visibilité / Coups de cœur. Boutons d'action compacts (pills 28px muted), cards `ListItem` avec icône catégorie résolue et badge Star doré si `choice: true`.

### Images produits

`src/services/image.buildImageSrc(image)` gère les 2 shapes renvoyés par le back (FR = Buffer `{type, data:[bytes]}`, autres langues = base64 string — dû au `toObject()` sur le path non-fr côté back).

## Internationalisation

Aucune lib i18n côté front. Les descriptions arrivent du back déjà localisées selon `navigator.language.slice(0,2)`. La librairie `react-auto-translate` et la clé `GOOGLE_API_KEY` ont été retirées du bundle en 2026-04.

## Pas de tests automatisés

Pas de Jest/Mocha configuré. Vérification manuelle :
- Syntaxe JSX : `node -e "require('@babel/parser').parse(require('fs').readFileSync('<path>','utf8'), {sourceType:'module', plugins:['jsx']})"`
- UI : `npm start` + navigateur.
- Playwright MCP utilisable en session Claude Code si besoin de screenshots / assertions.

Ne pas introduire de test framework sans demande explicite.

## Points d'attention

- **Pas de merge sur `main`** sans feu vert explicite. `npm run deploy` également gatekept.
- `lucide-react` **pinné** à 0.244.0. Ne pas bumper sans vérifier le build CRA 4.
- `$SERVER` dans `_const.js` est un toggle local. Jamais commiter la valeur localhost.
- La base MongoDB est partagée dev/prod (back `database/index.js` hardcode l'URI Atlas). Toute mutation locale impacte la prod.
- Routes produit back : `/api/products?type=X&lang=Y` publique et localisée, `/api/products/allProducts` admin VF. Ne pas confondre.
- Les mutations admin produits (`POST /api/products/updateProduct` etc.) renvoient toute la DB produits (tous types confondus) — les handlers admin filtrent par type si besoin.

## Spécifications et plans

Dans `docs/superpowers/` :
- `specs/2026-04-18-admin-bottom-bar-design.md` — design admin bottom bar.
- `specs/2026-04-18-i18n-server-side-design.md` — traduction serveur-side.
- `specs/2026-04-18-public-visual-migration-design.md` — migration visuelle publique.
- `plans/2026-04-18-plan-1-back-categories.md` à `plans/2026-04-18-plan-4-public-visual-migration.md` — plans d'exécution détaillés.
