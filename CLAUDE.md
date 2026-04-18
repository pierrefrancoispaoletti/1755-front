# 1755-front

Front React de la carte du restaurant Baravin1755. Déployé sur GitHub Pages avec le domaine custom `https://baravin1755.com`.

Back compagnon : `/Users/pierrefrancoispaoletti/appdevelopment/1755-back` (Heroku `le-1755`).

## Stack

- React 17 + react-router 5 (HashRouter)
- semantic-ui-react + semantic-ui-css
- axios (avec fallback ponctuel `fetch` pour le streaming admin)
- CRA 4 (react-scripts) — build via `NODE_OPTIONS=--openssl-legacy-provider`

## Commandes

```bash
npm start            # dev server (CRA)
npm run build        # build prod
npm run deploy       # build + gh-pages -b master -d build
```

Après `npm run deploy`, **toujours** `git push origin main` pour synchroniser la branche source avec GitHub (gh-pages ne push que `master`).

## Conventions

### $SERVER dans `src/_const/_const.js`

La valeur committée pointe **toujours** sur `https://le-1755.herokuapp.com`. Pour tester en local, modifier la ligne manuellement vers `http://localhost:8080` (port 8080 car 5000 est occupé par AirPlay sur macOS) et **ne jamais commiter** cette modif.

Avant tout `git add` ou `git commit` : vérifier `git status` et exclure `src/_const/_const.js` s'il ne contient que le toggle d'URL.

### Pas de tests automatisés

Pas de Jest/Mocha configuré. Vérification manuelle uniquement :
- Syntaxe JSX : `node -e "require('@babel/parser').parse(require('fs').readFileSync('<path>','utf8'), {sourceType:'module', plugins:['jsx']})"`
- UI : `npm start` + navigateur.

Ne pas introduire de test framework sans demande explicite.

## Architecture clé

### Chargement des produits

- **Visiteur public** : `Categories` (`src/pages/Categories/index.js`) fait un fetch lazy `GET /api/products?type=<slug>&lang=<iso2>` au mount, avec cache en session (`useRef`) indexé par `${type}_${lang}`. Navigation instantanée sur les catégories déjà visitées.
- **Admin connecté** : `App.js` fetch en plus `/api/products/allProducts` (VF brute, tout produit inclus `visible=false`). Ce fetch est gardé par `if (!user) return`.
- **Au reload sur `/categories/:categorie`** : `Categories` reconstruit `selectedCategory` depuis le param d'URL via un useEffect dédié (sinon le state parent est perdu).

### Invalidation du cache après mutations admin

`App.js` détient un compteur `productsVersion`. Les modals `AddProduct`, `EditProduct`, `UpdateImageModal` appellent `setProductsVersion(v => v+1)` sur succès. `Categories` observe ce compteur via un `useRef` de la dernière valeur vue → purge `cacheRef.current` quand ça change, déclenchant un refetch frais.

Les handlers internes à `Categories` (`handleDeleteProduct`, `handleChangeVisibility`, `handleChangeChoice`) mettent à jour directement leur state local + cache, pas besoin du trigger.

### Traduction

Côté front : aucune. Les descriptions arrivent du back déjà localisées selon `navigator.language.slice(0,2)`. La clé Google Translate n'est **plus** dans le bundle (était `GOOGLE_API_KEY` dans `_const.js`, supprimée en 2026-04).

La librairie `react-auto-translate` a été désinstallée.

### Loader

`src/components/Small/Loader/` est un overlay standard. Dans `Categories`, il est wrappé dans un div `position: fixed; inset: 0; zIndex: 5000` pour couvrir tout le viewport pendant le fetch.

## Structure de données produit (depuis le back)

```js
{
  _id, name, description, region, price, type,
  category, subCategory, choice, visible, image
}
```

`translations` et `descriptionHash` existent côté back mais sont masqués dans les réponses publiques (endpoint `GET /api/products`).

## Points d'attention

- La route de produits côté back est `/api/products?type=X&lang=Y` (publique, localisée) ou `/api/products/allProducts` (admin, VF). Ne pas confondre.
- Les mutations admin (`POST /api/products/updateProduct`, etc.) renvoient **toute** la DB produits (tous types confondus) — les handlers Categories filtrent par type avant de setter.
