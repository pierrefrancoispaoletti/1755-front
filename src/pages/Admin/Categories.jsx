import React, { useCallback, useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { Button, ListItem, ICON_MAP } from "../../design-system";
import { fetchFlat, deleteCategory, moveCategory } from "../../services/categoriesApi";
import { invalidateCategoriesCache } from "../../services/useCategories";
import { invalidateCategoriesTreeCache } from "../../services/useCategoriesTree";
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
      invalidateCategoriesCache();
      invalidateCategoriesTreeCache();
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    }
  };

  const handleReorder = async (cat, direction) => {
    const siblings = children;
    const idx = siblings.findIndex((c) => c._id === cat._id);
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= siblings.length) return;
    const other = siblings[target];
    try {
      await moveCategory(cat._id, {
        parentId: cat.parentId || null,
        order: other.order,
      });
      await moveCategory(other._id, {
        parentId: other.parentId || null,
        order: cat.order,
      });
      invalidateCategoriesCache();
      invalidateCategoriesTreeCache();
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

      {children.map((cat, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === children.length - 1;
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
              <button
                type="button"
                className="admin-cat__action-btn"
                onClick={() => handleReorder(cat, "up")}
                disabled={isFirst}
                aria-label="Monter"
              >
                <ICON_MAP.ChevronUp size={16} />
              </button>
              <button
                type="button"
                className="admin-cat__action-btn"
                onClick={() => handleReorder(cat, "down")}
                disabled={isLast}
                aria-label="Descendre"
              >
                <ICON_MAP.ChevronDown size={16} />
              </button>
              <button
                type="button"
                className="admin-cat__action-btn"
                onClick={() => handleEdit(cat)}
              >
                <ICON_MAP.Edit size={14} /> Éditer
              </button>
              <button
                type="button"
                className="admin-cat__action-btn admin-cat__action-btn--danger"
                onClick={() => handleDelete(cat)}
              >
                <ICON_MAP.Trash size={14} /> Supprimer
              </button>
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
