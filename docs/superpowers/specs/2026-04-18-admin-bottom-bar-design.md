# Admin Bottom App Bar & Gestion des Catégories — Design

**Date** : 2026-04-18
**Portée** : front `1755-front` + back `1755-back`
**Statut** : design validé, prêt pour plan d'implémentation

## Contexte

L'application 1755 est utilisée et administrée **uniquement depuis mobile**. Aujourd'hui l'administration est éparpillée : les actions admin apparaissent in-place sur les pages publiques (boutons CRUD sous chaque produit dans `/categories/:slug`, boutons d'ajout d'event sur `Home`), et les **catégories sont hardcodées** dans `src/datas/categories.js`. Cette situation limite la lisibilité de l'UX publique et empêche toute gestion dynamique des catégories.

Ce spec introduit :

1. Une **bottom app bar persistante** en navigation principale mobile.
2. Un **shell d'administration dédié** sous `/admin/*` avec sa propre sous-bottom-bar.
3. Un **modèle `Category` en base** avec CRUD complet et migration depuis l'existant statique.
4. Un **design system minimal** (tokens + composants de base) appliqué aux nouveaux écrans, posant les bases d'une refonte visuelle globale ultérieure.

## Principes directeurs

- **Pages publiques en lecture seule** : même connecté, l'admin ne voit plus de boutons CRUD in-place. Toute édition se fait depuis `/admin/*`.
- **Bottom bar persistante**, contenu adapté selon l'état (visiteur / admin hors admin / dans `/admin/*`).
- **Pas de refonte visuelle des écrans publics existants** dans ce spec — le design system est introduit uniquement sur les nouveaux écrans (bottom bar + shell admin).
- **Migration safe** : seed idempotent avec dry-run, exécuté directement sur prod, backup préalable obligatoire.

## Architecture

### Back (`1755-back`)

**Nouveau modèle Mongoose `Category`** (`database/models/Category.js`) :

```js
{
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  parentId: { type: ObjectId, ref: 'Category', default: null, index: true },
  order: { type: Number, default: 0 },
  visible: { type: Boolean, default: true },
  icon: { type: String, default: null },         // nom Lucide, ex: "Wine"
  iconColor: { type: String, default: "#ffffff" },
  badge: {
    icon: { type: String },
    color: { type: String }
  },                                             // null par défaut
  // timestamps: true
}
```

**Contraintes** :

- `slug` **immuable** après création (les produits y réfèrent via `Product.type` / `.category` / `.subCategory`). Pour renommer : supprimer + recréer.
- `parentId` référence une catégorie existante ou `null` (racine).
- **Profondeur max = 3**. Validation applicative : refus si `parentId.parentId.parentId` existe.
- `order` local au parent, permettant tri au sein d'un niveau.
- `DELETE` refusé si la catégorie a des enfants OU des produits rattachés (message explicite côté API).

**Nouveau controller** (`controllers/category.controller.js`) et **routes** (`routes/categories.routes.js`) :

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/categories` | public | Liste plate ou arbre (`?tree=1`) |
| `GET` | `/api/categories/:id` | public | Catégorie + enfants directs |
| `POST` | `/api/categories` | admin (JWT) | Création `{ name, slug, parentId, icon, iconColor, badge }` |
| `PUT` | `/api/categories/:id` | admin | Édition `{ name, icon, iconColor, badge, visible }` (pas `slug`, pas `parentId`) |
| `PUT` | `/api/categories/:id/move` | admin | Déplacement `{ parentId, order }` |
| `PUT` | `/api/categories/reorder` | admin | Maj batch `[{ id, order }]` |
| `DELETE` | `/api/categories/:id` | admin | Refus si enfants/produits rattachés |

**Script de seed** (`scripts/seed-categories.js`) :

- Lit `scripts/categories-seed.json`, dérivé de l'actuel `src/datas/categories.js`, icônes mappées FontAwesome → Lucide (ex: `faWineBottle` → `Wine`, `faChampagneGlasses` → `Martini` ou équivalent).
- Upsert par `slug`, idempotent.
- **Flag `--dry-run`** : simule les upserts, compare les slugs du seed aux slugs distincts présents dans `Product` (`db.products.distinct('type')` + `distinct('category')` + `distinct('subCategory')`), affiche un rapport (créations/modifs prévues, slugs produits orphelins, collisions) sans toucher à la DB.
- Exécution : `heroku run node scripts/seed-categories.js [--dry-run] --app le-1755`.

### Front (`1755-front`)

**Nouveau dossier `src/design-system/`** :

- `tokens.css` : CSS variables (couleurs, typo, espacements, radii, shadows).
- `components/` : `AppBar`, `TabBar`, `Button`, `ListItem`, `Sheet` (bottom sheet), `IconPicker`, `Input`, `Switch`, `ColorSwatch`.
- Scope via wrapper `<div className="ds-root">` pour cohabiter avec Semantic UI sans conflit.

**Tokens** :

- **Couleurs** : `--ds-bg-deep` (#0E0A10), `--ds-bg-surface` (#1B1118), `--ds-accent-wine` (#6B1A2C), `--ds-accent-gold` (#D4A24C), `--ds-text-primary` (#F5EFE8), `--ds-text-muted` (#9A8B90), `--ds-border-subtle` (#2C1E25).
- **Typo** : serif (titres) `DM Serif Display` ou `Cormorant Garamond` + sans-serif (UI) `Inter`, via `@fontsource` pour éviter les appels externes.
- **Grille 4 px** : `--ds-space-1` (4) à `--ds-space-8` (32).
- **Radii** : `--ds-radius-sm` (8), `--ds-radius-md` (16), `--ds-radius-pill` (999).

**Nouveau composant `BottomAppBar`** monté dans `App.js`, `position: fixed`, bottom-safe-area iOS, hauteur ~64 px, hit-target ≥ 48 px.

**4 onglets visiteur** (visibles en dehors de `/admin/*`) :

| Onglet | Icône Lucide | Cible | Actif si |
|---|---|---|---|
| Accueil | `Home` | navigate `/` | `pathname === '/'` |
| Carte | `BookOpen` | navigate `/categories` (ou dernière `/categories/:slug` visitée) | `pathname.startsWith('/categories')` |
| Résa | `CalendarCheck` | lien externe `https://pierrefrancoispaoletti.github.io/1755-resas` (target `_blank`) | jamais actif |
| Compte | `User` gris (non connecté) / `UserCheck` vert (connecté) | non connecté → ouvre `LoginModal` ; connecté → navigate `/admin` | — |

**5 onglets admin** (visibles sur `/admin/*`, remplacent les visiteurs) :

| Onglet | Icône Lucide | Cible |
|---|---|---|
| Produits | `Package` | `/admin/products` |
| Catégories | `FolderTree` | `/admin/categories` |
| Events | `Calendar` | `/admin/events` |
| Thèmes | `Palette` | `/admin/themes` |
| Quitter | `LogOut` | navigate `/` (pas de logout — juste sortie du mode admin) |

**Logout** accessible depuis un écran dans `/admin` (header de la landing admin), avec confirmation. Pas dans la bottom bar.

**Nouvelle route `/admin`** avec sous-routes `/admin/products`, `/admin/categories`, `/admin/events`, `/admin/themes`. Guard `<RequireAuth>` redirige vers `/` si `!user`. Landing `/admin` = redirect vers `/admin/products`.

### `/admin/categories` — UX drill-down

**Route** : `/admin/categories/:parentId?`. Sans param = racine. Avec param = enfants de cette catégorie.

**Structure d'un écran** (identique à chaque niveau 1→3) :

```
┌──────────────────────────────────┐
│ ← Retour     Catégories          │ ← header si niveau > racine
│ Racine › Vins                    │ ← breadcrumb compact
├──────────────────────────────────┤
│ [⊕ Ajouter une catégorie]        │ ← sticky top (masqué au niveau 3)
├──────────────────────────────────┤
│ ≡  🍷 Vins Rouges          ›     │
│ ≡  🥂 Champagnes           ›     │
│ ...                              │
└──────────────────────────────────┘
│   [sous-bottom-bar admin]        │
```

**Interactions** :

- **Tap sur la ligne** → drill-down vers enfants (`navigate('/admin/categories/:id')`). Si feuille, écran enfant vide avec bouton "Ajouter" (si profondeur < 3).
- **Drag handle `≡`** → réordonnancement vertical, release déclenche `PUT /reorder`.
- **Swipe gauche** → révèle `Éditer` (ouvre bottom sheet) et `Supprimer` (confirmation, refus si enfants/produits rattachés avec message explicite).
- Au niveau 3, bouton "Ajouter" masqué (profondeur max atteinte).
- Sur une feuille, affichage en bas : `N produits rattachés` + lien vers `/admin/products?category=:slug`.

**Bottom sheet d'édition** :

- Champs : `name` (input), `slug` (readonly si édition, auto-généré kebab-case depuis name à la création avec override possible, unicité vérifiée au blur), `icon` (ouvre `IconPicker`), `iconColor` (color picker), `badge` (toggle + si actif : icon + color), `visible` (switch).
- Preview live de l'icône sélectionnée en haut avec sa couleur appliquée.
- Boutons `Annuler` / `Enregistrer`.

**`IconPicker`** : grille 5 colonnes de la **whitelist Lucide** (~50 icônes pertinentes resto/bar — `Wine`, `WineOff`, `Beer`, `Martini`, `GlassWater`, `Coffee`, `UtensilsCrossed`, `Pizza`, `Cake`, `Croissant`, `ShoppingBag`, `Crown`, etc.) + champ recherche par mot-clé.

### `/admin/products`

**Route** : `/admin/products` (+ query `?category=:slug&q=...`).

**Layout** :

- Header : champ recherche (par nom), filtre catégorie (dropdown alimenté par `/api/categories`), bouton `⊕ Ajouter produit`.
- Liste : `ProductAdminCard` par produit (image miniature, nom, prix, catégorie, indicateurs `visible`/`choice`).
- Actions (swipe gauche ou `⋯`) : Éditer, Image, Visibilité, Coup de cœur, Supprimer. Réutilise `EditProductModal` et `UpdateImageModal` existants, habillés avec le design system.

**Nettoyage côté public** :

- Suppression de `AdminCrudButtons` des `ProductItem` publics.
- Suppression du bouton `⊕ Ajouter produit` actuellement sur `/categories/:slug` côté admin connecté.
- `Categories` (public) ne reçoit plus les props admin — `App.js` simplifié en conséquence.

### `/admin/events` et `/admin/themes`

Migration **mécanique, pas de refonte fonctionnelle** :

- **Events** : les modals `AddEvent` et `EditEvent` existantes sont déplacées ; leurs déclencheurs quittent `Home` (plus de boutons admin sur l'accueil public). `/admin/events` liste les events + bouton création. `Home` continue d'afficher l'event courant en lecture seule.
- **Thèmes** : `/admin/themes` liste et édite les thèmes via le controller back existant. UI minimale (liste + form basique) à compléter selon l'existant.

### Consommation côté public

- `Categories` (public) fetche `/api/categories?tree=1` au mount, remplace l'import du fichier statique. Cache en session (`useRef`), même pattern que pour les produits.
- **Mapper front `iconMap.js`** : `{ Wine: <Wine />, Beer: <Beer />, ... }`, importe nommément les ~50 icônes Lucide de la whitelist (tree-shaken par CRA). Zéro risque d'icône manquante puisque l'admin sélectionne forcément depuis la whitelist.
- **Suppression** du fichier `src/datas/categories.js` et de tous ses imports après migration validée.

## Migration (prod)

Le seed tourne directement sur la base Heroku prod — pas d'étape locale. Filet de sécurité :

1. **Backup préalable obligatoire** (prérequis non-négociable) : `mongodump` / snapshot Atlas avant exécution, restaurable.
2. **Dry-run d'abord** : `heroku run node scripts/seed-categories.js --dry-run --app le-1755`. Le script affiche :
   - Nombre de catégories à créer / modifier.
   - Slugs présents dans `Product` sans catégorie correspondante dans le seed (orphelins potentiels).
   - Collisions de slug.
   Itérer sur le JSON source jusqu'à rapport clean.
3. **Exécution réelle** : `heroku run node scripts/seed-categories.js --app le-1755`. Log par insertion + résumé final.
4. **Rollback** : `db.categories.drop()` — la collection est nouvelle, aucun autre modèle ne la référence tant que le front consommateur n'est pas déployé.
5. **Front déployé en dernier** : l'API `/api/categories` doit renvoyer un arbre cohérent **avant** que le front bascule sa consommation de `datas/categories.js` vers l'API.

## Suppression de logique obsolète

- `showAlways` / `isBefore18h()` côté catégories : **supprimé**. Toutes les catégories visibles par défaut, contrôlé uniquement par le champ `visible` éditable.
- Usages résiduels de `isBefore18h` ailleurs : à auditer (switch logo `TopAppBar`, contenu `Home`). Décision d'implé : conserver là où encore pertinent (ex: bascule visuelle logo midi/soir).

## Ordre de livraison

1. **Back catégories** — modèle, controller, routes, script seed (avec `--dry-run`). Test manuel API local.
2. **Front design system** — tokens, fonts, composants de base, wrapper.
3. **BottomAppBar + shell `/admin`** — 4 onglets visiteur + sous-bar admin, guard `RequireAuth`, transitions.
4. **Admin catégories** — drill-down, bottom sheet, `IconPicker` Lucide.
5. **Admin produits** — `/admin/products`, migration des modals existantes, suppression des boutons inline publics.
6. **Admin events + thèmes** — déplacement mécanique des flows existants.
7. **Consommation publique** — `Categories` fetche `/api/categories`, `iconMap.js`, suppression de `src/datas/categories.js`.
8. **Déploiement prod** — backup → seed dry-run → seed réel → vérif `GET /api/categories` → déploiement front (`npm run deploy` + `git push origin main`) → smoke test mobile.

## Validation manuelle

Convention projet : pas de tests automatisés. Vérifications manuelles :

1. Après seed : `GET /api/categories?tree=1` reproduit l'arbre actuel.
2. `GET /api/products?type=bordeaux&lang=fr` renvoie les mêmes produits qu'avant migration (vérif pour quelques slugs stratégiques).
3. BottomAppBar visible sur toutes les routes publiques, 4 onglets fonctionnels, onglet actif surligné.
4. Tap "Compte" non connecté → modal login. Après login → navigate `/admin/products`.
5. Sur `/admin/*` : sous-bottom-bar admin remplace la principale. Tap "Quitter" → `/` et bar visiteur restaurée.
6. `/admin/categories` : drill-down 3 niveaux, création, édition, swipe delete, réordonnancement → confirmés en DB via `GET /api/categories`.
7. Suppression d'une catégorie avec enfants/produits → refus avec message explicite.
8. `IconPicker` : recherche, sélection, preview couleur.
9. Icône Lucide et couleur rendues correctement sur pages publiques après bascule.
10. `/admin/products` : CRUD fonctionnel. Sur `/categories/:slug` (public connecté ou non) : aucun bouton admin, pas de `⊕`.
11. Events et thèmes gérables depuis `/admin/events` et `/admin/themes`. `Home` n'a plus de boutons admin.

## Risques

| Risque | Mitigation |
|---|---|
| Mapping slug seed → produit raté, produits orphelins | Dry-run obligatoire avant exécution réelle ; rapport des slugs produits sans catégorie. |
| Cache front périmé après mutation admin | Étendre `productsVersion` dans `App.js` à un `categoriesVersion` ; purge cache sur mutation. |
| Bundle Lucide | Import nommé tree-shaken, ~50 icônes whitelist → poids négligeable. |
| Semantic UI vs design system cohabitent | Scope CSS via wrapper `.ds-root` et CSS variables préfixées `--ds-*`. |
| Rollback nécessaire en prod | Collection `Category` isolée + front non déployé avant validation API → `db.categories.drop()` suffit. |
| Suppression de `src/datas/categories.js` casse des imports résiduels | Grep avant suppression, corriger usages, tester. |
| Déploiement `npm run deploy` | Workflow existant inchangé ; après deploy, toujours `git push origin main` (convention projet). |

## Hors scope (specs ultérieurs)

- Refonte visuelle des écrans publics (Home, Categories, ProductItem) — spec dédié qui appliquera le design system.
- Import/export en masse de produits — si besoin, spec dédié.
- Réécriture fonctionnelle d'Events ou de Thèmes — hors scope ici, seulement déplacement.
- Logout depuis la bottom bar — volontairement placé dans un écran admin pour éviter les clics accidentels.
