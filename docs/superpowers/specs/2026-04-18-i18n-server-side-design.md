# Traduction côté serveur avec cache persistant

**Date** : 2026-04-18
**Repos concernés** : `1755-front` + `1755-back`
**Branches** : `feat/i18n-server-side` sur les deux repos

## Contexte et motivation

L'application utilise actuellement `react-auto-translate` qui appelle l'API Google Translate **côté client**, pour chaque description produit, à chaque visite. Le cache `localStorage` ne sert que par navigateur : chaque nouveau visiteur re-traduit tout.

**Coût actuel observé** : ~800 € / 6 mois (~1 600 €/an).

**Coût cible** : ~80-140 € année 1 (amorçage inclus), ~40-120 €/an ensuite. Réduction attendue **~92 %**.

**Bug concomitant** : au reload sur `/categorie/:categorie`, les produits ne s'affichent pas car `activeMenu` n'est pas reconstruit depuis l'URL et le filtre renvoie un tableau vide. Le refactor de chargement par catégorie corrige ce bug naturellement.

## Principes

1. **Traduction côté serveur uniquement.** Le front ne fait plus aucun appel à Google.
2. **Déterminisme.** Chaque `(description FR, langue cible)` est traduite **exactement une fois** dans la vie du système, tant que la source ne change pas.
3. **Invalidation explicite par hash** du texte source FR normalisé.
4. **Chargement par catégorie.** Le front ne fetche plus toute la carte, mais seulement la catégorie affichée.
5. **Cache client par session** pour éviter les re-fetch lors de la navigation entre catégories déjà visitées.

## Décisions clés

| Sujet | Choix |
|---|---|
| Langues cibles | Toutes celles détectées dans `navigator.language` (pas de liste figée) |
| Stratégie 1ʳᵉ visite langue inédite | Traduction à la volée bloquante (réponse attendue ~1-2 s) |
| Invalidation au `updateProduct` | Re-traduction immédiate des langues déjà vues |
| Seuil "modification significative" | Exact après normalisation `trim + espaces multiples` (décision A) |
| Édition manuelle des traductions | Non — 100 % auto |
| Stockage | Embarqué dans le document `Product` |
| Chargement front | Lazy par catégorie + cache en `useRef` par session |
| Régions | Non traduites (comportement actuel conservé) |

## Architecture

### Flux cible

```
Visiteur → GET /api/products?type=vins&lang=it
        → Back : Product.find({ type })
                 ├─ Pour chaque produit sans translations.it : batch Google Translate
                 ├─ Persister translations.it
                 └─ Retourner products avec description localisée
        → Front : affichage direct, aucun appel externe
```

### Composants touchés

**Back (`1755-back`)**
- `database/models/Product.js` — ajout `descriptionHash`, `translations`
- `controllers/product.controller.js` — nouveau `getProductsByType`, modif `updateProduct`
- `routes/products.routes.js` — nouvelle route `GET /`
- `services/translator.js` *(nouveau)* — wrapper Google Translate API
- `scripts/migrate-hashes.js` *(nouveau, one-shot)* — initialise `descriptionHash` sur produits existants
- Heroku config : `GOOGLE_TRANSLATE_API_KEY`

**Front (`1755-front`)**
- `src/components/App/App.js` — suppression du fetch global
- `src/pages/Categories/index.js` — fetch lazy par type + langue, state local
- `src/components/Small/ProductItem/index.js` — suppression de `<Translator>`/`<Translate>`
- `src/_const/_const.js` — suppression de `GOOGLE_API_KEY`
- `package.json` — retrait de `react-auto-translate`

## Modèle de données

### Schéma `Product` (MongoDB / Mongoose)

Champs existants conservés : `name`, `description`, `region`, `price`, `type`, `category`, `subCategory`, `choice`, `visible`, `image`.

Nouveaux champs :

```js
{
  descriptionHash: {
    type: String,
    default: "",
  },
  translations: {
    type: Map,
    of: String,         // valeur = description traduite
    default: {},
  }
}
```

### Normalisation et hash

```js
const normalize = (text) => text.trim().replace(/\s+/g, ' ');
const hash = crypto.createHash('sha1').update(normalize(text)).digest('hex');
```

### Volume estimé

300 produits × ~15 langues × ~250 octets = **~1 Mo** au maximum. Négligeable pour MongoDB.

## API back

### Nouveau endpoint public

```
GET /api/products?type=<type>&lang=<iso2>
```

**Paramètres**
- `type` *(requis)* — ex. `vins`, `alcools`, `plats`
- `lang` *(optionnel, défaut `fr`)* — extrait de `navigator.language.slice(0,2)`

**Comportement**
1. `Product.find({ type })`.
2. Si `lang === 'fr'` → retour direct (description FR telle quelle).
3. Sinon, identifier les produits dont `translations[lang]` est absent et dont `description` est non vide.
4. Batch Google Translate (un seul appel HTTP avec `q` en tableau) pour tous les textes manquants.
5. Persister les traductions dans chaque document.
6. Retourner chaque produit avec `description` remplacée par la version localisée, **sans exposer `translations` ni `descriptionHash`** dans la réponse.

**Format de réponse** (identique à la forme actuelle côté client) :
```json
{ "status": 200, "data": [ { "_id": "...", "name": "...", "description": "<traduit>", "region": "...", ... } ] }
```

### Endpoint admin conservé

```
GET /api/products/allProducts
```

Inchangé pour l'admin connecté (renvoie toutes les catégories, VF brute, y compris produits cachés). Utilisé uniquement quand `user` est connecté côté front. Décision de le restreindre par auth à prendre dans une itération ultérieure.

### Modification de `updateProduct`

Ajouter en tête de la logique de mise à jour :

```js
if (update.description !== undefined) {
  const newHash = hash(update.description);
  if (newHash !== existingProduct.descriptionHash) {
    update.translations = {};
    update.descriptionHash = newHash;
  }
}
```

Si seul `name`, `price`, `visible`, etc. changent → les traductions sont conservées.

### Module `services/translator.js`

- Appel direct à `https://translation.googleapis.com/language/translate/v2` (pas de SDK).
- API :
  ```js
  translateBatch(texts: string[], from: string, to: string): Promise<string[]>
  ```
- Lit `process.env.GOOGLE_TRANSLATE_API_KEY`.
- Log à chaque appel : `[translate] fr→${lang} ${N} textes ${totalChars} chars` pour monitoring via `heroku logs`.

## Front

### `App.js`

Suppression du `useEffect` qui fetch `/allProducts` au démarrage. Le state `products` parent disparaît (ou reste limité à l'admin connecté).

Si `user` est connecté → fetch `/allProducts` pour disposer de la VF complète à des fins d'administration.

### `Categories/index.js`

Remplacer la dépendance au `products` parent par un state local alimenté par un fetch sur `useParams`.

Clé de cache en session : `${type}_${lang}` dans un `useRef`.

Effet principal :

```js
useEffect(() => {
  const lang = (navigator.language || 'fr').slice(0, 2);
  const cacheKey = `${categorie}_${lang}`;

  if (cacheRef.current[cacheKey]) {
    setProducts(cacheRef.current[cacheKey]);
    return;
  }

  setLoading(true);
  axios.get(`${$SERVER}/api/products`, { params: { type: categorie, lang } })
    .then(res => {
      cacheRef.current[cacheKey] = res.data.data;
      setProducts(res.data.data);
    })
    .catch(/* appMessage erreur */)
    .finally(() => setLoading(false));
}, [categorie]);
```

Conséquences :
- Bug du reload sur catégorie : corrigé (la page lit son URL au mount, ne dépend plus d'un state global encore vide).
- Payload divisé : 50-80 produits par écran au lieu de 300.

### `ProductItem/index.js`

Avant :
```jsx
<Translator cacheProvider={...} from="fr" to={...} googleApiKey={...}>
  <p className="description"><Translate>{description}</Translate></p>
</Translator>
```

Après :
```jsx
<p className="description">{description}</p>
```

Suppressions associées : import `react-auto-translate`, import `GOOGLE_API_KEY`, bloc `cacheProvider`, variable `userLang`.

### `_const.js` et `package.json`

- Retirer `GOOGLE_API_KEY` de `_const.js`.
- Retirer `react-auto-translate` de `dependencies`.

## Migration et déploiement

**Ordre impératif pour éviter downtime** :

### Étape 1 — Back

1. Branche `feat/i18n-server-side` sur `1755-back`.
2. Ajouter les champs au modèle (rétrocompatible, defaults vides).
3. Créer `services/translator.js`.
4. Créer `scripts/migrate-hashes.js` (calcule `descriptionHash` pour tous les produits existants, `translations = {}`).
5. Nouveau endpoint `getProductsByType` + route `GET /api/products`.
6. Modifier `updateProduct` pour gérer l'invalidation.
7. **Conserver `/allProducts`** pour compat ascendante avec le front actuel.
8. Config Heroku : `GOOGLE_TRANSLATE_API_KEY` (nouvelle clé, restreinte par IP/referer).
9. Déployer en prod. Exécuter `scripts/migrate-hashes.js` une fois.
10. Vérifier : le front actuel (non modifié) continue à fonctionner.

### Étape 2 — Front

1. Branche `feat/i18n-server-side` sur `1755-front`.
2. Refondre `App.js`, `Categories`, `ProductItem` selon spec.
3. Retirer `GOOGLE_API_KEY` et `react-auto-translate`.
4. Tester en local avec `$SERVER` pointé sur Heroku.
5. Déployer.

### Étape 3 — Nettoyage (quelques jours après)

1. Vérifier via `heroku logs` que `/allProducts` n'est plus appelé en mode non-admin.
2. Éventuellement restreindre `/allProducts` à l'admin authentifié.
3. Révoquer l'ancienne clé Google (celle qui était dans le bundle front).

## Tests manuels

- [ ] Reload direct sur `/categorie/vins` → produits s'affichent (fix du bug).
- [ ] Navigateur en italien → descriptions en italien après délai initial.
- [ ] Second visiteur italien → réponse quasi-instantanée (cache hit en DB).
- [ ] Modifier une description en admin → traductions purgées, re-générées à la vue suivante dans chaque langue.
- [ ] Modifier seulement le `name` ou `price` → traductions conservées.
- [ ] Admin connecté → voit tous les produits, `visible=false` inclus, en VF brute.
- [ ] Inspection du bundle JS prod → aucune trace de `GOOGLE_API_KEY`.
- [ ] `heroku logs` → les appels `[translate]` sont logués et raisonnables en volume.

## Monitoring

Log à chaque appel Google : `[translate] fr→<lang> <N> textes <totalChars> chars`.
Permet de détecter en prod toute anomalie (boucle, bug d'invalidation) qui ferait exploser les appels.

## Rollback

Chaque étape est indépendante. Tant que `/allProducts` existe côté back, le front actuel peut être redéployé sans modification. Les nouveaux champs `descriptionHash` et `translations` sont inoffensifs pour l'ancien front (ignorés).

## Hors scope

- Interface d'édition manuelle des traductions (décision : 100 % auto).
- Traduction des `region`, `name`, `subCategory` (non traduits aujourd'hui).
- Support de langues régionales / codes à 4 lettres (`zh-Hant` → traité comme `zh`).
- Pagination (volume par catégorie reste sous les 100 produits).
- Migration vers un autre moteur de traduction (DeepL, LibreTranslate) — possible plus tard, l'architecture est agnostique.
