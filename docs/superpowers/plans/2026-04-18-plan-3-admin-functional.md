# Plan 3 — Admin fonctionnel + consommation publique + déploiement

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplir les 4 sections admin (`/admin/categories` en drill-down, `/admin/products` avec filtres, `/admin/events` et `/admin/themes` par migration mécanique), faire consommer `/api/categories` par le front public, supprimer le fichier statique `src/datas/categories.js`, puis déployer en production avec seed dry-run → seed réel → front.

**Architecture:** Ajout de 3 composants design system (`Sheet`, `ListItem`, `IconPicker`). Client API catégories (axios). Écrans admin utilisant react-router 5 avec `useParams` pour le drill-down `/admin/categories/:parentId?`. Modals produits/events réutilisés tels quels mais déplacés dans `/admin/*`. Pages publiques `/categories/*` passées en lecture seule (plus de boutons admin inline).

**Tech Stack:** Déjà en place (React 17, react-router 5, axios, Lucide, design system du Plan 2). Aucune nouvelle dépendance.

**Prérequis:**
- Plans 1 et 2 complets.
- Branches `feat/admin-bottom-bar-categories` front et back poussées.
- API `/api/categories` opérationnelle en local (back Plan 1).

**Conventions projet rappels:**
- `$SERVER` dans `src/_const/_const.js` : ne jamais committer le toggle local. Toujours vérifier avant `git add`.
- Après `npm run deploy` : **toujours** `git push origin main` pour sync la branche source.
- Pas de framework de test : vérif manuelle via navigateur mobile + curl.
- Traductions : aucune régression. Les produits restent fetchés via `/api/products?type=X&lang=Y` (inchangé).

---

## Files

**Design system (nouveaux composants)** :
- Create: `1755-front/src/design-system/components/Sheet.jsx` + `.css`
- Create: `1755-front/src/design-system/components/ListItem.jsx` + `.css`
- Create: `1755-front/src/design-system/components/IconPicker.jsx` + `.css`
- Modify: `1755-front/src/design-system/index.js`

**Client API** :
- Create: `1755-front/src/services/categoriesApi.js`

**Admin catégories** :
- Replace: `1755-front/src/pages/Admin/Categories.jsx` (remplace le placeholder du Plan 2)
- Create: `1755-front/src/pages/Admin/CategoryEditSheet.jsx`
- Create: `1755-front/src/pages/Admin/categories.css`

**Admin produits** :
- Replace: `1755-front/src/pages/Admin/Products.jsx`
- Create: `1755-front/src/pages/Admin/products.css`

**Admin events & thèmes** :
- Replace: `1755-front/src/pages/Admin/Events.jsx`
- Replace: `1755-front/src/pages/Admin/Themes.jsx`

**Consommation publique** :
- Modify: `1755-front/src/pages/Categories/index.js` (arbre depuis API + lecture seule)
- Modify: `1755-front/src/components/Small/ProductItem/index.js` (suppression `AdminCrudButtons`)
- Modify: `1755-front/src/components/Small/CategoriesSidebar/index.js` (consomme l'arbre depuis props ou context)
- Modify: `1755-front/src/pages/Home/index.js` (suppression des boutons admin event)
- Modify: `1755-front/src/components/App/App.js` (routes admin branchées sur vraies pages + suppression props admin devenues inutiles)
- **Delete**: `1755-front/src/datas/categories.js`
- **Delete**: `1755-front/src/components/Small/AdminCrudButtons/` (dossier complet)

---

### Task 1 : Composant `Sheet` (bottom sheet)

**Files:**
- Create: `1755-front/src/design-system/components/Sheet.jsx`
- Create: `1755-front/src/design-system/components/Sheet.css`

- [ ] **Step 1 : Créer le CSS**

Écrire `1755-front/src/design-system/components/Sheet.css` :

```css
.ds-sheet__overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: var(--ds-z-sheet);
  display: flex;
  align-items: flex-end;
  animation: ds-sheet-fade 180ms ease;
}
@keyframes ds-sheet-fade { from { opacity: 0; } to { opacity: 1; } }
.ds-sheet {
  background: var(--ds-bg-surface);
  color: var(--ds-text-primary);
  width: 100%;
  max-height: 90vh;
  border-top-left-radius: var(--ds-radius-md);
  border-top-right-radius: var(--ds-radius-md);
  display: flex;
  flex-direction: column;
  animation: ds-sheet-slide 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
  padding-bottom: var(--ds-safe-bottom);
}
@keyframes ds-sheet-slide { from { transform: translateY(100%); } to { transform: translateY(0); } }
.ds-sheet__handle {
  width: 36px;
  height: 4px;
  background: var(--ds-border-subtle);
  border-radius: 2px;
  margin: var(--ds-space-3) auto var(--ds-space-2);
}
.ds-sheet__header {
  padding: 0 var(--ds-space-5) var(--ds-space-3);
  font-family: var(--ds-font-serif);
  font-size: var(--ds-size-h1);
}
.ds-sheet__body {
  padding: var(--ds-space-3) var(--ds-space-5);
  overflow-y: auto;
  flex: 1;
}
.ds-sheet__footer {
  padding: var(--ds-space-4) var(--ds-space-5);
  display: flex;
  gap: var(--ds-space-3);
  border-top: 1px solid var(--ds-border-subtle);
}
.ds-sheet__footer > * { flex: 1; }
```

- [ ] **Step 2 : Créer le composant**

Écrire `1755-front/src/design-system/components/Sheet.jsx` :

```jsx
import React, { useEffect } from "react";
import "./Sheet.css";

const Sheet = ({ open, onClose, title, children, footer }) => {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;
  return (
    <div className="ds-root ds-sheet__overlay" onClick={onClose}>
      <div className="ds-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="ds-sheet__handle" />
        {title && <div className="ds-sheet__header">{title}</div>}
        <div className="ds-sheet__body">{children}</div>
        {footer && <div className="ds-sheet__footer">{footer}</div>}
      </div>
    </div>
  );
};

export default Sheet;
```

- [ ] **Step 3 : Vérifier syntaxe + commit**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
node -e "require('@babel/parser').parse(require('fs').readFileSync('src/design-system/components/Sheet.jsx','utf8'),{sourceType:'module',plugins:['jsx']})"
git add src/design-system/components/Sheet.jsx src/design-system/components/Sheet.css
git commit -m "feat(ds): composant Sheet (bottom sheet modal avec overlay)"
```

---

### Task 2 : Composant `ListItem`

**Files:**
- Create: `1755-front/src/design-system/components/ListItem.jsx`
- Create: `1755-front/src/design-system/components/ListItem.css`

- [ ] **Step 1 : Créer le CSS**

Écrire `1755-front/src/design-system/components/ListItem.css` :

```css
.ds-listitem {
  display: flex;
  align-items: center;
  gap: var(--ds-space-3);
  padding: var(--ds-space-3) var(--ds-space-4);
  background: var(--ds-bg-surface);
  border-radius: var(--ds-radius-md);
  margin-bottom: var(--ds-space-2);
  min-height: 56px;
  cursor: pointer;
  transition: background 120ms ease;
  border: 1px solid transparent;
  color: var(--ds-text-primary);
  font-family: var(--ds-font-sans);
}
.ds-listitem:hover { background: var(--ds-bg-elevated); }
.ds-listitem__icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
}
.ds-listitem__icon svg { width: 24px; height: 24px; }
.ds-listitem__badge {
  position: absolute;
  top: -4px;
  right: -4px;
}
.ds-listitem__badge svg { width: 14px; height: 14px; }
.ds-listitem__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ds-listitem__title {
  font-size: var(--ds-size-body);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ds-listitem__subtitle {
  font-size: var(--ds-size-small);
  color: var(--ds-text-muted);
}
.ds-listitem__trail {
  flex-shrink: 0;
  color: var(--ds-text-muted);
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
}
.ds-listitem--hidden { opacity: 0.5; }
.ds-listitem--drag .ds-listitem__handle {
  cursor: grab;
  color: var(--ds-text-muted);
  padding: 0 var(--ds-space-1);
}
```

- [ ] **Step 2 : Créer le composant**

Écrire `1755-front/src/design-system/components/ListItem.jsx` :

```jsx
import React from "react";
import { ICON_MAP } from "../iconMap";
import "./ListItem.css";

const ListItem = ({
  icon,
  iconColor,
  badge,
  title,
  subtitle,
  trail,
  hidden = false,
  onClick,
}) => {
  const Icon = icon ? ICON_MAP[icon] : null;
  const BadgeIcon = badge && badge.icon ? ICON_MAP[badge.icon] : null;
  const classes = ["ds-listitem", hidden ? "ds-listitem--hidden" : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={classes} onClick={onClick} role="button" tabIndex={0}>
      <div className="ds-listitem__icon">
        {Icon ? <Icon style={{ color: iconColor || "#ffffff" }} /> : null}
        {BadgeIcon ? (
          <span className="ds-listitem__badge">
            <BadgeIcon style={{ color: badge.color || "#D4A24C" }} />
          </span>
        ) : null}
      </div>
      <div className="ds-listitem__body">
        <span className="ds-listitem__title">{title}</span>
        {subtitle ? <span className="ds-listitem__subtitle">{subtitle}</span> : null}
      </div>
      {trail ? <div className="ds-listitem__trail">{trail}</div> : null}
    </div>
  );
};

export default ListItem;
```

- [ ] **Step 3 : Vérifier + commit**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
node -e "require('@babel/parser').parse(require('fs').readFileSync('src/design-system/components/ListItem.jsx','utf8'),{sourceType:'module',plugins:['jsx']})"
git add src/design-system/components/ListItem.jsx src/design-system/components/ListItem.css
git commit -m "feat(ds): composant ListItem (icône, badge, titre, subtitle, trail)"
```

---

### Task 3 : Composant `IconPicker`

**Files:**
- Create: `1755-front/src/design-system/components/IconPicker.jsx`
- Create: `1755-front/src/design-system/components/IconPicker.css`

- [ ] **Step 1 : Créer le CSS**

Écrire `1755-front/src/design-system/components/IconPicker.css` :

```css
.ds-iconpicker__search {
  width: 100%;
  padding: var(--ds-space-3);
  border-radius: var(--ds-radius-sm);
  border: 1px solid var(--ds-border-subtle);
  background: var(--ds-bg-elevated);
  color: var(--ds-text-primary);
  font-size: var(--ds-size-body);
  margin-bottom: var(--ds-space-3);
}
.ds-iconpicker__grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--ds-space-2);
}
.ds-iconpicker__cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ds-bg-elevated);
  border-radius: var(--ds-radius-sm);
  cursor: pointer;
  border: 2px solid transparent;
  color: var(--ds-text-primary);
  transition: border-color 100ms ease;
}
.ds-iconpicker__cell svg { width: 26px; height: 26px; }
.ds-iconpicker__cell--selected { border-color: var(--ds-accent-gold); }
.ds-iconpicker__colors {
  display: flex;
  gap: var(--ds-space-2);
  flex-wrap: wrap;
  margin-top: var(--ds-space-4);
}
.ds-iconpicker__swatch {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid var(--ds-border-subtle);
}
.ds-iconpicker__swatch--selected { border-color: var(--ds-accent-gold); border-width: 3px; }
.ds-iconpicker__custom-color {
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--ds-border-subtle);
  border-radius: 50%;
  cursor: pointer;
  background: transparent;
}
```

- [ ] **Step 2 : Créer le composant**

Écrire `1755-front/src/design-system/components/IconPicker.jsx` :

```jsx
import React, { useMemo, useState } from "react";
import { ICON_MAP, PICKER_ICONS, PICKER_COLORS } from "../iconMap";
import "./IconPicker.css";

const IconPicker = ({ value, color, onChange }) => {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PICKER_ICONS;
    return PICKER_ICONS.filter((n) => n.toLowerCase().includes(q));
  }, [query]);

  const update = (patch) => onChange({ icon: value, color, ...patch });

  return (
    <div>
      <input
        className="ds-iconpicker__search"
        placeholder="Rechercher (wine, beer, cake...)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="ds-iconpicker__grid">
        {filtered.map((name) => {
          const Icon = ICON_MAP[name];
          const selected = value === name;
          return (
            <div
              key={name}
              className={`ds-iconpicker__cell ${selected ? "ds-iconpicker__cell--selected" : ""}`}
              onClick={() => update({ icon: name })}
              title={name}
            >
              <Icon style={{ color: color || "#ffffff" }} />
            </div>
          );
        })}
      </div>
      <div className="ds-iconpicker__colors">
        {PICKER_COLORS.map((c) => (
          <div
            key={c}
            className={`ds-iconpicker__swatch ${color === c ? "ds-iconpicker__swatch--selected" : ""}`}
            style={{ background: c }}
            onClick={() => update({ color: c })}
          />
        ))}
        <input
          type="color"
          className="ds-iconpicker__custom-color"
          value={color || "#ffffff"}
          onChange={(e) => update({ color: e.target.value })}
          title="Couleur personnalisée"
        />
      </div>
    </div>
  );
};

export default IconPicker;
```

- [ ] **Step 3 : Mettre à jour le barrel**

Modifier `1755-front/src/design-system/index.js`, ajouter les exports :

```js
export { default as Sheet } from "./components/Sheet";
export { default as ListItem } from "./components/ListItem";
export { default as IconPicker } from "./components/IconPicker";
```

- [ ] **Step 4 : Vérifier + commit**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
node -e "require('@babel/parser').parse(require('fs').readFileSync('src/design-system/components/IconPicker.jsx','utf8'),{sourceType:'module',plugins:['jsx']})"
git add src/design-system/components/IconPicker.jsx src/design-system/components/IconPicker.css src/design-system/index.js
git commit -m "feat(ds): IconPicker (grille Lucide + recherche + couleurs)"
```

---

### Task 4 : Client API catégories

**Files:**
- Create: `1755-front/src/services/categoriesApi.js`

- [ ] **Step 1 : Créer le fichier**

Écrire `1755-front/src/services/categoriesApi.js` :

```js
import axios from "axios";
import { $SERVER } from "../_const/_const";

const base = `${$SERVER}/api/categories`;

function authHeaders() {
  const token = localStorage.getItem("jwt");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchTree() {
  const res = await axios.get(`${base}?tree=1`);
  return res.data?.data || [];
}

export async function fetchFlat() {
  const res = await axios.get(base);
  return res.data?.data || [];
}

export async function createCategory(payload) {
  const res = await axios.post(base, payload, { headers: authHeaders() });
  return res.data?.data;
}

export async function updateCategory(id, payload) {
  const res = await axios.put(`${base}/${id}`, payload, { headers: authHeaders() });
  return res.data?.data;
}

export async function moveCategory(id, { parentId, order }) {
  const res = await axios.put(
    `${base}/${id}/move`,
    { parentId, order },
    { headers: authHeaders() }
  );
  return res.data?.data;
}

export async function reorderCategories(items) {
  const res = await axios.put(`${base}/reorder`, items, { headers: authHeaders() });
  return res.data?.data;
}

export async function deleteCategory(id) {
  const res = await axios.delete(`${base}/${id}`, { headers: authHeaders() });
  return res.data;
}
```

- [ ] **Step 2 : Vérifier + commit**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
node -e "require('@babel/parser').parse(require('fs').readFileSync('src/services/categoriesApi.js','utf8'),{sourceType:'module'})"
git add src/services/categoriesApi.js
git commit -m "feat(api): client axios pour /api/categories"
```

---

### Task 5 : Bottom sheet d'édition de catégorie

**Files:**
- Create: `1755-front/src/pages/Admin/CategoryEditSheet.jsx`

- [ ] **Step 1 : Créer le composant**

Écrire `1755-front/src/pages/Admin/CategoryEditSheet.jsx` :

```jsx
import React, { useEffect, useState } from "react";
import { Sheet, Button, IconPicker } from "../../design-system";
import { createCategory, updateCategory } from "../../services/categoriesApi";

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const emptyForm = {
  name: "",
  slug: "",
  icon: null,
  iconColor: "#ffffff",
  badgeEnabled: false,
  badgeIcon: "Crown",
  badgeColor: "#D4A24C",
  visible: true,
};

const CategoryEditSheet = ({ open, onClose, category, parentId, onSaved, onError }) => {
  const isEdit = Boolean(category?._id);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      setForm({
        name: category.name || "",
        slug: category.slug || "",
        icon: category.icon || null,
        iconColor: category.iconColor || "#ffffff",
        badgeEnabled: Boolean(category.badge?.icon),
        badgeIcon: category.badge?.icon || "Crown",
        badgeColor: category.badge?.color || "#D4A24C",
        visible: category.visible !== false,
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, category, isEdit]);

  const handleNameChange = (v) => {
    setForm((f) => ({
      ...f,
      name: v,
      slug: isEdit ? f.slug : slugify(v),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const badge = form.badgeEnabled
      ? { icon: form.badgeIcon, color: form.badgeColor }
      : null;
    try {
      if (isEdit) {
        const doc = await updateCategory(category._id, {
          name: form.name,
          icon: form.icon,
          iconColor: form.iconColor,
          badge,
          visible: form.visible,
        });
        onSaved(doc);
      } else {
        const doc = await createCategory({
          name: form.name,
          slug: form.slug,
          parentId: parentId || null,
          icon: form.icon,
          iconColor: form.iconColor,
          badge,
        });
        onSaved(doc);
      }
      onClose();
    } catch (err) {
      onError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isEdit ? "Éditer catégorie" : "Nouvelle catégorie"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving || !form.name || !form.slug}
          >
            {saving ? "..." : "Enregistrer"}
          </Button>
        </>
      }
    >
      <label style={{ display: "block", marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: "var(--ds-text-muted)" }}>Nom</span>
        <input
          style={inputStyle}
          value={form.name}
          onChange={(e) => handleNameChange(e.target.value)}
        />
      </label>
      <label style={{ display: "block", marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: "var(--ds-text-muted)" }}>Slug</span>
        <input
          style={{ ...inputStyle, opacity: isEdit ? 0.5 : 1 }}
          value={form.slug}
          readOnly={isEdit}
          onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
        />
        {isEdit && (
          <small style={{ color: "var(--ds-text-muted)" }}>
            Slug immuable après création.
          </small>
        )}
      </label>
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: "var(--ds-text-muted)" }}>Icône</span>
        <IconPicker
          value={form.icon}
          color={form.iconColor}
          onChange={({ icon, color }) =>
            setForm((f) => ({ ...f, icon, iconColor: color }))
          }
        />
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <input
          type="checkbox"
          checked={form.badgeEnabled}
          onChange={(e) => setForm((f) => ({ ...f, badgeEnabled: e.target.checked }))}
        />
        <span>Badge décoratif (ex: couronne or)</span>
      </label>
      {form.badgeEnabled && (
        <IconPicker
          value={form.badgeIcon}
          color={form.badgeColor}
          onChange={({ icon, color }) =>
            setForm((f) => ({ ...f, badgeIcon: icon, badgeColor: color }))
          }
        />
      )}
      {isEdit && (
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
          <input
            type="checkbox"
            checked={form.visible}
            onChange={(e) => setForm((f) => ({ ...f, visible: e.target.checked }))}
          />
          <span>Visible</span>
        </label>
      )}
    </Sheet>
  );
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--ds-border-subtle)",
  background: "var(--ds-bg-elevated)",
  color: "var(--ds-text-primary)",
  fontSize: 15,
  marginTop: 4,
};

export default CategoryEditSheet;
```

- [ ] **Step 2 : Vérifier + commit**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
node -e "require('@babel/parser').parse(require('fs').readFileSync('src/pages/Admin/CategoryEditSheet.jsx','utf8'),{sourceType:'module',plugins:['jsx']})"
git add src/pages/Admin/CategoryEditSheet.jsx
git commit -m "feat(admin): bottom sheet d'édition de catégorie avec IconPicker"
```

---

### Task 6 : Page `/admin/categories` drill-down

**Files:**
- Create: `1755-front/src/pages/Admin/categories.css`
- Create: `1755-front/src/pages/Admin/Categories.jsx`

- [ ] **Step 1 : Créer le CSS**

Écrire `1755-front/src/pages/Admin/categories.css` :

```css
.admin-cat__header {
  display: flex;
  align-items: center;
  gap: var(--ds-space-3);
  margin-bottom: var(--ds-space-4);
}
.admin-cat__back {
  background: transparent;
  border: 1px solid var(--ds-border-subtle);
  border-radius: 50%;
  width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  color: var(--ds-text-primary);
  cursor: pointer;
}
.admin-cat__crumb {
  color: var(--ds-text-muted);
  font-size: var(--ds-size-small);
  margin-bottom: var(--ds-space-3);
}
.admin-cat__add {
  margin-bottom: var(--ds-space-4);
}
.admin-cat__actions {
  display: flex;
  gap: var(--ds-space-2);
  margin-top: var(--ds-space-1);
}
.admin-cat__error {
  background: var(--ds-danger);
  color: white;
  padding: var(--ds-space-3) var(--ds-space-4);
  border-radius: var(--ds-radius-sm);
  margin-bottom: var(--ds-space-3);
}
.admin-cat__empty {
  text-align: center;
  color: var(--ds-text-muted);
  padding: var(--ds-space-6);
}
```

- [ ] **Step 2 : Créer la page**

Écrire `1755-front/src/pages/Admin/Categories.jsx` :

```jsx
import React, { useCallback, useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { Button, ListItem, ICON_MAP } from "../../design-system";
import { fetchFlat, deleteCategory } from "../../services/categoriesApi";
import CategoryEditSheet from "./CategoryEditSheet";
import "./admin.css";
import "./categories.css";

const MAX_DEPTH = 3;

const Categories = () => {
  const history = useHistory();
  const { parentId } = useParams();
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const flat = await fetchFlat();
      setAll(flat);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const current = parentId ? all.find((c) => String(c._id) === parentId) : null;
  const children = all
    .filter((c) => String(c.parentId || "") === (parentId || ""))
    .sort((a, b) => a.order - b.order);

  const depth = (() => {
    if (!current) return 1;
    let d = 1;
    let c = current;
    while (c && c.parentId) {
      d += 1;
      c = all.find((x) => String(x._id) === String(c.parentId));
      if (d > 10) break;
    }
    return d + 1; // enfants seront à depth+1
  })();

  const crumb = (() => {
    if (!current) return "Racine";
    const chain = [];
    let c = current;
    while (c) {
      chain.unshift(c.name);
      c = c.parentId ? all.find((x) => String(x._id) === String(c.parentId)) : null;
    }
    return `Racine › ${chain.join(" › ")}`;
  })();

  const handleDelete = async (cat) => {
    if (!window.confirm(`Supprimer "${cat.name}" ?`)) return;
    try {
      await deleteCategory(cat._id);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    }
  };

  const handleEdit = (cat) => {
    setEditing(cat);
    setEditOpen(true);
  };

  const handleAdd = () => {
    setEditing(null);
    setEditOpen(true);
  };

  const handleSaved = async () => { await load(); };

  return (
    <div className="ds-root admin-page">
      <div className="admin-cat__header">
        {parentId && (
          <button
            className="admin-cat__back"
            onClick={() => history.goBack()}
            aria-label="Retour"
          >
            {React.createElement(ICON_MAP.ChevronLeft)}
          </button>
        )}
        <h1 style={{ margin: 0 }}>{current ? current.name : "Catégories"}</h1>
      </div>
      <div className="admin-cat__crumb">{crumb}</div>

      {error && <div className="admin-cat__error">{error}</div>}

      {depth <= MAX_DEPTH && (
        <div className="admin-cat__add">
          <Button variant="primary" block onClick={handleAdd}>
            <ICON_MAP.Plus /> Ajouter une catégorie
          </Button>
        </div>
      )}

      {loading && <div className="admin-cat__empty">Chargement…</div>}
      {!loading && children.length === 0 && (
        <div className="admin-cat__empty">Aucune sous-catégorie.</div>
      )}

      {children.map((cat) => {
        const hasKids = all.some((c) => String(c.parentId) === String(cat._id));
        return (
          <div key={cat._id}>
            <ListItem
              icon={cat.icon}
              iconColor={cat.iconColor}
              badge={cat.badge}
              title={cat.name}
              subtitle={cat.slug}
              hidden={!cat.visible}
              onClick={() => history.push(`/admin/categories/${cat._id}`)}
              trail={<ICON_MAP.ChevronRight />}
            />
            <div className="admin-cat__actions">
              <Button variant="ghost" onClick={() => handleEdit(cat)}>
                <ICON_MAP.Edit /> Éditer
              </Button>
              <Button variant="danger" onClick={() => handleDelete(cat)}>
                <ICON_MAP.Trash /> Supprimer
              </Button>
            </div>
          </div>
        );
      })}

      <CategoryEditSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        category={editing}
        parentId={parentId || null}
        onSaved={handleSaved}
        onError={(msg) => setError(msg)}
      />
    </div>
  );
};

export default Categories;
```

- [ ] **Step 3 : Brancher la route dans `App.js`**

Remplacer les 2 routes placeholder `/admin/categories` existantes du Plan 2 par :

```jsx
<Route exact path="/admin/categories">
  <RequireAuth user={user}>
    <AdminCategories />
  </RequireAuth>
</Route>
<Route exact path="/admin/categories/:parentId">
  <RequireAuth user={user}>
    <AdminCategories />
  </RequireAuth>
</Route>
```

Et ajouter l'import en haut de `App.js` :

```js
import AdminCategories from "../../pages/Admin/Categories";
```

Supprimer l'import `AdminPlaceholder` usage pour `/admin/categories` (les autres routes placeholder restent pour l'instant).

- [ ] **Step 4 : Vérifier syntaxes + commit**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
node -e "require('@babel/parser').parse(require('fs').readFileSync('src/pages/Admin/Categories.jsx','utf8'),{sourceType:'module',plugins:['jsx']})"
node -e "require('@babel/parser').parse(require('fs').readFileSync('src/components/App/App.js','utf8'),{sourceType:'module',plugins:['jsx']})"
git add src/pages/Admin/Categories.jsx src/pages/Admin/categories.css src/components/App/App.js
git commit -m "feat(admin): /admin/categories drill-down avec édition et suppression"
```

- [ ] **Step 5 : Test manuel en local**

Lancer `npm start` + back local `npm run server`, se connecter admin, naviguer vers `/admin/categories`, vérifier :
- Liste des racines s'affiche.
- Tap sur "Les Vins" → entre dans `/admin/categories/:id`, voit les sous-catégories.
- Breadcrumb affiche "Racine › Les Vins".
- Bouton "Ajouter" crée une sous-catégorie.
- Bouton "Éditer" ouvre le sheet, modification sauvée.
- Bouton "Supprimer" sur une feuille sans produit → OK.
- Bouton "Supprimer" sur "Les Vins" → message "a des enfants" (erreur 409).

---

### Task 7 : Page `/admin/products` (V1 : liste + filtres, réutilise modals existantes)

**Files:**
- Create: `1755-front/src/pages/Admin/products.css`
- Create: `1755-front/src/pages/Admin/Products.jsx`

- [ ] **Step 1 : Créer le CSS**

Écrire `1755-front/src/pages/Admin/products.css` :

```css
.admin-prod__toolbar {
  display: flex;
  gap: var(--ds-space-2);
  flex-wrap: wrap;
  margin-bottom: var(--ds-space-4);
}
.admin-prod__toolbar input,
.admin-prod__toolbar select {
  flex: 1;
  min-width: 140px;
  padding: 10px 12px;
  border-radius: var(--ds-radius-sm);
  border: 1px solid var(--ds-border-subtle);
  background: var(--ds-bg-elevated);
  color: var(--ds-text-primary);
  font-size: 15px;
}
.admin-prod__actions {
  display: flex;
  gap: var(--ds-space-2);
  margin-top: var(--ds-space-1);
  flex-wrap: wrap;
}
.admin-prod__actions button { flex: 1 1 100px; }
```

- [ ] **Step 2 : Créer la page**

Écrire `1755-front/src/pages/Admin/Products.jsx` :

```jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { $SERVER } from "../../_const/_const";
import { Button, ListItem, ICON_MAP } from "../../design-system";
import { fetchFlat as fetchCategoriesFlat } from "../../services/categoriesApi";
import AddProductModal from "../../components/Medium/Modals/AddProduct";
import EditProductModal from "../../components/Medium/Modals/EditProduct";
import UpdateImageModal from "../../components/Medium/Modals/UpdateImageModal";
import "./admin.css";
import "./products.css";

const Products = ({ user, setAppMessage, setOpenLoginModal, productsVersion, setProductsVersion }) => {
  const [products, setProducts] = useState([]);
  const [cats, setCats] = useState([]);
  const [filterCat, setFilterCat] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openImg, setOpenImg] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [{ data }, flat] = await Promise.all([
          axios.get(`${$SERVER}/api/products/allProducts`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
          }),
          fetchCategoriesFlat(),
        ]);
        setProducts(data?.data || []);
        setCats(flat);
      } catch (e) {
        setAppMessage && setAppMessage({ negative: true, header: "Erreur", content: e.message });
      } finally {
        setLoading(false);
      }
    })();
  }, [productsVersion, setAppMessage]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchCat = !filterCat || p.type === filterCat || p.category === filterCat || p.subCategory === filterCat;
      const matchQ = !q || (p.name || "").toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [products, query, filterCat]);

  const changeVisibility = async (p) => {
    try {
      await axios.post(
        `${$SERVER}/api/products/updateProduct`,
        { ...p, visible: !p.visible },
        { headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` } }
      );
      setProductsVersion((v) => v + 1);
    } catch (e) {
      setAppMessage && setAppMessage({ negative: true, header: "Erreur", content: e.message });
    }
  };

  const changeChoice = async (p) => {
    try {
      await axios.post(
        `${$SERVER}/api/products/updateProduct`,
        { ...p, choice: !p.choice },
        { headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` } }
      );
      setProductsVersion((v) => v + 1);
    } catch (e) {
      setAppMessage && setAppMessage({ negative: true, header: "Erreur", content: e.message });
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Supprimer "${p.name}" ?`)) return;
    try {
      await axios.delete(`${$SERVER}/api/products/deleteProduct`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
        data: { _id: p._id },
      });
      setProductsVersion((v) => v + 1);
    } catch (e) {
      setAppMessage && setAppMessage({ negative: true, header: "Erreur", content: e.message });
    }
  };

  const catOptions = cats.map((c) => ({ value: c.slug, label: c.name }));

  return (
    <div className="ds-root admin-page">
      <h1 style={{ margin: 0 }}>Produits</h1>
      <p className="subtitle">{filtered.length} produit(s) — {products.length} au total</p>

      <div className="admin-prod__toolbar">
        <input
          placeholder="Rechercher…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
          <option value="">Toutes catégories</option>
          {catOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Button variant="primary" block onClick={() => setOpenAdd(true)}>
          <ICON_MAP.Plus /> Ajouter un produit
        </Button>
      </div>

      {loading && <div style={{ color: "var(--ds-text-muted)" }}>Chargement…</div>}

      {filtered.map((p) => (
        <div key={p._id}>
          <ListItem
            title={`${p.name} — ${p.price}€`}
            subtitle={`${p.type || ""} ${p.subCategory ? "› " + p.subCategory : ""}`}
            hidden={!p.visible}
          />
          <div className="admin-prod__actions">
            <Button variant="ghost" onClick={() => { setSelected(p); setOpenEdit(true); }}>
              <ICON_MAP.Edit /> Éditer
            </Button>
            <Button variant="ghost" onClick={() => { setSelected(p); setOpenImg(true); }}>
              <ICON_MAP.Image /> Image
            </Button>
            <Button variant="ghost" onClick={() => changeVisibility(p)}>
              {p.visible ? <ICON_MAP.EyeOff /> : <ICON_MAP.Eye />} Visibilité
            </Button>
            <Button variant="ghost" onClick={() => changeChoice(p)}>
              <ICON_MAP.Heart style={{ color: p.choice ? "#C0392B" : undefined }} /> Choix
            </Button>
            <Button variant="danger" onClick={() => handleDelete(p)}>
              <ICON_MAP.Trash />
            </Button>
          </div>
        </div>
      ))}

      <AddProductModal
        setProducts={setProducts}
        setProductsVersion={setProductsVersion}
        selectedCategory={{}}
        setOpenLoginModal={setOpenLoginModal}
        setAppMessage={setAppMessage}
        openAddProductModal={openAdd}
        setOpenAddProductModal={setOpenAdd}
      />
      <EditProductModal
        product={selected || {}}
        setOpenEditProductModal={setOpenEdit}
        setAppMessage={setAppMessage}
        setOpenLoginModal={setOpenLoginModal}
        openEditProductModal={openEdit}
        setProducts={setProducts}
        setProductsVersion={setProductsVersion}
      />
      <UpdateImageModal
        openUpdateImageModal={openImg}
        setOpenUpdateImageModal={setOpenImg}
        setProducts={setProducts}
        setProductsVersion={setProductsVersion}
        product={selected || {}}
        setOpenLoginModal={setOpenLoginModal}
        setAppMessage={setAppMessage}
      />
    </div>
  );
};

export default Products;
```

**Note** : `AddProductModal` actuel attend `selectedCategory` pour pré-remplir le type. En mode `/admin/products` il est vide (l'admin choisit). Si l'UX du formulaire d'ajout le rend obligatoire, adapter au moment du test manuel (ajouter un select "catégorie cible" avant la modal, ou corriger le comportement dans `AddProductModal` pour accepter un state vide).

- [ ] **Step 3 : Brancher la route dans `App.js`**

Remplacer la route placeholder `/admin/products` par :

```jsx
<Route path="/admin/products">
  <RequireAuth user={user}>
    <AdminProducts
      user={user}
      setAppMessage={setAppMessage}
      setOpenLoginModal={setOpenLoginModal}
      productsVersion={productsVersion}
      setProductsVersion={setProductsVersion}
    />
  </RequireAuth>
</Route>
```

Ajouter l'import : `import AdminProducts from "../../pages/Admin/Products";`

- [ ] **Step 4 : Vérifier + commit**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
node -e "require('@babel/parser').parse(require('fs').readFileSync('src/pages/Admin/Products.jsx','utf8'),{sourceType:'module',plugins:['jsx']})"
git add src/pages/Admin/Products.jsx src/pages/Admin/products.css src/components/App/App.js
git commit -m "feat(admin): /admin/products avec filtres, recherche et CRUD réutilisant les modals"
```

- [ ] **Step 5 : Test manuel**

Lancer back+front local, se connecter, aller sur `/admin/products`. Vérifier :
- Liste complète chargée depuis `allProducts`.
- Filtre catégorie + recherche fonctionnent.
- Ajouter / Éditer / Image / Visibilité / Choix / Supprimer → OK.
- Après chaque action, la liste se rafraîchit (via `productsVersion`).

---

### Task 8 : Page `/admin/events`

**Files:**
- Create: `1755-front/src/pages/Admin/Events.jsx`

- [ ] **Step 1 : Créer la page**

Écrire `1755-front/src/pages/Admin/Events.jsx` :

```jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { $SERVER } from "../../_const/_const";
import { Button, ListItem, ICON_MAP } from "../../design-system";
import AddEventModal from "../../components/Medium/Modals/AddEvent";
import EditEventModal from "../../components/Medium/Modals/EditEvent";
import "./admin.css";

const Events = ({ setAppMessage, setOpenLoginModal }) => {
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${$SERVER}/api/events`);
        setEvents(Array.isArray(data?.data) ? data.data : data?.data ? [data.data] : []);
      } catch (e) {
        setAppMessage && setAppMessage({ negative: true, header: "Erreur", content: e.message });
      }
    })();
  }, [version, setAppMessage]);

  return (
    <div className="ds-root admin-page">
      <h1 style={{ margin: 0 }}>Events</h1>
      <p className="subtitle">Événements programmés au 1755.</p>

      <div style={{ marginBottom: 16 }}>
        <Button variant="primary" block onClick={() => setOpenAdd(true)}>
          <ICON_MAP.Plus /> Ajouter un event
        </Button>
      </div>

      {events.map((ev) => (
        <ListItem
          key={ev._id || ev.id || ev.title}
          icon="Calendar"
          title={ev.title || ev.name || "Event"}
          subtitle={ev.date || ev.startDate || ""}
          onClick={() => { setSelected(ev); setOpenEdit(true); }}
          trail={<ICON_MAP.ChevronRight />}
        />
      ))}

      <AddEventModal
        setEvent={() => setVersion((v) => v + 1)}
        setAppMessage={setAppMessage}
        setOpenLoginModal={setOpenLoginModal}
        openAddEventModal={openAdd}
        setOpenAddEventModal={setOpenAdd}
      />
      <EditEventModal
        event={selected || {}}
        setEvent={() => setVersion((v) => v + 1)}
        setAppMessage={setAppMessage}
        setOpenLoginModal={setOpenLoginModal}
        openEditEventModal={openEdit}
        setOpenEditEventModal={setOpenEdit}
      />
    </div>
  );
};

export default Events;
```

**Note** : l'API `/api/events` peut renvoyer un objet unique ou un tableau selon l'implémentation actuelle du back — le composant normalise. À ajuster au moment du test si le back a un comportement différent.

- [ ] **Step 2 : Brancher la route + import**

Dans `App.js`, remplacer le placeholder `/admin/events` par :

```jsx
<Route path="/admin/events">
  <RequireAuth user={user}>
    <AdminEvents setAppMessage={setAppMessage} setOpenLoginModal={setOpenLoginModal} />
  </RequireAuth>
</Route>
```

Ajouter l'import : `import AdminEvents from "../../pages/Admin/Events";`

- [ ] **Step 3 : Vérifier + commit**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
node -e "require('@babel/parser').parse(require('fs').readFileSync('src/pages/Admin/Events.jsx','utf8'),{sourceType:'module',plugins:['jsx']})"
git add src/pages/Admin/Events.jsx src/components/App/App.js
git commit -m "feat(admin): /admin/events (migration mécanique des modals existantes)"
```

---

### Task 9 : Page `/admin/themes` minimale

**Files:**
- Create: `1755-front/src/pages/Admin/Themes.jsx`

- [ ] **Step 1 : Auditer l'API `/api/themes` côté back**

Run (back local lancé) :
```bash
curl -s http://localhost:8080/api/themes | head -c 500
```

Si la route n'est pas montée dans `1755-back/index.js`, la monter (elle existe dans `routes/themes.routes.js`). Ajouter dans `index.js` :

```js
const themes = require("./routes/themes.routes");
app.use("/api/themes", themes);
```

Commit back si modif :
```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-back
git add index.js
git commit -m "feat(themes): monter la route /api/themes (préparation admin front)"
```

- [ ] **Step 2 : Créer la page**

Écrire `1755-front/src/pages/Admin/Themes.jsx` :

```jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { $SERVER } from "../../_const/_const";
import { ListItem, ICON_MAP } from "../../design-system";
import "./admin.css";

const Themes = ({ setAppMessage }) => {
  const [themes, setThemes] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${$SERVER}/api/themes`);
        setThemes(Array.isArray(data?.data) ? data.data : []);
      } catch (e) {
        setAppMessage && setAppMessage({ negative: true, header: "Erreur", content: e.message });
      }
    })();
  }, [setAppMessage]);

  return (
    <div className="ds-root admin-page">
      <h1 style={{ margin: 0 }}>Thèmes</h1>
      <p className="subtitle">Liste des thèmes visuels (édition à compléter).</p>
      {themes.length === 0 && <div style={{ color: "var(--ds-text-muted)" }}>Aucun thème trouvé.</div>}
      {themes.map((t) => (
        <ListItem
          key={t._id || t.slug || t.name}
          icon="Palette"
          title={t.name || t.slug || "Thème"}
          subtitle={t.active ? "actif" : ""}
        />
      ))}
    </div>
  );
};

export default Themes;
```

- [ ] **Step 3 : Brancher la route**

Dans `App.js`, remplacer placeholder `/admin/themes` par :

```jsx
<Route path="/admin/themes">
  <RequireAuth user={user}>
    <AdminThemes setAppMessage={setAppMessage} />
  </RequireAuth>
</Route>
```

Ajouter l'import : `import AdminThemes from "../../pages/Admin/Themes";`

- [ ] **Step 4 : Vérifier + commit**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
node -e "require('@babel/parser').parse(require('fs').readFileSync('src/pages/Admin/Themes.jsx','utf8'),{sourceType:'module',plugins:['jsx']})"
git add src/pages/Admin/Themes.jsx src/components/App/App.js
git commit -m "feat(admin): /admin/themes (lecture minimale, édition V2)"
```

---

### Task 10 : Nettoyage public — `Categories` consomme l'API + retire l'UI admin

**Files:**
- Modify: `1755-front/src/pages/Categories/index.js`
- Modify: `1755-front/src/components/Small/CategoriesSidebar/index.js`
- Modify: `1755-front/src/components/Small/ProductItem/index.js`

- [ ] **Step 1 : Remplacer l'import statique dans `Categories`**

Dans `1755-front/src/pages/Categories/index.js`, supprimer l'import de `categories` depuis `src/datas/categories.js`. Remplacer par un fetch au mount :

```jsx
import { fetchTree } from "../../services/categoriesApi";
// ... dans le composant :
const [categoriesTree, setCategoriesTree] = useState([]);
useEffect(() => {
  fetchTree().then(setCategoriesTree).catch(() => setCategoriesTree([]));
}, []);
```

Remplacer toutes les références à `categories` (import statique) par `categoriesTree`. Le format est compatible (chaque nœud a `{ name, slug, icon?, iconColor?, children }`), mais l'icône est désormais une **string** (`"Wine"`) au lieu d'un JSX `<FontAwesomeIcon ...>`. Introduire un helper local pour résoudre :

```jsx
import { ICON_MAP } from "../../design-system";
const renderIcon = (cat) => {
  const Icon = cat.icon ? ICON_MAP[cat.icon] : null;
  if (!Icon) return null;
  return <Icon size={48} style={{ color: cat.iconColor || "#ffffff" }} />;
};
```

Et remplacer l'utilisation de `cat.icon` dans le JSX par `renderIcon(cat)`.

- [ ] **Step 2 : Supprimer les boutons admin inline**

Dans le même fichier `Categories/index.js`, **supprimer** tous les usages de `AdminCrudButtons`, les props `setOpenAddProductModal`, `setOpenEditProductModal`, `setOpenUpdateImageModal`, `handleDeleteProduct`, `handleChangeVisibility`, `handleChangeChoice`, et le bouton `⊕ Ajouter produit`. Les pages publiques deviennent purement lecture.

- [ ] **Step 3 : Adapter `CategoriesSidebar`**

Dans `1755-front/src/components/Small/CategoriesSidebar/index.js`, si le composant importe `categories` depuis le fichier statique, remplacer : le composant reçoit désormais l'arbre en prop (depuis `App.js` qui le passera), et résout les icônes via `ICON_MAP`.

Si cette sidebar est consommée depuis `App.js`, la prop arrive de là. Si `Categories` (page) la consomme, elle passe son state.

- [ ] **Step 4 : Nettoyer `ProductItem`**

Dans `1755-front/src/components/Small/ProductItem/index.js`, **retirer** le rendu conditionnel de `AdminCrudButtons`. Supprimer les props associées. Le composant devient stateless en lecture seule.

- [ ] **Step 5 : Vérifier syntaxes + commit**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
for f in src/pages/Categories/index.js src/components/Small/CategoriesSidebar/index.js src/components/Small/ProductItem/index.js; do
  node -e "require('@babel/parser').parse(require('fs').readFileSync('$f','utf8'),{sourceType:'module',plugins:['jsx']})"
done
git add src/pages/Categories/index.js src/components/Small/CategoriesSidebar/index.js src/components/Small/ProductItem/index.js
git commit -m "feat(public): Categories consomme /api/categories, lecture seule (plus de boutons admin inline)"
```

- [ ] **Step 6 : Test manuel**

Back seedé local, front `npm start`. Non connecté : naviguer `/categories`, vérifier :
- Arbre complet affiché (icônes Lucide rendues).
- Aucun bouton admin visible.
- Connecté en admin : toujours aucun bouton admin sur les pages publiques.

---

### Task 11 : Nettoyage `App.js` et `Home`

**Files:**
- Modify: `1755-front/src/components/App/App.js`
- Modify: `1755-front/src/pages/Home/index.js`

- [ ] **Step 1 : Retirer les props admin de `Categories` dans `App.js`**

Dans `App.js`, supprimer les props passées à `<Categories>` qui ne sont plus utilisées : `setOpenAddProductModal`, `setOpenEditProductModal`, `setOpenUpdateImageModal`, `setOpenImageModal`, `setSelectedProduct` (sauf si encore nécessaire pour la modal image en mode public — à vérifier).

Les modals `AddProductModal`, `EditProductModal`, `UpdateImageModal` sont maintenant **uniquement** dans `/admin/products`, donc supprimer leurs montages dans la route `/categories/:categorie` de `App.js`.

Conserver `ImageModal` (qui permet aux visiteurs de zoomer sur une photo produit — c'est une feature publique).

- [ ] **Step 2 : Retirer les boutons admin de `Home`**

Dans `1755-front/src/pages/Home/index.js`, supprimer les boutons d'admin d'event (`setOpenAddEventModal`, `setOpenEditEventModal`) qui apparaissent quand `user` est connecté. La page Home redevient purement lecture pour tout le monde.

Les props `setOpenAddEventModal` et `setOpenEditEventModal` peuvent être supprimées du composant et de son appel depuis `App.js`.

- [ ] **Step 3 : Retirer les montages des modals d'event dans `App.js`**

Dans `App.js`, retirer :
- `<AddEventModal ... />` de la route `/`
- Les states `openAddEventModal`, `setOpenAddEventModal`, `openEditEventModal`, `setOpenEditEventModal`
- L'import de `AddEventModal` (les modals sont maintenant montées dans `/admin/events`)

- [ ] **Step 4 : Vérifier syntaxes + commit**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
node -e "require('@babel/parser').parse(require('fs').readFileSync('src/components/App/App.js','utf8'),{sourceType:'module',plugins:['jsx']})"
node -e "require('@babel/parser').parse(require('fs').readFileSync('src/pages/Home/index.js','utf8'),{sourceType:'module',plugins:['jsx']})"
git add src/components/App/App.js src/pages/Home/index.js
git commit -m "refactor(app): retirer les boutons et modals admin des pages publiques"
```

- [ ] **Step 5 : Test manuel**

Vérifier : Home + Categories publiques sans aucun bouton admin (même connecté). Admin utilisable via `/admin/products` et `/admin/events`.

---

### Task 12 : Suppression de `src/datas/categories.js` et du composant `AdminCrudButtons`

**Files:**
- Delete: `1755-front/src/datas/categories.js`
- Delete: `1755-front/src/components/Small/AdminCrudButtons/` (dossier)

- [ ] **Step 1 : Grep pour s'assurer qu'il n'y a plus d'import résiduel**

Run:
```bash
grep -rn "datas/categories" /Users/pierrefrancoispaoletti/appdevelopment/1755-front/src/ || echo "clean"
grep -rn "AdminCrudButtons" /Users/pierrefrancoispaoletti/appdevelopment/1755-front/src/ || echo "clean"
```
Expected: les deux renvoient `clean` (aucun import résiduel).

- [ ] **Step 2 : Supprimer les fichiers**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
rm -rf src/datas/categories.js src/components/Small/AdminCrudButtons/
```

- [ ] **Step 3 : Build de validation**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front && npm run build 2>&1 | tail -20
```
Expected: `Compiled successfully` (warnings tolérés).

- [ ] **Step 4 : Commit**

```bash
git add -A
git commit -m "chore: suppression de src/datas/categories.js et AdminCrudButtons (remplacés par /api/categories et /admin/products)"
```

---

### Task 13 : Backup prod Mongo (prérequis déploiement)

**Files:** —

- [ ] **Step 1 : Identifier l'URI prod**

Run:
```bash
heroku config:get MONGODB_URI -a le-1755
```
Copier l'URI.

- [ ] **Step 2 : Dump local de la prod**

Run (remplacer `<URI>` par la valeur copiée) :
```bash
mongodump --uri="<URI>" --out=/tmp/le-1755-backup-$(date +%Y%m%d-%H%M)
```
Expected: dossier `/tmp/le-1755-backup-YYYYMMDD-HHMM/` créé avec les BSON de toutes les collections.

- [ ] **Step 3 : Vérifier le contenu du backup**

```bash
ls -lh /tmp/le-1755-backup-*/
```
Expected: voir `products.bson`, `users.bson`, etc.

**Point de non-retour** : ne pas lancer le seed si le backup n'est pas confirmé fonctionnel (test de restoration possible mais non obligatoire si on fait confiance à mongodump).

---

### Task 14 : Dry-run seed sur prod

**Files:** —

- [ ] **Step 1 : Push la branche back sur Heroku preview ou main**

**Option A (plus sûre)** : créer une app Heroku staging clonée, tester dessus. Hors scope ici.

**Option B (pragmatique)** : push la branche `feat/admin-bottom-bar-categories` sur GitHub, **mais ne pas merger** sur `main` → Heroku ne déploie pas encore. On utilise `heroku run` qui peut exécuter un script depuis le code déployé actuel. Or le script n'est pas encore déployé…

**Option C (choisie)** : temporairement déployer la branche back en mergeant sur main **avant** le seed — mais le back tournera alors avec la route `/api/categories` active sur la collection **vide**. Vérifier en amont que ça ne casse rien (aucun front consommateur pour l'instant). Si OK :

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-back
git checkout main
git merge --no-ff feat/admin-bottom-bar-categories -m "feat(category): modèle + API + seed"
git push origin main
```

Heroku va redéployer (2-3 min). Vérifier :
```bash
heroku logs --tail -a le-1755
curl -s https://le-1755.herokuapp.com/api/categories
```
Expected: `{"status":200,"data":[]}`.

- [ ] **Step 2 : Exécuter le dry-run sur la prod**

```bash
heroku run "node scripts/seed-categories.js --dry-run" -a le-1755
```
Expected:
- Mode DRY-RUN confirmé.
- Rapport : `N catégories à créer, 0 à mettre à jour`.
- Liste des slugs orphelins (s'il y en a — si oui, analyser et mettre à jour `categories-seed.json` côté back, re-merger sur main, re-dry-run).
- Sortie `0` ou `2`.

- [ ] **Step 3 : Si orphelins → corriger et recommencer**

Itérer sur `scripts/categories-seed.json`, commit, push, attendre redeploy Heroku, re-dry-run jusqu'à rapport clean.

---

### Task 15 : Seed réel sur prod

**Files:** —

- [ ] **Step 1 : Lancer le seed réel**

```bash
heroku run "node scripts/seed-categories.js" -a le-1755
```
Expected: `OK : N upserts`, sortie `0`.

- [ ] **Step 2 : Vérifier via l'API prod**

```bash
curl -s "https://le-1755.herokuapp.com/api/categories?tree=1" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); console.log('Racines:', d.data.length); d.data.forEach(r => console.log(' -', r.slug, '(', (r.children||[]).length, 'enfants)'))"
```
Expected: 8 racines avec leurs enfants.

- [ ] **Step 3 : Idempotence — relancer**

```bash
heroku run "node scripts/seed-categories.js" -a le-1755
```
Expected: `à créer : 0, à mettre à jour : N`.

---

### Task 16 : Déployer le front et smoke test

**Files:** —

- [ ] **Step 1 : Vérifier `$SERVER` dans `src/_const/_const.js`**

Run:
```bash
grep "\$SERVER" /Users/pierrefrancoispaoletti/appdevelopment/1755-front/src/_const/_const.js
```
Expected: la ligne doit pointer sur `https://le-1755.herokuapp.com` (pas `localhost:8080`). Si ce n'est pas le cas, éditer le fichier pour remettre la prod **sans committer ce changement** en tant que modif propre — c'est la valeur canonique.

- [ ] **Step 2 : Merger la branche front sur main**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
git checkout main
git merge --no-ff feat/admin-bottom-bar-categories -m "feat: admin bottom bar + gestion des catégories"
```

- [ ] **Step 3 : Déployer**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
npm run deploy
```
Expected: `Published` (gh-pages deploy vers `master`).

- [ ] **Step 4 : Sync branche source sur GitHub (convention projet)**

```bash
git push origin main
```

- [ ] **Step 5 : Smoke test mobile sur baravin1755.com**

Ouvrir `https://baravin1755.com` sur un mobile (ou chrome devtools iPhone) :

- BottomAppBar visible en bas, 4 onglets visiteur.
- Tap sur "Carte" → arbre Lucide rendu correctement sur `/categories`.
- Les produits remontent par catégorie (vérifier au moins 3 catégories : vins/rouges/bordeaux, bières, cocktails).
- Login admin → accès à `/admin` + 4 sections fonctionnelles.
- `/admin/categories` → CRUD fonctionne en prod.
- `/admin/products` → liste complète + édition OK.

---

### Task 17 : Rollback plan (documenté, à ne pas exécuter sauf pépin)

**Files:** —

Ce task **n'est pas à exécuter si tout va bien**. Il documente la procédure de rollback en cas de régression bloquante détectée après déploiement.

- [ ] **Step 1 (si rollback nécessaire) : Revert front**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-front
git revert --no-edit HEAD
npm run deploy
git push origin main
```

- [ ] **Step 2 (si rollback nécessaire) : Revert back**

```bash
cd /Users/pierrefrancoispaoletti/appdevelopment/1755-back
git revert --no-edit HEAD
git push origin main
# Heroku redéploie automatiquement
```

- [ ] **Step 3 (si rollback nécessaire) : Purger la collection `categories`**

Sur Mongo prod (via `mongosh <URI>`) :
```
db.categories.drop()
```

- [ ] **Step 4 (si rollback nécessaire) : Restaurer via le backup mongodump**

```bash
mongorestore --uri="<URI>" --dir=/tmp/le-1755-backup-YYYYMMDD-HHMM/ --drop
```

**Attention** : `--drop` efface les collections existantes avant de restaurer. À utiliser uniquement si d'autres données ont été altérées. Pour un simple rollback de la collection `categories`, `db.categories.drop()` suffit puisque le code front/back reverté ne référence plus cette collection.

---

## Récapitulatif

À la fin de ce plan :

- Admin 100% fonctionnel sur mobile : `/admin/categories` (drill-down, CRUD complet), `/admin/products` (liste filtrée + CRUD via modals existantes), `/admin/events`, `/admin/themes`.
- Pages publiques `/` et `/categories/*` en lecture seule, plus aucun bouton admin inline.
- `src/datas/categories.js` et `AdminCrudButtons` supprimés.
- Front public consomme `GET /api/categories?tree=1`.
- Déploiement prod réalisé avec filet de sécurité (backup + dry-run + seed + smoke test).
- Logique de traduction des produits **inchangée** (toujours `GET /api/products?type=X&lang=Y`).

**L'application est en production avec le nouveau shell admin + gestion des catégories.** Les prochains chantiers possibles (hors scope ce spec) : refonte visuelle des écrans publics en appliquant le design system, édition des thèmes plus riche, import/export produits en masse, logging des mutations admin.
