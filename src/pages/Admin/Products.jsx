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
