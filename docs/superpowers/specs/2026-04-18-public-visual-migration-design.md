# Migration visuelle publique — design spec

- **Date** : 2026-04-18
- **Branche** : `feat/admin-bottom-bar-categories` (même branche que la refonte admin, dernier morceau avant merge)
- **Statut** : spec à valider avant plan d'implémentation

## Contexte

Le design system `src/design-system/` (tokens sombres bordeaux/or, fonts Inter + DM Serif Display, composants Button/Sheet/TabBar/ListItem/IconPicker, iconMap Lucide) est en place et déjà consommé par les écrans `/admin/*` et par la BottomAppBar. Les pages publiques (`Home`, `Categories`, `ProductItem`, `TopAppBar`, `CategoriesSidebar`, modales `Login`/`ImageModal`) sont encore en Semantic UI avec la palette et les assets historiques. Cette spec couvre la migration visuelle stricte des écrans publics vers le DS, sans changement fonctionnel côté data.

Les pages publiques sont déjà passées en **lecture seule** (plan 3 public terminé) : plus de boutons admin inline, plus de "+" ajouter produit. La migration visuelle capitalise là-dessus.

## Objectifs

- Cohérence visuelle entre admin et public (même DS partout).
- Suppression des vestiges Semantic UI côté public (wrapper Sidebar.Pushable, Menu/Dropdown, Modal, boutons colorés).
- Nettoyage des assets et utilitaires devenus inutiles (`isBefore18h`, `COLOR_*`, `aCarciaraNormal.png`, `1755small.png`).
- Aucune régression de logique : fetch produits, cache, `productsVersion`, auth, event like, filtres sous-catégories restent fonctionnels.

## Contraintes de merge

**Aucun merge sur `main`** — ni côté front (`1755-front`) ni côté back (`1755-back`). Tout le travail reste sur la branche `feat/admin-bottom-bar-categories` jusqu'à feu vert explicite du client. Pas de `git merge`, pas de PR vers main, pas de `git push origin main`. Les déploiements (`npm run deploy` front, `git push` back) sont bloqués tant que la branche n'est pas validée.

## Non-objectifs

- Pas de refactor data/fetch côté back.
- Pas d'ajout au DS sauf si un pattern manque vraiment (à justifier au moment de l'implémentation).
- Pas de nouvelles features produits (pas de filtre texte, pas de recherche, pas de panier).
- Pas de nettoyage complet de FontAwesome (toujours consommé côté admin — Plan 4 éventuel).

## Scope et ordre de livraison

Migration écran par écran, validation visuelle à chaque étape. Ordre :

1. **Chrome** : TopAppBar simplifiée + nettoyage App.js + suppression `CategoriesSidebar`.
2. **Home**.
3. **CategoriesLanding** (nouvelle route `/categories` sans slug).
4. **Categories `/categories/:slug`** + nouveau `CategoryFilterPills`.
5. **ProductItem** (en même temps que 4 pour voir le rendu réel).
6. **ImageLightbox** + **Login sheet**.
7. **Nettoyage final** : assets, constantes, utilitaires morts, build check.

Chaque étape = commit autonome (ou petit groupe cohérent). Tests manuels à chaque commit : `npm start`, vérification navigateur, et Playwright (MCP `playwright` dispo en session) pour automatiser navigation + screenshots + assertions de routes sur les écrans critiques.

## Design par écran

### Chrome

**TopAppBar** — réécrite.

- Hauteur 56px, `position: sticky; top: 0; z-index: var(--ds-z-appbar)`.
- Fond `var(--ds-bg-surface)`, safe-area top respectée.
- Gauche uniquement : `<img src="./assets/images/1755medium.png" width="32" height="32">` + `<span class="serif">Baravin 1755</span>` en serif doré, taille `--ds-size-h2`.
- Aucun bouton (plus de burger, plus de login/résa — tout est dans la BottomAppBar).
- Clic sur le bloc → `/` (Home).

**BottomAppBar** : inchangée (déjà en DS). Vérifier uniquement que la tab "Carte" pointe sur `/categories`.

**App.js** :

- Suppression de l'effet `document.body.style.background` + tableau `elementsToUpdate` + imports `COLOR_*`.
- Suppression du wrapper `<CategoriesSidebar>` (et de son état `sidebarVisible`, `setSidebarVisible`).
- Ajout de la classe `ds-root` sur le conteneur racine (ou sur `<body>` via effet dédié) pour que les variables CSS s'appliquent globalement.
- Nouvelle route `<Route exact path="/categories" component={CategoriesLanding}>` **avant** `<Route path="/categories/:categorie" component={Categories}>`.
- Remplacement import `ImageModal` → `ImageLightbox`.

### Home `/`

**Layout** (direction éditoriale) :

1. **Hero** (sous la TopAppBar)
   - Bandeau pleine largeur, hauteur ~160px, fond `linear-gradient(180deg, var(--ds-bg-elevated), var(--ds-bg-deep))`.
   - `1755medium.png` centré, hauteur 90px, width auto.
   - Hors gradient : `<h1 class="serif">Baravin 1755</h1>` (size `--ds-size-display`, color `--ds-accent-gold`) + `<p class="subtitle">Bar à vin — Ajaccio</p>` (color `--ds-text-muted`).

2. **Event card** — rendu si `event && Object.keys(event).length > 0`
   - Card fond `--ds-bg-surface`, border `1px solid --ds-border-subtle`, radius `--ds-radius-md`, shadow `--ds-shadow-card`.
   - Image event en tête, hauteur 120px, object-fit cover. Construction base64 inchangée (`arrayBufferToBase64(event.image.data.data)`).
   - Padding `--ds-space-4` : label "À l'affiche" (uppercase muted) + nom event (font 600, 16px) + date en français (toLocaleDateString) + description + bouton like.
   - Bouton like : `<Button variant="primary">` DS avec icône cœur Lucide + compteur. `disabled` si `localStorage["1755-event"]` existe. Logique existante conservée (POST `/api/events/updateLikes`).

3. **Raccourcis catégories**
   - Label uppercase muted "Explorer la carte", `--ds-space-4` top margin.
   - Grille 3 colonnes, gap `--ds-space-2`.
   - Source : `useCategories().filter(c => c.visible && !c.parentId).sort((a,b) => a.order - b.order).slice(0, 3)`. Contrôle admin via ordre dans `/admin/categories`.
   - Tuile : `<Link to="/categories/:slug">` → card fond `--ds-bg-surface`, padding `--ds-space-3`, border `--ds-border-subtle`, radius `--ds-radius-md`. Icône Lucide (via `ICON_MAP[category.icon]`, taille 24px, stroke doré) centrée + nom catégorie 12-13px centré.

4. **État sans event** : pas de fallback image/logo, on enchaîne hero → raccourcis directement.

**Suppression** : `isBefore18h` + assets `aCarciaraNormal.png` / `1755small.png`, boutons admin inline (déjà retirés en plan 3).

**Fichiers** : `src/pages/Home/index.js` + `home.css` réécrits. Composant `EventCard` inline possible ; composant `FeaturedCategories` extrait si le fichier dépasse ~200 lignes.

### CategoriesLanding `/categories`

Nouvelle page.

- Header : `<h1 class="serif">La carte</h1>` accent gold + subtitle muted "Explorer par catégorie".
- Grille 2 colonnes mobile, gap `--ds-space-3`.
- Source : `useCategories().filter(c => c.visible && !c.parentId).sort(order)`.
- Card par catégorie : icône Lucide 32px stroke doré + nom serif 18px centré. Pas de compteur produit (nécessiterait un champ côté back, reporté).
- Tap → `/categories/:slug`.

**Fichiers** : `src/pages/CategoriesLanding/index.js` + `.css`.

### Categories `/categories/:slug`

1. **Header** — `<h1 class="serif">` couleur `--ds-accent-gold` avec le nom de la catégorie. Si un filtre parent est actif (ex. "Rouges"), on affiche `"Vins — Rouges"`. Suppression de toute coloration conditionnelle via `style` inline et du composant `<Transition>` Semantic.

2. **Pills de filtrage** — option "deux niveaux visibles".
   - Rangée principale : pill "Tous" + une pill par sous-catégorie de niveau 1 du node courant (`selectedCategory.subCategories`). Pill = `border-radius: --ds-radius-pill`, fond `--ds-bg-surface`, padding inline 12px vertical 6px. État actif : fond `--ds-accent-wine`.
   - **Exception vins** : pills "rouges"/"roses"/"blancs" actives prennent leurs couleurs dédiées — `#6B1A2C` / `#8a5560` / `#9a7a32`. Hors actif : neutres comme les autres.
   - Badge compteur dans la pill (petit, semi-transparent).
   - Si la pill parent active possède un `subCat` (cas `vins`/`alcools`), affichage d'une **2e rangée en retrait** avec un filet bordeaux 2px à gauche, sous-pills plus petites. La sous-pill active passe en doré (`--ds-accent-gold`).
   - Nouveau composant `CategoryFilterPills` dans `src/components/Small/CategoryFilterPills/`. Remplace entièrement `ProductsFilteringMenu` (supprimé).

3. **Liste produits**
   - Tri : `choice: true` d'abord, puis le reste par `price` croissant.
   - Flex column, gap 4px rows standard, gap 8px autour des choice cards.
   - Voir section ProductItem pour le détail.

4. **Loader** : wrapper `position: fixed; inset: 0; z-index: var(--ds-z-modal)`, fond `rgba(14, 10, 16, 0.8)`, loader centré.

5. **État vide** : texte muted "Aucun produit disponible pour cette sélection."

**Lecture seule stricte** : suppression des handlers `handleDeleteProduct`, `handleChangeVisibility`, `handleChangeChoice` dans `Categories/index.js` et des props associées (`setOpenLoginModal`, `setOpenAddProductModal`, `setOpenEditProductModal`, `setOpenUpdateImageModal`). L'admin passe par `/admin/products`.

**Fichiers** : `src/pages/Categories/index.js` + `categories.css` réécrits. Logique fetch/cache/productsVersion conservée à l'identique.

### ProductItem

**Row standard** (non-choice) :

- Flex horizontal : `[filet?] [thumbnail?] [contenu flex:1] [prix]`.
- Padding vertical `--ds-space-3`, border-bottom `--ds-border-subtle` (retiré sur le dernier).
- **Filet gauche** — appliqué uniquement si `type === "vins"` et `category ∈ {rouges, roses, blancs}`. Largeur 3px hauteur pleine. Couleurs : `#6B1A2C` / `#8a5560` / `#9a7a32`. Autres types : pas de filet.
- **Thumbnail** — affiché si `image` présent. Taille 48×48, radius 8px, object-fit cover. Base64 construit comme aujourd'hui. Tap sur le thumbnail ouvre l'ImageLightbox.
- **Nom** : 14px, 600, couleur `--ds-text-primary` uniforme (plus de `darkred/#fec5d9/#f1f285`).
- **Région** : 11px muted, format `"Région · année"` si disponible.
- **Description** : 12-13px muted, `-webkit-line-clamp: 2`.
- **Prix** : 14-15px primary, format `32,00€` (toFixed(2) + locale fr). Plus de `<small>€</small>`.

**Choice card** (`product.choice === true`) :

- Card fond `linear-gradient(180deg, rgba(212,162,76,0.08), transparent)`, border `1px solid rgba(212,162,76,0.35)`, radius `--ds-radius-md`, padding `--ds-space-4`, marge verticale `--ds-space-2`.
- Badge haut-droite : "★ COUP DE CŒUR" (label uppercase doré, 10-11px, letter-spacing 0.1em). Remplace le cœur FontAwesome inline.
- Même contenu interne qu'une row (thumbnail + texte + prix), avec plus d'espace.
- Le filet coloré vin s'applique ici aussi (trait à gauche du contenu).

**Plus de loupe FontAwesome**. Plus de coloration du titre par `category`. L'image est soit présente en thumbnail, soit absente.

**Fichiers** : `src/components/Small/ProductItem/index.js` + `productitem.css` réécrits. Un seul composant, branche sur `product.choice` pour choisir la variante.

### ImageLightbox

Remplace `src/components/Medium/Modals/ImageModal/`.

- Overlay plein écran, `position: fixed; inset: 0; z-index: var(--ds-z-modal)`, fond `rgba(14, 10, 16, 0.92)`.
- Image centrée, `max-width: 92vw; max-height: 85vh`, object-fit contain.
- Sous l'image : titre produit en serif doré + prix en primary.
- Bouton fermeture haut-droite : icône Lucide `X` 28px, stroke primary.
- Tap sur le fond (hors image) ou touche `Escape` → ferme.
- Rendu via **React Portal** sur `document.body` (mémoire `feedback_sheet_portal` — Sidebar.Pushable casse position:fixed, donc portal obligatoire pour tout overlay).
- Même API : `openImageModal`, `selectedProduct`, `setOpenImageModal`. Import renommé dans App.js.

**Fichier** : `src/components/Medium/Modals/ImageLightbox/index.js` + `.css`. `ImageModal/` supprimé après migration.

### Login sheet

Réécriture de `src/components/Medium/Modals/Login/index.js`.

- Consomme `<Sheet>` du DS (monte depuis le bas, portal déjà géré par le DS).
- Même API props : `openLoginModal`, `setOpenLoginModal`, handler `setUser`, etc.
- Logique auth inchangée : POST `/api/users/login`, stockage token sous clé `token-1755`.
- Contenu : titre serif "Connexion admin" + champ email + champ password + `<Button variant="primary">Se connecter</Button>` + message d'erreur en `--ds-danger` si échec + bouton "Annuler" qui ferme le sheet.
- Hauteur adaptative gérée par Sheet DS, safe-area bottom respectée.

## Suppression collatérale

- `src/components/Small/CategoriesSidebar/` (dossier entier).
- `src/components/Small/ProductsFilteringMenu/` (remplacé par `CategoryFilterPills`).
- `src/components/Medium/Modals/ImageModal/` (remplacé par `ImageLightbox`).
- `src/datas/utils.js` : fonction `isBefore18h` (vérifier 0 consommateur restant).
- `src/_const/_const.js` : constantes `COLOR_1755`, `COLOR_ACARCIARA` (vérifier 0 consommateur).
- `public/assets/images/aCarciaraNormal.png` et `1755small.png`.
- L'import `axios` dans Home si le like event est déplacé dans un hook dédié (à évaluer à l'implémentation ; facultatif).

FontAwesome reste en dépendance tant que l'admin en consomme — nettoyage reporté à un futur plan.

## Données & compatibilité

- `useCategories()` expose déjà l'arbre catégories localisé en DB. Le hook n'évolue pas.
- Les catégories ont un champ `icon` (nom Lucide) résolu via `ICON_MAP` dans `src/design-system/iconMap.js`. Utilisé partout où on affiche une catégorie (raccourcis Home, landing, pills).
- Le modèle `Product` n'évolue pas.
- Pas de changement back requis.

## Accessibilité

- Contrastes : palette DS conçue en contraste AA sur fond sombre. Vérifier spécifiquement les variantes de filet vin (rose `#8a5560` et blanc `#9a7a32` sur noir).
- Les pills, tuiles et rows produit avec image doivent être des `<button>` ou `<Link>` (focusables clavier).
- Fermeture lightbox/sheet par `Escape` + `aria-label` sur bouton X.

## Tests

Pas de test framework (CLAUDE.md). Validation à chaque commit :

- Syntaxe JSX : `node -e "require('@babel/parser').parse(require('fs').readFileSync('<path>','utf8'), {sourceType:'module', plugins:['jsx']})"` (au moins pour les fichiers touchés importants).
- `npm start` et vérification manuelle dans le navigateur : chaque route (Home, /categories, /categories/vins, /categories/cocktails, /categories/alcools pour le 2e niveau), chaque état (avec/sans event, avec/sans image produit, avec/sans choice, login ouvert/fermé, lightbox ouvert/fermé).
- **Playwright MCP** (`mcp__plugin_playwright_playwright__*`) pour automatiser : navigation entre les routes, click sur une catégorie, screenshot de chaque écran, assertion de la présence des éléments clés (logo, hero, pills, au moins 1 produit). À utiliser au moins sur Home + CategoriesLanding + Categories:vins.

## Risques et points d'attention

- Le fetch de catégories via `useCategories()` peut être lent au premier chargement — les raccourcis Home et la landing apparaîtront vides quelques ms. Prévoir un fallback skeleton ou un placeholder neutre.
- Le bouton like event utilise `localStorage.getItem("1755-event")` — garder la logique telle quelle, juste rehabiller le bouton.
- Le retrait du wrapper Sidebar.Pushable peut impacter le layout de la page courante (padding/margin hérités de Semantic). Tester chaque route en priorité.
- Semantic UI CSS reste chargé pour les modales admin — vérifier qu'il ne pollue pas les nouveaux composants publics (tests visuels en mode admin connecté + mode visiteur).
- La base MongoDB est partagée dev/prod (mémoire `feedback_db_no_dev_split`). Aucune mutation prévue par cette spec — c'est purement front.
