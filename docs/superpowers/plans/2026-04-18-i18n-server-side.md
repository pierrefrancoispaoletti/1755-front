# Traduction serveur + cache persistant — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer `react-auto-translate` (client) par une traduction Google Translate côté serveur avec cache persistant en DB, et refactorer le chargement produits en lazy-par-catégorie (fix du bug de reload au passage).

**Architecture:** Back stocke les traductions dans le document Product (Mongoose Map indexée par code langue). Un hash SHA1 du texte FR normalisé détecte les modifications et purge les traductions périmées. Le front consomme un nouvel endpoint `GET /api/products?type=X&lang=Y` qui retourne des descriptions déjà localisées, avec cache client par session via `useRef`.

**Tech Stack:** Node.js/Express + Mongoose (back), React 17 + react-router 5 + axios (front), API Google Translate v2 REST.

**Note tests:** Les deux repos n'ont pas d'infrastructure de test en place. Le plan utilise des vérifications manuelles ciblées (curl, navigateur, heroku logs) plutôt que d'introduire Jest/Mocha pour cette migration. Chaque tâche impactante inclut des checkpoints de vérification.

**Repos:**
- Back : `/Users/pierrefrancoispaoletti/appdevelopment/1755-back` — branche `feat/i18n-server-side`
- Front : `/Users/pierrefrancoispaoletti/appdevelopment/1755-front` — branche `feat/i18n-server-side`

---

## Phase 1 — Back (1755-back)

### Task 1 : Créer la branche et récupérer une clé Google dédiée serveur

**Files:** aucun fichier modifié, préparation d'environnement.

- [ ] **Step 1 : Créer la branche**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-back
git checkout main
git pull
git checkout -b feat/i18n-server-side
```

- [ ] **Step 2 : Créer une nouvelle clé API Google Translate**

Aller sur `https://console.cloud.google.com/apis/credentials` :
1. "Create Credentials" → "API key".
2. La restreindre : **Application restrictions** = IP addresses (IP Heroku) OU HTTP referrers laissé vide pour l'instant (on restreindra post-déploiement quand on aura l'IP sortante Heroku).
3. **API restrictions** = sélectionner uniquement "Cloud Translation API".
4. Copier la clé, ne pas la commiter.

**Important** : c'est une **nouvelle clé**, distincte de celle actuellement dans le bundle front. L'ancienne sera révoquée à la fin.

- [ ] **Step 3 : Ajouter la clé à Heroku**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-back
heroku config:set GOOGLE_TRANSLATE_API_KEY=<la_clé_copiée> -a le-1755
heroku config:get GOOGLE_TRANSLATE_API_KEY -a le-1755
```

Expected : la clé s'affiche (vérif).

---

### Task 2 : Étendre le modèle Product

**Files:**
- Modify: `database/models/Product.js`

- [ ] **Step 1 : Ajouter les champs `descriptionHash` et `translations`**

Remplacer le contenu du fichier `database/models/Product.js` par :

```js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProductModel = new Schema({
  name: {
    type: String,
    required: true,
    default: "",
  },
  description: {
    type: String,
    default: "",
  },
  region: {
    type: String,
    default: "",
  },
  price: {
    type: Number,
    required: true,
    default: 0,
  },
  type: {
    type: String,
    required: true,
  },
  category: {
    type: String,
  },
  subCategory: {
    type: String,
  },
  choice: {
    type: Boolean,
    default: false,
  },
  visible: {
    type: Boolean,
    default: true,
  },
  image: {
    data: Buffer,
    contentType: String,
  },
  descriptionHash: {
    type: String,
    default: "",
  },
  translations: {
    type: Map,
    of: String,
    default: {},
  },
});

const Product = mongoose.model("products", ProductModel);
module.exports = Product;
```

- [ ] **Step 2 : Vérifier la syntaxe**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-back
node -e "require('./database/models/Product')"
```

Expected : aucune erreur (silence = OK).

- [ ] **Step 3 : Commit**

```bash
git add database/models/Product.js
git commit -m "feat(product): ajout champs descriptionHash et translations"
```

---

### Task 3 : Créer le service de traduction

**Files:**
- Create: `services/translator.js`

- [ ] **Step 1 : Créer le dossier si besoin**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-back
mkdir -p services
```

- [ ] **Step 2 : Écrire `services/translator.js`**

```js
const crypto = require("crypto");

const normalize = (text) => text.trim().replace(/\s+/g, " ");

const hash = (text) =>
  crypto.createHash("sha1").update(normalize(text)).digest("hex");

const translateBatch = async (texts, from, to) => {
  if (!texts || texts.length === 0) return [];
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_TRANSLATE_API_KEY not set");
  }

  const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
  const body = {
    q: texts,
    source: from,
    target: to,
    format: "text",
  };

  const totalChars = texts.reduce((s, t) => s + t.length, 0);
  console.log(
    `[translate] ${from}->${to} ${texts.length} textes ${totalChars} chars`
  );

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Translate ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.data.translations.map((t) => t.translatedText);
};

module.exports = { normalize, hash, translateBatch };
```

Note : `fetch` est dispo nativement dans Node 18+. Vérifier la version Node utilisée par Heroku : `heroku config -a le-1755 | grep NODE` ou `heroku run node -v -a le-1755`. Si < 18, ajouter `node-fetch` aux dépendances et `const fetch = require("node-fetch");` en tête de fichier.

- [ ] **Step 3 : Vérifier la version Node sur Heroku**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-back
heroku run node -v -a le-1755
```

Si `v18` ou plus : OK, passer au step 4.
Si < v18 : installer `node-fetch@2` :

```bash
npm install node-fetch@2
```

Puis modifier `services/translator.js` pour ajouter en première ligne :
```js
const fetch = require("node-fetch");
```

- [ ] **Step 4 : Test local rapide du service**

Créer un fichier jetable `test-translator.js` à la racine :

```js
require("dotenv").config();
process.env.GOOGLE_TRANSLATE_API_KEY = "<coller_la_clé_ici_temporairement>";
const { translateBatch, hash } = require("./services/translator");

(async () => {
  console.log("hash:", hash("  Vin   rouge  corsé  "));
  const out = await translateBatch(
    ["Vin rouge corsé du Piémont", "Crémant de Bourgogne"],
    "fr",
    "it"
  );
  console.log("translations:", out);
})();
```

```bash
node test-translator.js
```

Expected :
- `hash:` affiche un sha1 hexadécimal de 40 caractères.
- `translations:` affiche un tableau de 2 chaînes en italien.
- Le log `[translate] fr->it 2 textes ...` apparaît.

- [ ] **Step 5 : Supprimer le fichier de test jetable**

```bash
rm test-translator.js
```

- [ ] **Step 6 : Commit**

```bash
git add services/translator.js package.json package-lock.json 2>/dev/null
git commit -m "feat(translator): service Google Translate côté serveur"
```

---

### Task 4 : Script de migration des hashes

**Files:**
- Create: `scripts/migrate-hashes.js`

- [ ] **Step 1 : Créer le dossier et le script**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-back
mkdir -p scripts
```

Écrire `scripts/migrate-hashes.js` :

```js
require("./../database");
const Product = require("../database/models/Product");
const { hash } = require("../services/translator");

(async () => {
  try {
    const products = await Product.find();
    console.log(`Found ${products.length} products`);
    let updated = 0;
    for (const p of products) {
      const newHash = p.description ? hash(p.description) : "";
      if (p.descriptionHash !== newHash || !p.translations) {
        p.descriptionHash = newHash;
        p.translations = new Map();
        await p.save();
        updated++;
      }
    }
    console.log(`Updated ${updated} products`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
```

Note : le chemin `./../database` démarre la connexion Mongo de la même façon que `index.js` (ligne 3 : `require("./database");`).

- [ ] **Step 2 : Vérifier la connexion DB du fichier `database/index.js`**

```bash
cat /Users/pierrefrancoispaoletti/appdevelopment/1755-back/database/index.js
```

Vérifier que ce fichier ouvre bien la connexion Mongo (via `mongoose.connect(...)`) de façon autonome. Si le fichier dépend de variables d'env passées au script, adapter `migrate-hashes.js` pour charger `dotenv` en première ligne.

- [ ] **Step 3 : Ne pas exécuter encore**

Le script sera exécuté sur Heroku à la Task 7 (après déploiement). Ne pas lancer contre la prod depuis le local sans filet.

- [ ] **Step 4 : Commit**

```bash
git add scripts/migrate-hashes.js
git commit -m "feat(migration): script d'initialisation des descriptionHash"
```

---

### Task 5 : Nouveau endpoint `getProductsByType`

**Files:**
- Modify: `controllers/product.controller.js`
- Modify: `routes/products.routes.js`

- [ ] **Step 1 : Ajouter la fonction `getProductsByType` dans le controller**

Ouvrir `controllers/product.controller.js`. En tête de fichier, ajouter aux imports :

```js
const { hash, translateBatch } = require("../services/translator");
```

À la suite de `exports.getAllProducts = ...` (après sa fermeture ligne ~43), ajouter :

```js
exports.getProductsByType = async (req, res) => {
  const { type } = req.query;
  const lang = (req.query.lang || "fr").toLowerCase().slice(0, 2);

  if (!type) {
    return res.status(400).json({
      status: 400,
      message: "Le paramètre 'type' est requis",
    });
  }

  try {
    const products = await Product.find({ type });

    if (lang === "fr") {
      return res.json({ status: 200, data: products });
    }

    const missing = products.filter(
      (p) => p.description && !p.translations.get(lang)
    );

    if (missing.length > 0) {
      const translated = await translateBatch(
        missing.map((p) => p.description),
        "fr",
        lang
      );
      await Promise.all(
        missing.map((p, i) => {
          p.translations.set(lang, translated[i]);
          return p.save();
        })
      );
    }

    const localized = products.map((p) => {
      const obj = p.toObject();
      if (obj.description && p.translations.get(lang)) {
        obj.description = p.translations.get(lang);
      }
      delete obj.translations;
      delete obj.descriptionHash;
      return obj;
    });

    return res.json({ status: 200, data: localized });
  } catch (error) {
    console.error("[getProductsByType]", error);
    return res.status(500).json({
      status: 500,
      message: "Une erreur est survenue",
    });
  }
};
```

- [ ] **Step 2 : Exporter la fonction dans la route**

Ouvrir `routes/products.routes.js`.

Remplacer l'import en tête :

```js
const {
  createProduct,
  deleteProduct,
  updateProduct,
  updateProductImage,
  getAllProducts,
  getProductsByType,
} = require("../controllers/product.controller");
```

Ajouter la route **avant** `router.get("/allProducts", getAllProducts);` :

```js
router.get("/", getProductsByType);
```

- [ ] **Step 3 : Tester en local**

Démarrer le back en local :

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-back
GOOGLE_TRANSLATE_API_KEY=<clé> npm run server
```

(Ou utiliser un `.env` + dotenv si déjà configuré.)

Dans un autre terminal :

```bash
curl "http://localhost:5000/api/products?type=vins&lang=fr" | head -c 500
```

Expected : JSON avec `status: 200` et un tableau `data` contenant des produits de type "vins".

```bash
curl "http://localhost:5000/api/products?type=vins&lang=it" | head -c 500
```

Expected :
- 1ʳᵉ fois : latence de quelques secondes, puis JSON avec des `description` en italien. Le log serveur affiche `[translate] fr->it N textes ...`.
- 2ᵉ fois : réponse rapide, aucun nouveau log `[translate]`.

- [ ] **Step 4 : Vérifier qu'aucun paramètre type manquant ne casse le serveur**

```bash
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:5000/api/products"
```

Expected : `400`.

- [ ] **Step 5 : Commit**

```bash
git add controllers/product.controller.js routes/products.routes.js
git commit -m "feat(products): endpoint GET /api/products?type=X&lang=Y avec trad serveur"
```

---

### Task 6 : Invalidation dans `updateProduct`

**Files:**
- Modify: `controllers/product.controller.js`

- [ ] **Step 1 : Adapter `updateProduct` pour détecter les changements de description**

Dans `controllers/product.controller.js`, localiser la fonction `exports.updateProduct` (ligne ~159). Remplacer intégralement son corps par :

```js
exports.updateProduct = async (req, res, next) => {
  const { update, productId } = req.body;
  if (!update || !productId) {
    return res.json({
      status: 500,
      message: "il y a eu un probléme",
    });
  }
  try {
    if (update.description !== undefined) {
      const existing = await Product.findById(productId);
      const newHash = update.description ? hash(update.description) : "";
      if (!existing || existing.descriptionHash !== newHash) {
        update.descriptionHash = newHash;
        update.translations = {};
      } else {
        delete update.description;
      }
    }

    const products = await updateProduct(update, productId);
    if (!products) {
      return res.json({
        status: 500,
        message: "il y a eu un probléme",
      });
    }
    return res.json({
      status: 200,
      data: products,
      message: "Produit mis a jour avec succés",
    });
  } catch (error) {
    return res.json({
      status: 500,
      message: "il y a eu un probleme",
    });
  }
};
```

Note explicative :
- Si la description est inchangée (hash identique), on supprime le champ `description` du `update` pour éviter une écriture inutile et préserver les traductions.
- Si elle a changé, on purge `translations` (objet vide — sera stocké comme Map vide par Mongoose).
- Si `update.description` n'est pas dans la requête, on ne touche à rien.

- [ ] **Step 2 : Test manuel — description inchangée**

Démarrer le back en local. Choisir un produit existant avec description, noter son `_id` (via `curl "http://localhost:5000/api/products?type=vins&lang=it"` pour peupler les traductions italiennes).

```bash
# Remplacer <token> et <id> et <description actuelle>
curl -X POST http://localhost:5000/api/products/updateProduct \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"productId":"<id>","update":{"description":"<description actuelle inchangée>","price":99}}'
```

Expected : réponse 200. Vérifier en Mongo que `translations.it` est toujours là sur ce produit.

- [ ] **Step 3 : Test manuel — description modifiée**

```bash
curl -X POST http://localhost:5000/api/products/updateProduct \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"productId":"<id>","update":{"description":"Nouvelle description modifiée"}}'
```

Expected : réponse 200. Vérifier que `translations` est maintenant vide sur ce produit en Mongo.

```bash
curl "http://localhost:5000/api/products?type=vins&lang=it" > /dev/null
```

Expected : log `[translate] fr->it 1 textes ...` (le produit modifié est re-traduit tout seul).

- [ ] **Step 4 : Commit**

```bash
git add controllers/product.controller.js
git commit -m "feat(products): invalidation des traductions au changement de description"
```

---

### Task 7 : Déploiement back + migration

**Files:** aucun.

- [ ] **Step 1 : Merger la branche back**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-back
git push -u origin feat/i18n-server-side
```

Créer une PR, la faire reviewer, puis merger dans `main`.

- [ ] **Step 2 : Déployer sur Heroku**

```bash
git checkout main
git pull
git push heroku main
```

(Adapter le nom du remote Heroku si différent : `git remote -v`.)

Attendre la fin du build. Vérifier :

```bash
heroku logs --tail -a le-1755
```

Expected : serveur redémarre sans erreur.

- [ ] **Step 3 : Exécuter le script de migration**

```bash
heroku run node scripts/migrate-hashes.js -a le-1755
```

Expected :
```
Found ~300 products
Updated ~300 products
```

- [ ] **Step 4 : Smoke test en prod**

```bash
curl "https://le-1755.herokuapp.com/api/products?type=vins&lang=fr" | head -c 300
curl "https://le-1755.herokuapp.com/api/products?type=vins&lang=en" | head -c 300
```

Expected :
- Première requête (fr) : rapide.
- Deuxième (en) : plus lente sur la 1ʳᵉ fois (traduction), puis rapide sur les suivantes.

- [ ] **Step 5 : Vérifier le front actuel continue de fonctionner**

Ouvrir `https://baravin1755.com` dans un navigateur. L'ancien front tape toujours `/allProducts`, ce endpoint existe toujours → l'app fonctionne comme avant.

Expected : l'application affiche les produits normalement. `react-auto-translate` continue à traduire en client pour l'instant (pas encore supprimé).

---

## Phase 2 — Front (1755-front)

### Task 8 : Créer la branche front

**Files:** aucun.

- [ ] **Step 1 : Créer la branche**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
git checkout main
git pull
git checkout -b feat/i18n-server-side
```

---

### Task 9 : Refondre `Categories` pour fetch lazy par type

**Files:**
- Modify: `src/pages/Categories/index.js`
- Modify: `src/components/App/App.js` (passage de props seulement)

- [ ] **Step 1 : Lire le state actuellement passé à `Categories`**

```bash
grep -n "Categories" /Users/pierrefrancoispaoletti/appdevelopment/1755-front/src/components/App/App.js
```

Relever comment `Categories` est monté (les props passées). Le but de l'étape suivante est de rendre `Categories` autonome pour les produits.

- [ ] **Step 2 : Adapter `src/pages/Categories/index.js`**

Remplacer la signature du composant et ses effets de chargement. Dans les imports, s'assurer que `axios` et `$SERVER` sont importés (ils le sont déjà).

Juste après les hooks existants (`const [loading, setLoading] = useState(false);` ligne 42), ajouter :

```js
const [products, setProducts] = useState([]);
const cacheRef = useRef({});
```

Remplacer le premier `useEffect` (qui filtrait `products` venant des props) par un effet qui fetch par type. Le bloc actuel (lignes ~63-69) :

```js
useEffect(() => {
  setFilteredProducts(
    products.filter(
      (p) => p.type === selectedCategory.slug && p.category === activeMenu
    )
  );
}, [products]);
```

devient :

```js
useEffect(() => {
  const type = selectedCategory?.slug;
  if (!type) return;
  const lang = (navigator.language || "fr").toLowerCase().slice(0, 2);
  const cacheKey = `${type}_${lang}`;

  if (cacheRef.current[cacheKey]) {
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
}, [selectedCategory]);

useEffect(() => {
  if (!products.length) {
    setFilteredProducts([]);
    return;
  }
  if (activeMenu) {
    setFilteredProducts(products.filter((p) => p.category === activeMenu));
  } else {
    setFilteredProducts(products);
  }
}, [products, activeMenu]);
```

Retirer la prop `products` du déstructuring en tête du composant (ligne 29). Retirer également `setProducts` (ligne 34) **uniquement si** il n'est plus utilisé ailleurs dans le composant — le `grep` en step suivant le confirmera.

- [ ] **Step 3 : Vérifier les usages de `setProducts` dans Categories**

```bash
grep -n "setProducts" /Users/pierrefrancoispaoletti/appdevelopment/1755-front/src/pages/Categories/index.js
```

Les handlers `handleDeleteProduct`, `handleChangeVisibility`, `handleChangeChoice` appellent `setProducts(response.data.data)` après une mutation admin. Ces handlers reçoivent la liste complète de la DB (tous types confondus) du endpoint `updateProduct` / `deleteProduct`. Comportement à conserver pour l'admin.

**Adaptation** : remplacer chacun de ces `.then((response) => setProducts(response.data.data))` par un recalcul ciblé qui ne garde que les produits du type affiché :

```js
.then((response) => {
  const filtered = response.data.data.filter(
    (p) => p.type === selectedCategory.slug
  );
  setProducts(filtered);
  const cacheKey = `${selectedCategory.slug}_${(
    navigator.language || "fr"
  ).toLowerCase().slice(0, 2)}`;
  cacheRef.current[cacheKey] = filtered;
})
```

Faire cette substitution dans les trois handlers (`handleDeleteProduct`, `handleChangeVisibility`, `handleChangeChoice`).

Note : après une mutation admin, le cache client est mis à jour avec les VF brutes. C'est acceptable pour l'admin (il édite en FR). S'il bascule ensuite en italien, la prochaine navigation vers cette catégorie refetchera proprement.

- [ ] **Step 4 : Mettre à jour `App.js` pour ne plus passer `products` à Categories**

Ouvrir `src/components/App/App.js`.

Localiser la passation de props vers `<Categories ... />` (rechercher `<Categories`). Retirer les props `products={products}` et, si plus utilisée ailleurs, `setProducts={setProducts}`.

**Ne pas** supprimer le state `products` et son fetch global pour l'instant : la Task 12 s'en chargera après validation UI.

- [ ] **Step 5 : Tester en local — navigation par catégorie**

Modifier temporairement `src/_const/_const.js` pour pointer sur Heroku (ou garder sur Heroku si déjà le cas).

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
npm start
```

Dans le navigateur :
1. Ouvrir le site, aller sur `/categorie/vins` → produits s'affichent.
2. Changer pour `/categorie/alcools` → nouveau fetch, produits s'affichent.
3. Revenir sur `/categorie/vins` → pas de nouveau fetch (onglet Network), affichage instantané.
4. **Recharger la page sur `/categorie/vins`** → produits s'affichent directement (fix du bug).
5. Ouvrir l'inspecteur réseau, filtrer sur "products" → voir les requêtes `?type=vins&lang=fr`.

- [ ] **Step 6 : Tester en local — langue non-FR**

Changer la langue du navigateur en italien (paramètres Chrome/Firefox → langue) et recharger.

Expected : les `description` des produits sont en italien, pas d'appel à `translation.googleapis.com` côté client (onglet Network du navigateur).

- [ ] **Step 7 : Commit**

```bash
git add src/pages/Categories/index.js src/components/App/App.js
git commit -m "refactor(categories): fetch lazy par type + cache session"
```

---

### Task 10 : Simplifier `ProductItem`

**Files:**
- Modify: `src/components/Small/ProductItem/index.js`

- [ ] **Step 1 : Retirer `react-auto-translate` du composant**

Remplacer intégralement le contenu de `src/components/Small/ProductItem/index.js` par :

```js
import { faHeart, faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { Header } from "semantic-ui-react";
import "./productitem.css";

const ProductItem = ({
  product,
  name,
  type,
  region,
  description,
  price,
  category,
  choice,
  visible,
  image,
  user,
  setOpenImageModal,
  setSelectedProduct,
}) => {
  return (
    <div
      className="productitem"
      style={{ display: visible ? "" : user ? "" : "none" }}
    >
      <div className="productitem-header">
        <Header
          as="h3"
          style={
            type === "vins" && category === "rouges"
              ? { color: "darkred" }
              : type === "vins" && category === "roses"
              ? { color: "#fec5d9" }
              : type === "vins" && category === "blancs"
              ? { color: "#f1f285" }
              : { color: "" }
          }
        >
          {!visible ? "Caché : " : ""}
          {name}
          {image && (
            <FontAwesomeIcon
              style={{ color: "white", margin: 8 }}
              icon={faSearch}
              onClick={() => {
                setSelectedProduct(product);
                setOpenImageModal(true);
              }}
            />
          )}
          {choice ? (
            <FontAwesomeIcon
              className="bosschoice alvp__icon"
              icon={faHeart}
              color="darkred"
              size="2x"
            />
          ) : (
            ""
          )}
        </Header>
        <span className="price">
          {price.toFixed(2)}
          <small>€</small>
        </span>
      </div>
      {region && <div className="region">{region}</div>}
      {description && <p className="description">{description}</p>}
    </div>
  );
};

export default ProductItem;
```

- [ ] **Step 2 : Vérifier en navigateur**

App toujours en `npm start`. Naviguer dans les catégories.

Expected :
- Descriptions s'affichent en une fois, sans flash `"..."` (loader de `react-auto-translate`).
- En italien : descriptions en italien directement, aucun appel vers `translation.googleapis.com`.
- En français : descriptions en français.

- [ ] **Step 3 : Commit**

```bash
git add src/components/Small/ProductItem/index.js
git commit -m "refactor(ProductItem): suppression de react-auto-translate"
```

---

### Task 11 : Nettoyer `App.js` du fetch global public

**Files:**
- Modify: `src/components/App/App.js`

- [ ] **Step 1 : Restreindre le fetch `/allProducts` aux admins**

Ouvrir `src/components/App/App.js`. Localiser le `useEffect` (lignes 69-93 à l'origine) qui fait `fetch(${$SERVER}/api/products/allProducts)`.

L'adapter pour ne s'exécuter que si `user` est connecté. Si `user` existe, on continue à charger tous les produits pour fournir la VF brute aux pages admin. Sinon, on ne fait rien (les pages Categories gèrent leur propre fetch).

Modification : ajouter une garde en tête et `user` dans les dépendances :

```js
useEffect(() => {
  if (!user) {
    setProducts([]);
    setLoading(false);
    return;
  }
  setLoading(true);
  fetch(`${$SERVER}/api/products/allProducts`)
    .then((response) => {
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let productsData = "";

      reader.read().then(function processText({ done, value }) {
        if (done) {
          setProducts(JSON.parse(productsData).data);
          return;
        }
        productsData += decoder.decode(value, { stream: true });
        return reader.read().then(processText);
      });
    })
    .catch((error) => {
      console.error("Erreur lors de la récupération des produits:", error);
      setAppMessage({
        success: false,
        message: "Il y a eu un probléme, veuillez recharger la page",
      });
    })
    .finally(() => setLoading(false));
}, [user]);
```

- [ ] **Step 2 : Tester — utilisateur non connecté**

Ouvrir le site en navigation privée. Onglet Network.

Expected : aucune requête vers `/api/products/allProducts`. Seules des requêtes `/api/products?type=X&lang=Y` apparaissent quand on navigue.

- [ ] **Step 3 : Tester — utilisateur connecté (admin)**

Se connecter en tant qu'admin via la modal de login. Onglet Network.

Expected : une requête `/allProducts` après login, puis navigation normale avec produits cachés visibles.

- [ ] **Step 4 : Commit**

```bash
git add src/components/App/App.js
git commit -m "refactor(App): /allProducts réservé aux admins connectés"
```

---

### Task 12 : Supprimer `react-auto-translate` et `GOOGLE_API_KEY`

**Files:**
- Modify: `src/_const/_const.js`
- Modify: `package.json`

- [ ] **Step 1 : Retirer `GOOGLE_API_KEY` de `_const.js`**

Ouvrir `src/_const/_const.js`. Supprimer la ligne :

```js
export const GOOGLE_API_KEY = "AIzaSyAZaWwVgn5z9gNPy0cbweEVGUeWwva5GGM";
```

- [ ] **Step 2 : Vérifier qu'aucun autre fichier ne l'utilise**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
grep -rn "GOOGLE_API_KEY" src/
```

Expected : aucun résultat.

- [ ] **Step 3 : Désinstaller `react-auto-translate`**

```bash
npm uninstall react-auto-translate
```

- [ ] **Step 4 : Vérifier qu'aucun fichier n'importe encore `react-auto-translate`**

```bash
grep -rn "react-auto-translate" src/
```

Expected : aucun résultat.

- [ ] **Step 5 : Build pour confirmer l'absence de la clé**

```bash
npm run build
grep -r "AIzaSyAZaW" build/ || echo "clé absente du bundle"
```

Expected : `clé absente du bundle`.

- [ ] **Step 6 : Commit**

```bash
git add src/_const/_const.js package.json package-lock.json
git commit -m "chore: suppression de GOOGLE_API_KEY et react-auto-translate"
```

---

### Task 13 : Déploiement front + tests finaux

**Files:** aucun.

- [ ] **Step 1 : Merger la branche front**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
git push -u origin feat/i18n-server-side
```

Créer PR, review, merger dans `main`.

- [ ] **Step 2 : Déployer**

Utiliser le script existant :

```bash
git checkout main
git pull
npm run deploy
```

(Ou le flow de déploiement habituel de cette app.)

- [ ] **Step 3 : Tests manuels en prod**

Sur `https://baravin1755.com`, vérifier :

- [ ] Reload direct sur `/categorie/vins` → produits s'affichent.
- [ ] Navigateur en italien → descriptions en italien après ~1-2 s la 1ʳᵉ fois puis instantanément ensuite.
- [ ] Un autre visiteur en italien (autre navigateur) → descriptions en italien instantanément.
- [ ] Admin connecté → voit les produits `visible=false`, descriptions en VF brute.
- [ ] Inspection du bundle (F12 → Sources → rechercher `AIzaSy`) → aucun résultat.
- [ ] `heroku logs --tail -a le-1755` pendant 10 min → les appels `[translate]` sont raisonnables (quelques-uns par langue neuve, zéro par langue déjà vue).

- [ ] **Step 4 : Modifier une description via l'admin**

Choisir un produit déjà traduit en italien. Éditer sa description en VF via l'admin.

Expected : sur la prochaine visite en italien de cette catégorie, un seul log `[translate] fr->it 1 textes ...` apparaît. Les autres produits de la catégorie ne sont pas re-traduits.

- [ ] **Step 5 : Révoquer l'ancienne clé Google**

Sur `https://console.cloud.google.com/apis/credentials`, supprimer la clé `AIzaSyAZaWwVgn5z9gNPy0cbweEVGUeWwva5GGM` (celle de l'ancien `_const.js`).

Vérifier dans les 24 h suivantes via Google Cloud Console que cette clé n'enregistre plus aucun appel (elle ne devrait plus depuis la Task 12).

---

## Récapitulatif

| Tâche | Repo | Action clé |
|---|---|---|
| 1 | back | Branche + clé Google serveur |
| 2 | back | Modèle Product étendu |
| 3 | back | Service translator.js |
| 4 | back | Script migration hashes |
| 5 | back | Endpoint `GET /api/products` |
| 6 | back | Invalidation `updateProduct` |
| 7 | back | Déploiement + migration |
| 8 | front | Branche |
| 9 | front | Categories lazy fetch |
| 10 | front | ProductItem simplifié |
| 11 | front | App.js restreint aux admins |
| 12 | front | Suppression clé + lib |
| 13 | front | Déploiement + validation |

**Point d'arrêt sûr** après la Task 7 : back en prod, front inchangé, application fonctionne comme avant. Les Tasks 8-13 peuvent être faites dans un second temps sans pression.
