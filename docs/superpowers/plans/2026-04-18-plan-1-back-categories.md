# Plan 1 — Back catégories + seed

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduire un modèle Mongoose `Category` avec CRUD complet et un script de seed idempotent (avec dry-run) dans le back `1755-back`, sans toucher au front.

**Architecture:** Nouvelle collection Mongo `categories` avec hiérarchie `parentId` (profondeur max 3). Controller + routes REST protégées JWT pour les mutations. Script `scripts/seed-categories.js` dérive un JSON versionné depuis la structure statique front actuelle (mapping FontAwesome → Lucide) et upsert par slug. Mode `--dry-run` qui compare les slugs seed avec `Product.type` / `.category` / `.subCategory` présents en base.

**Tech Stack:** Node 20, Express 4, Mongoose 7, passport-jwt, MongoDB Atlas (dev + prod Heroku).

**Conventions projet rappels:**
- Pas de framework de test (cf. `CLAUDE.md`). Vérification : `node --check`, `curl` local + Heroku, lecture logs.
- Branche dédiée `feat/admin-bottom-bar-categories` (déjà créée).
- Exécution prod via `heroku run` (app `le-1755`), **après** backup et dry-run validé.

---

## Files

- **Créer** : `1755-back/database/models/Category.js`
- **Créer** : `1755-back/queries/category.queries.js`
- **Créer** : `1755-back/controllers/category.controller.js`
- **Créer** : `1755-back/routes/categories.routes.js`
- **Créer** : `1755-back/scripts/seed-categories.js`
- **Créer** : `1755-back/scripts/categories-seed.json`
- **Modifier** : `1755-back/index.js` (mount de la route `/api/categories`)

---

### Task 1 : Vérifier branche et env

**Files:** —

- [ ] **Step 1 : Vérifier la branche active côté back**

Run:
```bash
git -C /Users/pierrefrancoispaoletti/appdevelopment/1755-back branch --show-current
```
Expected: `feat/admin-bottom-bar-categories`

- [ ] **Step 2 : Vérifier Node 20 actif**

Run:
```bash
node -v
```
Expected: `v20.x.x` (sinon `nvm use 20`).

- [ ] **Step 3 : Vérifier que `npm install` passe sans erreur**

Run:
```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-back && npm install
```
Expected: pas d'erreur, `node_modules/` à jour.

---

### Task 2 : Modèle Mongoose `Category`

**Files:**
- Create: `1755-back/database/models/Category.js`

- [ ] **Step 1 : Créer le fichier du modèle**

Écrire `1755-back/database/models/Category.js` :

```js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BadgeSchema = new Schema(
  {
    icon: { type: String, default: null },
    color: { type: String, default: null },
  },
  { _id: false }
);

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },
    order: { type: Number, default: 0 },
    visible: { type: Boolean, default: true },
    icon: { type: String, default: null },
    iconColor: { type: String, default: "#ffffff" },
    badge: { type: BadgeSchema, default: null },
  },
  { timestamps: true }
);

CategorySchema.index({ parentId: 1, order: 1 });

const Category = mongoose.model("categories", CategorySchema);
module.exports = Category;
```

- [ ] **Step 2 : Vérifier la syntaxe**

Run:
```bash
node --check /Users/pierrefrancoispaoletti/appdevelopment/1755-back/database/models/Category.js
```
Expected: pas de sortie (succès).

- [ ] **Step 3 : Vérifier que Mongoose charge le modèle**

Run:
```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-back && node -e "const C=require('./database/models/Category'); console.log(C.modelName, Object.keys(C.schema.paths).join(','))"
```
Expected: `categories name,slug,parentId,order,visible,icon,iconColor,badge,_id,createdAt,updatedAt`

- [ ] **Step 4 : Commit**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-back
git add database/models/Category.js
git commit -m "feat(category): modèle Mongoose Category avec hiérarchie parentId"
```

---

### Task 3 : Queries helpers

**Files:**
- Create: `1755-back/queries/category.queries.js`

- [ ] **Step 1 : Créer le fichier**

Écrire `1755-back/queries/category.queries.js` :

```js
const Category = require("../database/models/Category");
const Product = require("../database/models/Product");

const MAX_DEPTH = 3;

async function getDepth(parentId) {
  if (!parentId) return 1;
  let depth = 1;
  let current = await Category.findById(parentId).lean();
  while (current && current.parentId) {
    depth += 1;
    if (depth > MAX_DEPTH) return depth;
    current = await Category.findById(current.parentId).lean();
  }
  return depth;
}

async function listFlat() {
  return Category.find().sort({ parentId: 1, order: 1 }).lean();
}

function buildTree(flatList) {
  const byId = new Map();
  flatList.forEach((c) => byId.set(String(c._id), { ...c, children: [] }));
  const roots = [];
  byId.forEach((node) => {
    if (node.parentId) {
      const parent = byId.get(String(node.parentId));
      if (parent) parent.children.push(node);
      else roots.push(node);
    } else {
      roots.push(node);
    }
  });
  const sortRec = (arr) => {
    arr.sort((a, b) => a.order - b.order);
    arr.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

async function getTree() {
  const flat = await listFlat();
  return buildTree(flat);
}

async function findBySlug(slug) {
  return Category.findOne({ slug }).lean();
}

async function hasChildren(id) {
  const n = await Category.countDocuments({ parentId: id });
  return n > 0;
}

async function hasAttachedProducts(slug) {
  const n = await Product.countDocuments({
    $or: [{ type: slug }, { category: slug }, { subCategory: slug }],
  });
  return n > 0;
}

async function nextOrder(parentId) {
  const last = await Category.findOne({ parentId: parentId || null })
    .sort({ order: -1 })
    .lean();
  return last ? last.order + 1 : 0;
}

module.exports = {
  MAX_DEPTH,
  getDepth,
  listFlat,
  buildTree,
  getTree,
  findBySlug,
  hasChildren,
  hasAttachedProducts,
  nextOrder,
};
```

- [ ] **Step 2 : Vérifier syntaxe**

Run:
```bash
node --check /Users/pierrefrancoispaoletti/appdevelopment/1755-back/queries/category.queries.js
```
Expected: pas de sortie.

- [ ] **Step 3 : Vérifier que le module se charge**

Run:
```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-back && node -e "const q=require('./queries/category.queries'); console.log(Object.keys(q).join(','))"
```
Expected: `MAX_DEPTH,getDepth,listFlat,buildTree,getTree,findBySlug,hasChildren,hasAttachedProducts,nextOrder`

- [ ] **Step 4 : Commit**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-back
git add queries/category.queries.js
git commit -m "feat(category): queries helpers (tree, depth, cascade checks)"
```

---

### Task 4 : Controller

**Files:**
- Create: `1755-back/controllers/category.controller.js`

- [ ] **Step 1 : Créer le fichier**

Écrire `1755-back/controllers/category.controller.js` :

```js
const Category = require("../database/models/Category");
const {
  MAX_DEPTH,
  getDepth,
  listFlat,
  getTree,
  findBySlug,
  hasChildren,
  hasAttachedProducts,
  nextOrder,
} = require("../queries/category.queries");

const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;

exports.list = async (req, res) => {
  try {
    if (req.query.tree === "1" || req.query.tree === "true") {
      const tree = await getTree();
      return res.status(200).json({ status: 200, data: tree });
    }
    const flat = await listFlat();
    return res.status(200).json({ status: 200, data: flat });
  } catch (err) {
    console.error("[categories.list]", err);
    return res.status(500).json({ status: 500, message: "Erreur serveur" });
  }
};

exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id).lean();
    if (!category) {
      return res.status(404).json({ status: 404, message: "Catégorie introuvable" });
    }
    const children = await Category.find({ parentId: id })
      .sort({ order: 1 })
      .lean();
    return res.status(200).json({ status: 200, data: { ...category, children } });
  } catch (err) {
    console.error("[categories.getOne]", err);
    return res.status(500).json({ status: 500, message: "Erreur serveur" });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, slug, parentId = null, icon, iconColor, badge } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ status: 400, message: "name et slug requis" });
    }
    if (!SLUG_RE.test(slug)) {
      return res.status(400).json({
        status: 400,
        message: "slug invalide (a-z, 0-9, tirets ; commence par alphanum)",
      });
    }
    const existing = await findBySlug(slug);
    if (existing) {
      return res.status(409).json({ status: 409, message: "slug déjà utilisé" });
    }
    if (parentId) {
      const parent = await Category.findById(parentId).lean();
      if (!parent) {
        return res.status(400).json({ status: 400, message: "parentId introuvable" });
      }
      const depth = await getDepth(parentId);
      if (depth >= MAX_DEPTH) {
        return res.status(400).json({
          status: 400,
          message: `Profondeur maximale (${MAX_DEPTH}) atteinte`,
        });
      }
    }
    const order = await nextOrder(parentId);
    const doc = await Category.create({
      name,
      slug,
      parentId,
      order,
      icon: icon || null,
      iconColor: iconColor || "#ffffff",
      badge: badge || null,
    });
    return res.status(201).json({ status: 201, data: doc });
  } catch (err) {
    console.error("[categories.create]", err);
    return res.status(500).json({ status: 500, message: "Erreur serveur" });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, iconColor, badge, visible } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (icon !== undefined) update.icon = icon;
    if (iconColor !== undefined) update.iconColor = iconColor;
    if (badge !== undefined) update.badge = badge;
    if (visible !== undefined) update.visible = !!visible;
    const doc = await Category.findByIdAndUpdate(id, update, { new: true });
    if (!doc) {
      return res.status(404).json({ status: 404, message: "Catégorie introuvable" });
    }
    return res.status(200).json({ status: 200, data: doc });
  } catch (err) {
    console.error("[categories.update]", err);
    return res.status(500).json({ status: 500, message: "Erreur serveur" });
  }
};

exports.move = async (req, res) => {
  try {
    const { id } = req.params;
    const { parentId = null, order } = req.body;
    const doc = await Category.findById(id);
    if (!doc) {
      return res.status(404).json({ status: 404, message: "Catégorie introuvable" });
    }
    if (parentId && String(parentId) === String(id)) {
      return res
        .status(400)
        .json({ status: 400, message: "Une catégorie ne peut pas être son propre parent" });
    }
    if (parentId) {
      const parent = await Category.findById(parentId).lean();
      if (!parent) {
        return res.status(400).json({ status: 400, message: "parentId introuvable" });
      }
      const depth = await getDepth(parentId);
      if (depth >= MAX_DEPTH) {
        return res.status(400).json({
          status: 400,
          message: `Profondeur maximale (${MAX_DEPTH}) atteinte`,
        });
      }
    }
    doc.parentId = parentId || null;
    if (typeof order === "number") doc.order = order;
    await doc.save();
    return res.status(200).json({ status: 200, data: doc });
  } catch (err) {
    console.error("[categories.move]", err);
    return res.status(500).json({ status: 500, message: "Erreur serveur" });
  }
};

exports.reorder = async (req, res) => {
  try {
    const items = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ status: 400, message: "Body attendu: [{id, order}]" });
    }
    const ops = items
      .filter((i) => i && i.id && typeof i.order === "number")
      .map((i) => ({
        updateOne: { filter: { _id: i.id }, update: { $set: { order: i.order } } },
      }));
    if (!ops.length) {
      return res.status(400).json({ status: 400, message: "Aucun item valide" });
    }
    await Category.bulkWrite(ops);
    return res.status(200).json({ status: 200, data: { updated: ops.length } });
  } catch (err) {
    console.error("[categories.reorder]", err);
    return res.status(500).json({ status: 500, message: "Erreur serveur" });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Category.findById(id).lean();
    if (!doc) {
      return res.status(404).json({ status: 404, message: "Catégorie introuvable" });
    }
    if (await hasChildren(id)) {
      return res.status(409).json({
        status: 409,
        message: "Impossible de supprimer : la catégorie a des enfants",
      });
    }
    if (await hasAttachedProducts(doc.slug)) {
      return res.status(409).json({
        status: 409,
        message: "Impossible de supprimer : des produits référencent ce slug",
      });
    }
    await Category.deleteOne({ _id: id });
    return res.status(200).json({ status: 200, data: { _id: id } });
  } catch (err) {
    console.error("[categories.remove]", err);
    return res.status(500).json({ status: 500, message: "Erreur serveur" });
  }
};
```

- [ ] **Step 2 : Vérifier syntaxe**

Run:
```bash
node --check /Users/pierrefrancoispaoletti/appdevelopment/1755-back/controllers/category.controller.js
```
Expected: pas de sortie.

- [ ] **Step 3 : Commit**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-back
git add controllers/category.controller.js
git commit -m "feat(category): controller REST (list, create, update, move, reorder, delete)"
```

---

### Task 5 : Routes

**Files:**
- Create: `1755-back/routes/categories.routes.js`
- Modify: `1755-back/index.js`

- [ ] **Step 1 : Créer le fichier de routes**

Écrire `1755-back/routes/categories.routes.js` :

```js
const express = require("express");
const passport = require("passport");

const {
  list,
  getOne,
  create,
  update,
  move,
  reorder,
  remove,
} = require("../controllers/category.controller");

const router = express.Router();
const adminAuth = passport.authenticate("jwt", { session: false });

router.get("/", list);
router.get("/:id", getOne);
router.post("/", adminAuth, create);
router.put("/reorder", adminAuth, reorder);
router.put("/:id", adminAuth, update);
router.put("/:id/move", adminAuth, move);
router.delete("/:id", adminAuth, remove);

module.exports = router;
```

Note : `/reorder` est déclaré **avant** `/:id` pour éviter que le param id matche "reorder".

- [ ] **Step 2 : Mount dans `index.js`**

Modifier `1755-back/index.js` — après la ligne `const config = require("./routes/config.routes");` ajouter :

```js
const categories = require("./routes/categories.routes");
```

Puis après `app.use("/api/events", events);` ajouter :

```js
app.use("/api/categories", categories);
```

- [ ] **Step 3 : Vérifier syntaxe**

Run:
```bash
node --check /Users/pierrefrancoispaoletti/appdevelopment/1755-back/routes/categories.routes.js && node --check /Users/pierrefrancoispaoletti/appdevelopment/1755-back/index.js
```
Expected: pas de sortie.

- [ ] **Step 4 : Commit**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-back
git add routes/categories.routes.js index.js
git commit -m "feat(category): routes REST montées sur /api/categories"
```

---

### Task 6 : Vérification locale des endpoints (lecture publique)

**Files:** —

- [ ] **Step 1 : Lancer le serveur en local**

Run (dans un terminal dédié, laissé ouvert) :
```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-back && npm run server
```
Expected: `Server up and running on port 8080 !`

- [ ] **Step 2 : Tester `GET /api/categories` (base vide)**

Run:
```bash
curl -s http://localhost:8080/api/categories | head -c 200
```
Expected: `{"status":200,"data":[]}`

- [ ] **Step 3 : Tester `GET /api/categories?tree=1`**

Run:
```bash
curl -s "http://localhost:8080/api/categories?tree=1"
```
Expected: `{"status":200,"data":[]}`

- [ ] **Step 4 : Tester qu'une création sans auth est refusée**

Run:
```bash
curl -s -X POST http://localhost:8080/api/categories -H "Content-Type: application/json" -d '{"name":"Test","slug":"test"}' -o /dev/null -w "%{http_code}\n"
```
Expected: `401`

- [ ] **Step 5 : Arrêter le serveur (Ctrl+C dans son terminal)**

---

### Task 7 : Source JSON du seed

**Files:**
- Create: `1755-back/scripts/categories-seed.json`

- [ ] **Step 1 : Créer le JSON dérivé de la structure statique actuelle**

Écrire `1755-back/scripts/categories-seed.json` :

```json
[
  {
    "name": "La Cuisine (Midi)",
    "slug": "cuisine-midi",
    "icon": "UtensilsCrossed",
    "iconColor": "#ffffff",
    "children": [
      { "name": "Les Plats", "slug": "plats-midi", "icon": "Soup", "iconColor": "#ffffff" },
      { "name": "Les Desserts", "slug": "desserts-midi", "icon": "Cookie", "iconColor": "#ffffff" }
    ]
  },
  {
    "name": "Les Vins",
    "slug": "vins",
    "icon": "Wine",
    "iconColor": "#ffffff",
    "children": [
      {
        "name": "Vins Rouges",
        "slug": "rouges",
        "icon": "Wine",
        "iconColor": "#8B0000",
        "children": [
          { "name": "Vins Corses", "slug": "corses" },
          { "name": "Millésimes", "slug": "millesimes" },
          { "name": "Magnums", "slug": "magnums" },
          { "name": "Bordeaux", "slug": "bordeaux" },
          { "name": "Côtes-du-rhône", "slug": "cotes-du-rhone" },
          { "name": "Vins d'Italie", "slug": "decouverte" },
          { "name": "Vins du Monde", "slug": "monde" },
          { "name": "Decouverte", "slug": "decouverte2" }
        ]
      },
      {
        "name": "Vins d'exception",
        "slug": "vins-d-exception",
        "icon": "Wine",
        "iconColor": "#8B0000",
        "badge": { "icon": "Crown", "color": "#D4A24C" },
        "children": [
          { "name": "Rouges", "slug": "rouge-exception" },
          { "name": "Blancs", "slug": "blanc-exception" }
        ]
      },
      { "name": "Vins Rosés", "slug": "roses", "icon": "Wine", "iconColor": "#fec5d9" },
      {
        "name": "Vins Blancs",
        "slug": "blancs",
        "icon": "Wine",
        "iconColor": "#f1f285",
        "children": [
          { "name": "Vins Corses", "slug": "corses-blancs" },
          { "name": "Magnums", "slug": "magnums-blancs" }
        ]
      },
      { "name": "Champagnes", "slug": "champagnes", "icon": "Martini", "iconColor": "#ffffff" }
    ]
  },
  { "name": "Les Bières", "slug": "bieres", "icon": "Beer", "iconColor": "#ffffff" },
  {
    "name": "Les Alcools",
    "slug": "alcools",
    "icon": "GlassWater",
    "iconColor": "#ffffff",
    "children": [
      {
        "name": "Les Premiums",
        "slug": "premiums",
        "icon": "GlassWater",
        "iconColor": "#ffffff",
        "children": [
          { "name": "Rhum", "slug": "rhum" },
          { "name": "Gin", "slug": "gin" },
          { "name": "Whisky", "slug": "whisky" },
          { "name": "Vodka", "slug": "vodka" }
        ]
      },
      { "name": "Les Classiques", "slug": "classiques", "icon": "GlassWater", "iconColor": "#ffffff" }
    ]
  },
  { "name": "Les Cocktails", "slug": "cocktails", "icon": "Martini", "iconColor": "#ffffff" },
  { "name": "Les Softs", "slug": "softs", "icon": "GlassWater", "iconColor": "#ffffff" },
  {
    "name": "La Cuisine",
    "slug": "cuisine",
    "icon": "UtensilsCrossed",
    "iconColor": "#ffffff",
    "children": [
      { "name": "Les Tapas", "slug": "tapas", "icon": "Sandwich", "iconColor": "#ffffff" },
      { "name": "Les Desserts", "slug": "desserts", "icon": "Cookie", "iconColor": "#ffffff" }
    ]
  },
  { "name": "La Boutique", "slug": "boutique", "icon": "ShoppingBag", "iconColor": "#ffffff" }
]
```

**Note importante :** le slug actuel dans le fichier front est `"vins d'Exception"` (avec espace et apostrophe), ce qui est incompatible avec un slug DB. Aucun produit n'utilise ce slug (c'est un conteneur, pas un type de produit) — je le remplace par `"vins-d-exception"`. **Tous les autres slugs sont conservés à l'identique** pour ne pas casser les `Product.type` / `.category` / `.subCategory` existants.

- [ ] **Step 2 : Vérifier que le JSON parse**

Run:
```bash
node -e "console.log(JSON.parse(require('fs').readFileSync('/Users/pierrefrancoispaoletti/appdevelopment/1755-back/scripts/categories-seed.json','utf8')).length, 'racines')"
```
Expected: `8 racines`

- [ ] **Step 3 : Commit**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-back
git add scripts/categories-seed.json
git commit -m "feat(category): JSON source du seed (mapping FA → Lucide)"
```

---

### Task 8 : Script de seed avec --dry-run

**Files:**
- Create: `1755-back/scripts/seed-categories.js`

- [ ] **Step 1 : Créer le script**

Écrire `1755-back/scripts/seed-categories.js` :

```js
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("../database");
const Category = require("../database/models/Category");
const Product = require("../database/models/Product");

const DRY_RUN = process.argv.includes("--dry-run");
const SEED_PATH = path.join(__dirname, "categories-seed.json");

function flatten(nodes, parentSlug = null, acc = [], depth = 1) {
  nodes.forEach((n, idx) => {
    acc.push({
      name: n.name,
      slug: n.slug,
      parentSlug,
      order: idx,
      icon: n.icon || null,
      iconColor: n.iconColor || "#ffffff",
      badge: n.badge || null,
      depth,
    });
    if (Array.isArray(n.children) && n.children.length) {
      flatten(n.children, n.slug, acc, depth + 1);
    }
  });
  return acc;
}

async function resolveParentIds(flatSeed) {
  const bySlug = new Map();
  const existing = await Category.find().lean();
  existing.forEach((c) => bySlug.set(c.slug, c));
  return flatSeed.map((item) => {
    const parent = item.parentSlug ? bySlug.get(item.parentSlug) : null;
    return { ...item, parentId: parent ? parent._id : null };
  });
}

async function collectProductSlugs() {
  const [types, cats, subs] = await Promise.all([
    Product.distinct("type"),
    Product.distinct("category"),
    Product.distinct("subCategory"),
  ]);
  const all = new Set();
  [...types, ...cats, ...subs].forEach((s) => {
    if (s && typeof s === "string" && s.trim()) all.add(s.trim());
  });
  return all;
}

async function main() {
  console.log(`[seed-categories] mode = ${DRY_RUN ? "DRY-RUN" : "EXECUTE"}`);
  const raw = JSON.parse(fs.readFileSync(SEED_PATH, "utf8"));
  const flat = flatten(raw);
  console.log(`[seed-categories] ${flat.length} catégories dans le JSON`);

  const tooDeep = flat.filter((f) => f.depth > 3);
  if (tooDeep.length) {
    console.error(`[seed-categories] ERREUR : ${tooDeep.length} catégories au-delà de la profondeur max (3)`);
    tooDeep.forEach((f) => console.error(`  - ${f.slug} (depth ${f.depth})`));
    process.exit(1);
  }

  const seedSlugs = new Set(flat.map((f) => f.slug));
  const productSlugs = await collectProductSlugs();
  const orphans = [...productSlugs].filter((s) => !seedSlugs.has(s));
  if (orphans.length) {
    console.warn(`[seed-categories] ATTENTION : ${orphans.length} slugs présents dans Product sans catégorie correspondante :`);
    orphans.forEach((s) => console.warn(`  - ${s}`));
  } else {
    console.log(`[seed-categories] OK : tous les slugs produits correspondent au seed`);
  }

  const existing = await Category.find().lean();
  const existingBySlug = new Map(existing.map((c) => [c.slug, c]));
  const toCreate = flat.filter((f) => !existingBySlug.has(f.slug));
  const toUpdate = flat.filter((f) => existingBySlug.has(f.slug));
  console.log(`[seed-categories] à créer : ${toCreate.length}`);
  console.log(`[seed-categories] à mettre à jour (upsert) : ${toUpdate.length}`);

  if (DRY_RUN) {
    console.log("[seed-categories] DRY-RUN terminé, aucune écriture");
    await mongoose.disconnect();
    process.exit(orphans.length ? 2 : 0);
  }

  const createdBySlug = new Map(existing.map((c) => [c.slug, c]));
  const passes = [
    flat.filter((f) => f.depth === 1),
    flat.filter((f) => f.depth === 2),
    flat.filter((f) => f.depth === 3),
  ];
  let opsCount = 0;
  for (const pass of passes) {
    for (const item of pass) {
      const parent = item.parentSlug ? createdBySlug.get(item.parentSlug) : null;
      const parentId = parent ? parent._id : null;
      const update = {
        name: item.name,
        parentId,
        order: item.order,
        icon: item.icon,
        iconColor: item.iconColor,
        badge: item.badge,
      };
      const doc = await Category.findOneAndUpdate(
        { slug: item.slug },
        { $set: update, $setOnInsert: { slug: item.slug, visible: true } },
        { upsert: true, new: true }
      );
      createdBySlug.set(item.slug, doc);
      opsCount += 1;
      console.log(`  ✓ ${doc.slug} (parent: ${item.parentSlug || "—"})`);
    }
  }
  console.log(`[seed-categories] OK : ${opsCount} upserts`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed-categories] FATAL", err);
  process.exit(1);
});
```

- [ ] **Step 2 : Vérifier syntaxe**

Run:
```bash
node --check /Users/pierrefrancoispaoletti/appdevelopment/1755-back/scripts/seed-categories.js
```
Expected: pas de sortie.

- [ ] **Step 3 : Commit**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-back
git add scripts/seed-categories.js
git commit -m "feat(category): script de seed avec --dry-run et check des slugs produits"
```

---

### Task 9 : Dry-run local

**Files:** —

- [ ] **Step 1 : Exécuter le dry-run en local**

Run:
```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-back && node scripts/seed-categories.js --dry-run
```
Expected:
- `[seed-categories] mode = DRY-RUN`
- Nombre de catégories (21 environ)
- Liste des slugs orphelins (s'il y en a) — les analyser, peut-être ajuster `categories-seed.json` pour couvrir les slugs produits réels
- `à créer : N` / `à mettre à jour : M`
- Sortie `0` (ou `2` si orphelins)

- [ ] **Step 2 : Si des orphelins sont listés, itérer sur le JSON**

Ajouter les slugs manquants dans `scripts/categories-seed.json` (au bon niveau de hiérarchie), puis relancer le dry-run jusqu'à `OK : tous les slugs produits correspondent au seed`.

- [ ] **Step 3 : Commit des éventuelles corrections**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-back
git add scripts/categories-seed.json
git commit -m "fix(category): compléter le seed avec les slugs produits orphelins"
```
(Ne rien committer si le dry-run était clean au premier coup.)

---

### Task 10 : Exécution réelle en local (dev DB)

**Files:** —

- [ ] **Step 1 : Vérifier que la DB locale est bien la dev (pas la prod)**

Run:
```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-back && node -e "console.log(process.env.MONGODB_URI || 'pas de MONGODB_URI — voir database/index.js')"
```
Expected: URI dev (pas `le-1755`).

- [ ] **Step 2 : Exécuter le seed réel**

Run:
```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-back && node scripts/seed-categories.js
```
Expected: `OK : N upserts` et sortie `0`.

- [ ] **Step 3 : Vérifier le résultat via l'API locale**

Terminal 1 :
```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-back && npm run server
```

Terminal 2 :
```bash
curl -s "http://localhost:8080/api/categories?tree=1" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); console.log('Racines:', d.data.length); d.data.forEach(r => console.log(' -', r.slug, '(', (r.children||[]).length, 'enfants)'))"
```
Expected: 8 racines affichées avec le bon nombre d'enfants.

- [ ] **Step 4 : Arrêter le serveur**

- [ ] **Step 5 : Idempotence — relancer le seed**

Run:
```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-back && node scripts/seed-categories.js
```
Expected: `à créer : 0`, `à mettre à jour : N`. Aucune duplication (confirmable via `curl` à nouveau).

---

### Task 11 : Vérification des endpoints admin (avec JWT)

**Files:** —

- [ ] **Step 1 : Obtenir un token JWT local**

Lancer le serveur (`npm run server`) puis s'authentifier :

```bash
curl -s -X POST http://localhost:8080/auth/login -H "Content-Type: application/json" -d '{"username":"<user>","password":"<pass>"}'
```
Expected: JSON contenant un `token`. Copier sa valeur.

- [ ] **Step 2 : Créer une catégorie test**

```bash
TOKEN="<token_copié>"
curl -s -X POST http://localhost:8080/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test Cat","slug":"test-cat","icon":"Wine","iconColor":"#ff0000"}'
```
Expected: `{"status":201,"data":{...}}` avec `_id` généré.

- [ ] **Step 3 : Update**

```bash
CAT_ID="<_id_copié>"
curl -s -X PUT http://localhost:8080/api/categories/$CAT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test Cat Renommée","iconColor":"#00ff00"}'
```
Expected: `{"status":200,"data":{..."name":"Test Cat Renommée"...}}`

- [ ] **Step 4 : Delete**

```bash
curl -s -X DELETE http://localhost:8080/api/categories/$CAT_ID \
  -H "Authorization: Bearer $TOKEN"
```
Expected: `{"status":200,"data":{"_id":"..."}}`

- [ ] **Step 5 : Delete sur catégorie avec enfants — doit être refusée**

```bash
# Trouver l'_id de "Les Vins" (qui a des enfants)
VINS_ID=$(curl -s "http://localhost:8080/api/categories?tree=1" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); const v=d.data.find(r=>r.slug==='vins'); console.log(v._id)")
curl -s -X DELETE http://localhost:8080/api/categories/$VINS_ID \
  -H "Authorization: Bearer $TOKEN" -w "\nstatus: %{http_code}\n"
```
Expected: `status: 409` + `"Impossible de supprimer : la catégorie a des enfants"`.

- [ ] **Step 6 : Arrêter le serveur**

---

### Task 12 : Push de la branche

**Files:** —

- [ ] **Step 1 : Vérifier l'état git**

Run:
```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-back && git status && git log --oneline -10
```
Expected: working tree clean, 7-8 commits récents sur `feat/admin-bottom-bar-categories`.

- [ ] **Step 2 : Push de la branche**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-back && git push -u origin feat/admin-bottom-bar-categories
```
Expected: branche créée sur origin. **Ne pas merger sur main — on garde pour la review manuelle avant de passer au Plan 2.**

---

## Récapitulatif

À la fin de ce plan :

- Le back expose `/api/categories` (lecture publique + CRUD admin).
- Un script de seed idempotent avec dry-run est en place.
- La DB locale contient l'arborescence complète (21 catégories environ).
- Tous les slugs produits existants ont une catégorie correspondante (vérifié par dry-run).
- Le front n'a pas été touché.
- La branche back est poussée sur origin, prête pour review.

**Prochaine étape** : Plan 2 (front design system + BottomAppBar + shell `/admin` vide). Aucune modif du back entre les deux.
