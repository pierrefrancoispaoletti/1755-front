/* eslint-disable react-hooks/exhaustive-deps */
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import Resizer from "react-image-file-resizer";
import { Button, Sheet } from "../../../../design-system";
import { useCategories } from "../../../../services/useCategories";
import { $SERVER, COMPRESSION_QUALITY } from "../../../../_const/_const";
import "./productModal.css";

const PARENT_HAS_SUBCAT = ["vins", "alcools", "cuisine", "cuisine-midi"];
const CHILD_HAS_SUBCAT = ["rouges", "blancs", "premiums", "vins d'Exception"];

const AddProductModal = ({
  selectedCategory,
  setAppMessage,
  openAddProductModal,
  setOpenAddProductModal,
  setOpenLoginModal,
  setProducts,
  setProductsVersion,
}) => {
  const categories = useCategories();
  const [product, setProduct] = useState({
    name: "",
    region: "",
    description: "",
    price: "",
    type: "",
    category: "",
    subCategory: "",
    choice: false,
    visible: true,
    image: "",
  });
  const [loading, setLoading] = useState(false);
  const inputFile = useRef(null);

  useEffect(() => {
    setProduct((p) => ({ ...p, type: selectedCategory?.slug || "" }));
  }, [selectedCategory]);

  useEffect(() => {
    if (!CHILD_HAS_SUBCAT.includes(product.category)) {
      setProduct((p) => ({ ...p, subCategory: "" }));
    }
  }, [product.category]);

  const change = (e) =>
    setProduct((p) => ({ ...p, [e.target.name]: e.target.value }));

  const setImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Resizer.imageFileResizer(
      file,
      363,
      360,
      "JPEG",
      COMPRESSION_QUALITY,
      0,
      (uri) => setProduct((p) => ({ ...p, image: uri })),
      "file",
    );
  };

  const onClose = () => setOpenAddProductModal(false);

  const typeCategory = categories.find((c) => c.slug === product.type);
  const childCategory = typeCategory?.subCategories?.find(
    (s) => s.slug === product.category,
  );

  const needsCategory = PARENT_HAS_SUBCAT.includes(product.type);
  const needsSubCategory = CHILD_HAS_SUBCAT.includes(product.category);

  const isInvalid =
    !product.name ||
    !product.price ||
    !product.type ||
    (needsCategory && !product.category) ||
    (needsSubCategory && !product.subCategory);

  const handleSubmit = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token-1755");
    if (!token) {
      setOpenAddProductModal(false);
      setOpenLoginModal(true);
      return;
    }
    const formData = new FormData();
    formData.append("name", product.name);
    formData.append("description", product.description || "");
    formData.append("region", product.region || "");
    formData.append("price", product.price);
    formData.append("type", product.type);
    formData.append("category", product.category || "");
    formData.append("subCategory", product.subCategory || "");
    formData.append("choice", product.choice || false);
    formData.append("visible", product.visible || true);
    formData.append("image", product.image || "");

    setLoading(true);
    axios({
      method: "post",
      url: `${$SERVER}/api/products/createProduct`,
      data: formData,
      headers: {
        "content-type": "multipart/form-data",
        Authorization: "Bearer " + token,
      },
    })
      .then((response) => {
        if (response?.data?.status === 200) {
          setProducts(response.data.data);
          setProductsVersion?.((v) => v + 1);
          setProduct({
            name: "",
            region: "",
            description: "",
            price: "",
            type: "",
            category: "",
            subCategory: "",
            choice: false,
            visible: true,
            image: "",
          });
        }
        setAppMessage({
          success: response.data.status === 200,
          message: response.data.message,
        });
        setOpenAddProductModal(false);
      })
      .catch(() =>
        setAppMessage({
          success: false,
          message: "Il y a eu un probleme, veuillez reessayer",
        }),
      )
      .finally(() => setLoading(false));
  };

  return (
    <Sheet
      open={openAddProductModal}
      onClose={onClose}
      title={<h2 className="pm-title">Ajouter un produit</h2>}
    >
      <form id="addProduct-form" onSubmit={handleSubmit} className="pm-form">
        <label className="pm-field">
          <span className="pm-label">Nom</span>
          <input
            type="text"
            name="name"
            value={product.name}
            onChange={change}
            required
          />
        </label>

        <label className="pm-field">
          <span className="pm-label">Description</span>
          <textarea
            name="description"
            rows={4}
            value={product.description}
            onChange={change}
          />
        </label>

        <div className="pm-row">
          <label className="pm-field pm-field--grow">
            <span className="pm-label">Région</span>
            <input
              type="text"
              name="region"
              value={product.region}
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
              value={product.price}
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
                  className={`pm-pill${product.type === c.slug ? " pm-pill--active" : ""}`}
                  onClick={() =>
                    setProduct((p) => ({
                      ...p,
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
                  className={`pm-pill${product.category === sub.slug ? " pm-pill--active" : ""}`}
                  onClick={() =>
                    setProduct((p) => ({
                      ...p,
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
                  className={`pm-pill${product.subCategory === sc.slug ? " pm-pill--active" : ""}`}
                  onClick={() =>
                    setProduct((p) => ({ ...p, subCategory: sc.slug }))
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
            checked={product.choice}
            onChange={() => setProduct((p) => ({ ...p, choice: !p.choice }))}
          />
          <span>Coup de cœur</span>
        </label>

        <div className="pm-section">
          <input
            ref={inputFile}
            type="file"
            accept="image/*"
            hidden
            onChange={setImage}
          />
          <button
            type="button"
            className="pm-file-btn"
            onClick={() => inputFile.current.click()}
            disabled={loading}
          >
            {product.image
              ? "Image sélectionnée — changer"
              : "Ajouter une image"}
          </button>
        </div>

        <div className="pm-actions">
          <button
            type="button"
            className="pm-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </button>
          <Button
            variant="primary"
            type="submit"
            disabled={loading || isInvalid}
          >
            {loading ? "Ajout…" : "Ajouter"}
          </Button>
        </div>
      </form>
    </Sheet>
  );
};

export default AddProductModal;
