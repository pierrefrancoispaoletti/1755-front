/* eslint-disable react-hooks/exhaustive-deps */
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Button, Sheet } from "../../../../design-system";
import { useCategories } from "../../../../services/useCategories";
import { $SERVER } from "../../../../_const/_const";
import "../AddProduct/productModal.css";

const PARENT_HAS_SUBCAT = ["vins", "alcools", "cuisine", "cuisine-midi"];
const CHILD_HAS_SUBCAT = ["rouges", "blancs", "premiums", "vins d'Exception"];

const EditProductModal = ({
  product,
  setOpenEditProductModal,
  openEditProductModal,
  setOpenLoginModal,
  setAppMessage,
  setProducts,
  setProductsVersion,
}) => {
  const categories = useCategories();
  const { image, ...p } = product || {};

  const [edited, setEdited] = useState({
    name: "",
    region: "",
    description: "",
    price: "",
    type: "",
    category: "",
    subCategory: "",
    choice: false,
    visible: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!product) return;
    setEdited({
      name: p.name || "",
      region: p.region || "",
      description: p.description || "",
      price: p.price ?? "",
      type: p.type || "",
      category: p.category || "",
      subCategory: p.subCategory || "",
      choice: !!p.choice,
      visible: p.visible !== false,
    });
  }, [product, openEditProductModal]);

  useEffect(() => {
    if (!CHILD_HAS_SUBCAT.includes(edited.category)) {
      setEdited((prev) => ({ ...prev, subCategory: "" }));
    }
  }, [edited.category]);

  const change = (e) =>
    setEdited((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onClose = () => setOpenEditProductModal(false);

  const typeCategory = categories.find((c) => c.slug === edited.type);
  const childCategory = typeCategory?.subCategories?.find(
    (s) => s.slug === edited.category,
  );

  const needsCategory = PARENT_HAS_SUBCAT.includes(edited.type);
  const needsSubCategory = CHILD_HAS_SUBCAT.includes(edited.category);

  const isInvalid =
    !edited.name ||
    !edited.price ||
    !edited.type ||
    (needsCategory && !edited.category) ||
    (needsSubCategory && !edited.subCategory);

  const handleSubmit = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token-1755");
    if (!token) {
      setOpenEditProductModal(false);
      setOpenLoginModal(true);
      return;
    }
    setLoading(true);
    axios({
      method: "post",
      url: `${$SERVER}/api/products/updateProduct`,
      data: { update: edited, productId: p._id },
      headers: { Authorization: "Bearer " + token },
    })
      .then((response) => {
        if (response?.data?.status === 200) {
          setProducts(response.data.data);
          setProductsVersion?.((v) => v + 1);
        }
        setAppMessage({
          success: response.data.status === 200,
          message: response.data.message,
        });
      })
      .catch(() =>
        setAppMessage({
          success: false,
          message: "Il y a eu un probleme, veuillez reessayer",
        }),
      )
      .finally(() => {
        setLoading(false);
        setOpenEditProductModal(false);
      });
  };

  return (
    <Sheet
      open={openEditProductModal}
      onClose={onClose}
      title={<h2 className="pm-title">Éditer {p.name || "le produit"}</h2>}
    >
      <form id="editProduct-form" onSubmit={handleSubmit} className="pm-form">
        <label className="pm-field">
          <span className="pm-label">Nom</span>
          <input
            type="text"
            name="name"
            value={edited.name}
            onChange={change}
            required
          />
        </label>

        <label className="pm-field">
          <span className="pm-label">Description</span>
          <textarea
            name="description"
            rows={4}
            value={edited.description}
            onChange={change}
          />
        </label>

        <div className="pm-row">
          <label className="pm-field pm-field--grow">
            <span className="pm-label">Région</span>
            <input
              type="text"
              name="region"
              value={edited.region}
              onChange={change}
            />
          </label>
          <label className="pm-field pm-field--price">
            <span className="pm-label">Prix €</span>
            <input
              type="number"
              name="price"
              min={1}
              step={0.1}
              value={edited.price}
              onChange={change}
              required
            />
          </label>
        </div>

        <div className="pm-section">
          <span className="pm-label">Type</span>
          <div className="pm-pills">
            {categories
              .filter((c) => c.slug)
              .map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  className={`pm-pill${edited.type === c.slug ? " pm-pill--active" : ""}`}
                  onClick={() =>
                    setEdited((prev) => ({
                      ...prev,
                      type: c.slug,
                      category: "",
                      subCategory: "",
                    }))
                  }
                >
                  {c.name}
                </button>
              ))}
          </div>
        </div>

        {needsCategory && typeCategory?.subCategories?.length > 0 && (
          <div className="pm-section">
            <span className="pm-label">Catégorie</span>
            <div className="pm-pills">
              {typeCategory.subCategories.map((sub) => (
                <button
                  key={sub.slug}
                  type="button"
                  className={`pm-pill${edited.category === sub.slug ? " pm-pill--active" : ""}`}
                  onClick={() =>
                    setEdited((prev) => ({
                      ...prev,
                      category: sub.slug,
                      subCategory: "",
                    }))
                  }
                >
                  {sub.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {needsSubCategory && childCategory?.subCat?.length > 0 && (
          <div className="pm-section">
            <span className="pm-label">Sous-catégorie</span>
            <div className="pm-pills">
              {childCategory.subCat.map((sc) => (
                <button
                  key={sc.slug}
                  type="button"
                  className={`pm-pill${edited.subCategory === sc.slug ? " pm-pill--active" : ""}`}
                  onClick={() =>
                    setEdited((prev) => ({ ...prev, subCategory: sc.slug }))
                  }
                >
                  {sc.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="pm-toggle">
          <input
            type="checkbox"
            checked={edited.choice}
            onChange={() =>
              setEdited((prev) => ({ ...prev, choice: !prev.choice }))
            }
          />
          <span>Coup de cœur</span>
        </label>

        <label className="pm-toggle">
          <input
            type="checkbox"
            checked={edited.visible}
            onChange={() =>
              setEdited((prev) => ({ ...prev, visible: !prev.visible }))
            }
          />
          <span>Visible</span>
        </label>

        <div className="pm-actions">
          <Button
            variant="primary"
            type="submit"
            disabled={loading || isInvalid}
            block
          >
            {loading ? "Enregistrement…" : "Enregistrer"}
          </Button>
          <button
            type="button"
            className="pm-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </button>
        </div>
      </form>
    </Sheet>
  );
};

export default EditProductModal;
