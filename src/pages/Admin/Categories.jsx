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
