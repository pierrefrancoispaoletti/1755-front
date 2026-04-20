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
  const [catQuery, setCatQuery] = useState("");
  const [catOpen, setCatOpen] = useState(false);
  const [filterCat, setFilterCat] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [choiceOnly, setChoiceOnly] = useState(false);
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
            headers: { Authorization: `Bearer ${localStorage.getItem("token-1755")}` },
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
      const matchCat =
        !filterCat ||
        p.type === filterCat ||
        p.category === filterCat ||
        p.subCategory === filterCat;
      const matchQ = !q || (p.name || "").toLowerCase().includes(q);
      const matchVisibility =
        visibilityFilter === "all" ||
        (visibilityFilter === "visible" && p.visible) ||
        (visibilityFilter === "hidden" && !p.visible);
      const matchChoice = !choiceOnly || !!p.choice;
      return matchCat && matchQ && matchVisibility && matchChoice;
    });
  }, [products, query, filterCat, visibilityFilter, choiceOnly]);

  const togglePatch = async (p, patch) => {
    try {
      const { image, _id, ...rest } = p;
      await axios.post(
        `${$SERVER}/api/products/updateProduct`,
        { productId: _id, update: { ...rest, ...patch } },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token-1755")}` } }
      );
      setProductsVersion((v) => v + 1);
    } catch (e) {
      setAppMessage && setAppMessage({ negative: true, header: "Erreur", content: e.message });
    }
  };

  const changeVisibility = (p) => togglePatch(p, { visible: !p.visible });
  const changeChoice = (p) => togglePatch(p, { choice: !p.choice });

  const handleDelete = async (p) => {
    if (!window.confirm(`Supprimer "${p.name}" ?`)) return;
    try {
      await axios.delete(`${$SERVER}/api/products/deleteProduct`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token-1755")}` },
        data: { productId: p._id },
      });
      setProductsVersion((v) => v + 1);
    } catch (e) {
      setAppMessage && setAppMessage({ negative: true, header: "Erreur", content: e.message });
    }
  };

  const filteredCatOptions = useMemo(() => {
    const q = catQuery.trim().toLowerCase();
    if (!q) return cats;
    return cats.filter((c) => (c.name || "").toLowerCase().includes(q));
  }, [cats, catQuery]);

  const selectedCatLabel = filterCat
    ? cats.find((c) => c.slug === filterCat)?.name || filterCat
    : "";

  const pickCategory = (slug, label) => {
    setFilterCat(slug);
    setCatQuery(label || "");
    setCatOpen(false);
  };

  const clearCategory = () => {
    setFilterCat("");
    setCatQuery("");
    setCatOpen(false);
  };

  const catBySlug = useMemo(() => {
    const m = new Map();
    cats.forEach((c) => m.set(c.slug, c));
    return m;
  }, [cats]);

  const resolveProductIcon = (p) => {
    const candidates = [p.subCategory, p.category, p.type].filter(Boolean);
    for (const slug of candidates) {
      const c = catBySlug.get(slug);
      if (c && c.icon) return c;
    }
    return null;
  };

  const formatPrice = (n) =>
    typeof n === "number" ? `${n.toFixed(2).replace(".", ",")}€` : "";

  const categoryPath = (p) =>
    [p.type, p.category, p.subCategory]
      .filter(Boolean)
      .map((slug) => catBySlug.get(slug)?.name || slug)
      .join(" › ");

  return (
    <div className="ds-root admin-page">
      <div className="admin-prod__header">
        <h1>Produits</h1>
      </div>
      <div className="admin-prod__crumb">
        {filtered.length} produit(s) — {products.length} au total
      </div>

      <div className="admin-prod__toolbar">
        <input
          placeholder="Rechercher un produit…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="admin-prod__combobox">
          <input
            placeholder="Toutes catégories"
            value={catOpen ? catQuery : selectedCatLabel}
            onChange={(e) => {
              setCatQuery(e.target.value);
              setCatOpen(true);
              if (filterCat) setFilterCat("");
            }}
            onFocus={() => { setCatQuery(""); setCatOpen(true); }}
            onBlur={() => setTimeout(() => setCatOpen(false), 150)}
          />
          {filterCat && (
            <button
              type="button"
              className="admin-prod__combobox-clear"
              onMouseDown={(e) => e.preventDefault()}
              onClick={clearCategory}
              aria-label="Effacer la catégorie"
            >
              <ICON_MAP.X size={14} />
            </button>
          )}
          {catOpen && filteredCatOptions.length > 0 && (
            <ul className="admin-prod__combobox-menu">
              {filteredCatOptions.slice(0, 50).map((c) => (
                <li key={c._id || c.slug}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickCategory(c.slug, c.name)}
                  >
                    {c.name}
                    <span className="admin-prod__combobox-slug">{c.slug}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="admin-prod__filters">
        <div className="admin-prod__filter-group">
          <span className="admin-prod__filter-label">Visibilité</span>
          <div className="admin-prod__filter-pills">
            {[
              { value: "all", label: "Tous" },
              { value: "visible", label: "Visibles" },
              { value: "hidden", label: "Masqués" },
            ].map((o) => (
              <button
                key={o.value}
                type="button"
                className={`admin-prod__filter-pill${visibilityFilter === o.value ? " admin-prod__filter-pill--active" : ""}`}
                onClick={() => setVisibilityFilter(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          className={`admin-prod__filter-pill${choiceOnly ? " admin-prod__filter-pill--active" : ""}`}
          onClick={() => setChoiceOnly((v) => !v)}
          aria-pressed={choiceOnly}
        >
          <ICON_MAP.Heart size={12} /> Coups de cœur
        </button>
      </div>

      <div className="admin-prod__add">
        <Button variant="primary" block onClick={() => setOpenAdd(true)}>
          <ICON_MAP.Plus /> Ajouter un produit
        </Button>
      </div>

      {loading && <div className="admin-prod__empty">Chargement…</div>}
      {!loading && filtered.length === 0 && (
        <div className="admin-prod__empty">Aucun produit.</div>
      )}

      {filtered.map((p) => {
        const cat = resolveProductIcon(p);
        return (
        <div key={p._id}>
          <ListItem
            icon={cat?.icon || "Package"}
            iconColor={cat?.iconColor}
            badge={p.choice ? { icon: "Star", color: "#D4A24C" } : null}
            title={p.name}
            subtitle={`${formatPrice(p.price)} · ${categoryPath(p)}`}
            hidden={!p.visible}
            onClick={() => { setSelected(p); setOpenEdit(true); }}
            trail={<ICON_MAP.ChevronRight />}
          />
          <div className="admin-prod__actions">
            <button
              type="button"
              className="admin-prod__action-btn"
              onClick={() => { setSelected(p); setOpenEdit(true); }}
            >
              <ICON_MAP.Edit size={14} /> Éditer
            </button>
            <button
              type="button"
              className="admin-prod__action-btn"
              onClick={() => { setSelected(p); setOpenImg(true); }}
            >
              <ICON_MAP.Image size={14} /> Image
            </button>
            <button
              type="button"
              className={`admin-prod__action-btn${!p.visible ? " admin-prod__action-btn--active" : ""}`}
              onClick={() => changeVisibility(p)}
              aria-pressed={!p.visible}
            >
              {p.visible ? <ICON_MAP.EyeOff size={14} /> : <ICON_MAP.Eye size={14} />}
              {p.visible ? "Masquer" : "Afficher"}
            </button>
            <button
              type="button"
              className={`admin-prod__action-btn${p.choice ? " admin-prod__action-btn--active" : ""}`}
              onClick={() => changeChoice(p)}
              aria-pressed={!!p.choice}
            >
              <ICON_MAP.Heart size={14} /> Coup de cœur
            </button>
            <button
              type="button"
              className="admin-prod__action-btn admin-prod__action-btn--danger"
              onClick={() => handleDelete(p)}
              aria-label="Supprimer"
            >
              <ICON_MAP.Trash size={14} /> Supprimer
            </button>
          </div>
        </div>
        );
      })}

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
