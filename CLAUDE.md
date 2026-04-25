# 1755-front

Front React de la carte du restaurant Baravin1755. Déployé sur GitHub Pages avec le domaine custom `https://baravin1755.com`.

Back compagnon : `/Users/pierrefrancoispaoletti/appdevelopment/1755-back` (Heroku `le-1755`).

## Stack

- React 17 + react-router 5 (HashRouter)
- CRA 4 (`react-scripts`) — build via `NODE_OPTIONS=--openssl-legacy-provider`
- Design system maison dans `src/design-system/` (palette sombre bordeaux/or, Inter + DM Serif Display, composants Button/Sheet/TabBar/ListItem/IconPicker + iconMap Lucide)
- `lucide-react@0.244.0` **pinné** (versions récentes ESM-only cassent CRA 4 / Webpack 4)
- axios (fallback `fetch` pour le streaming admin `/api/products/allProducts`)
- **Plus de Semantic UI** depuis 2026-04-20. Toast maison + div natifs ont remplacé les derniers `Transition`/`Message`/`Container`/`Divider`.
- **Capacitor 8** (`@capacitor/core|ios|android|push-notifications`) — iOS depuis 2026-04-23, Android depuis 2026-04-25.

## Commandes

```bash
npm start            # dev server (CRA)
npm run build        # build prod
npm run deploy       # build + gh-pages -b master -d build
npm run cap:sync     # build + copy into ios/
```

### iOS (Capacitor)

- `appId` : `com.baravin1755` (conservé pour continuité stores — **ne jamais changer**).
- Node **≥22** requis par `@capacitor/cli@8`. Sur Mac : `nvm use default` (alias sur v22). Sur Windows : Node v24 installé nativement, rien à activer.
- `capacitor.config.json` à la racine, dossier `ios/` versionné (hors `ios/App/Pods`, `ios/App/build`, SPM caches).
- `npx cap open ios` → Xcode. Signing & Capabilities : Team `6NW72C6Q6Q` + Push Notifications activées (entitlements dans `ios/App/App/App.entitlements`).
- Firebase iOS : `GoogleService-Info.plist` dans `ios/App/App/`, FirebaseCore + FirebaseMessaging via SPM (https://github.com/firebase/firebase-ios-sdk), init dans `AppDelegate.swift` (`FirebaseApp.configure()` + swizzling du `didRegisterForRemoteNotificationsWithDeviceToken`).
- Projet Firebase = `resas-d1707`. APNs Authentication Key `.p8` (n'expire pas) uploadée sur Firebase Console → Cloud Messaging.
- Store legacy `1755-resas` iOS = v1.4.8. Nouveau bundle unifié iOS pas encore shipped, **versionName `2.1.0`** (aligné Android), `CURRENT_PROJECT_VERSION` à bumper à chaque archive.
- Push natif : hook `src/services/pushNotifications.js` (no-op web). Web Push = non implémenté.
- Target renommé `App` → `Baravin 1755`, sortie `Baravin 1755.app`.

### Android (Capacitor) — workflow Windows uniquement

**Tout le workflow Android se fait depuis le PC Windows du user.** Le Mac n'a pas le keystore de release et n'a pas Android Studio configuré.

- `appId` : `com.baravin1755` (continuité Play Store legacy `1755-resas`).
- versionName **2.1.0**, dernier `versionCode` shipped Internal testing = **32**. Legacy à versionCode 30, **downgrade interdit** par Google Play.
- SDK : `compileSdk 36`, `targetSdk 36`, `minSdk 24` (defaults Capacitor 8, alignés sur la mandate Google Play d'août 2026).
- Firebase : `google-services.json` dans `android/app/` (gitignoré). Projet `resas-d1707` partagé avec iOS. FCM natif Firebase, pas d'upload de clé comme APNs.
- Keystore d'upload : `C:\Users\Utilisateur\keystore\1755resaskey.jks` + `1755resaskey.pem`. Credentials dans Android Studio Password Safe (`%APPDATA%\Google\AndroidStudio<version>\c.kdbx`). Play App Signing actif côté Google → en cas de perte, reset upload key via Play Console (1-2 jours).
- Bloc `signingConfigs.release` dans `android/app/build.gradle` lit conditionnellement `android/keystore.properties` (gitignoré). Si absent, Studio UI signe via Generate Signed Bundle qui lit le Password Safe.

**Workflow release Android :**

1. `git pull origin main`
2. PowerShell : `$env:NODE_OPTIONS="--openssl-legacy-provider"` (CRA 4 + Node 17+ exigent ce flag pour `npm run build`).
3. `npm run build && npx cap sync android`.
4. Bumper `versionCode` (+1) et éventuellement `versionName` dans `android/app/build.gradle`.
5. Android Studio → `Build > Generate Signed Bundle / APK` → AAB → release. Studio remplit le keystore depuis Password Safe.
6. Output : `android/app/release/app-release.aab` → upload Play Console.
7. **Toujours passer par Internal testing** avant Production. Promotion vers Production = action manuelle, jamais automatique.

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
- `/reserver` → formulaire de réservation public (DS, remplace l'ancienne app `1755-resas`).
- `/confidentialite-de-lapp` → texte légal.
- `/admin` + `/admin/{categories,products,events,themes,bookings}` → `<RequireAuth>` wrapper. Tab admin "Thèmes" remplacée par "Résas" dans la BottomAppBar ; route `/admin/themes` reste accessible via URL directe.

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
- **Contrat `POST /api/bookings/createBooking`** : `pushNotificationToken` doit être inclus **dans l'objet `booking`** (`{ booking: { ..., pushNotificationToken } }`). Le back accepte aussi en fallback `pushNotificationToken` racine du body (`{ booking, pushNotificationToken }`) pour compat avec les anciens clients déjà déployés. Front actuel envoie au format propre. Le validator middleware valide `pushNotificationToken` dans `booking`.
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
- `plans/2026-04-23-plan-5-unification-capacitor.md` — unification `1755-resas` + iOS (Capacitor 8).
- `specs/2026-04-25-android-capacitor-design.md` — scaffold + release Android Capacitor 8 v2.1.0.
