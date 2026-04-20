/* eslint-disable react-hooks/exhaustive-deps */
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import Loader from "../../components/Small/Loader";
import ProductItem from "../../components/Small/ProductItem";
import CategoryFilterPills from "../../components/Small/CategoryFilterPills";
import ProductDetail from "../../components/Medium/Modals/ProductDetail";
import { useCategories } from "../../services/useCategories";
import { $SERVER } from "../../_const/_const";
import "./categories.css";

const Categories = ({
  setFilteredProducts,
  selectedCategory,
  setSelectedCategory,
  dropdownValue,
  activeMenu,
  setActiveMenu,
  setDropdownValue,
  filteredProducts,
  productsVersion,
  setSelectedProduct,
  setOpenImageModal,
}) => {
  const params = useParams();
  const categories = useCategories();
  const { name, subCategories, slug } = selectedCategory;
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [detailProduct, setDetailProduct] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [hideChoice, setHideChoice] = useState(
    () => localStorage.getItem("1755-hide-choice") === "1",
  );
  const [priceSort, setPriceSort] = useState(() => {
    const v = localStorage.getItem("1755-price-sort");
    return v === "asc" || v === "desc" ? v : "default";
  });
  const cacheRef = useRef({});
  const lastVersionRef = useRef(productsVersion);

  useEffect(() => {
    localStorage.setItem("1755-hide-choice", hideChoice ? "1" : "0");
  }, [hideChoice]);

  useEffect(() => {
    localStorage.setItem("1755-price-sort", priceSort);
  }, [priceSort]);

  const cyclePriceSort = () => {
    setPriceSort((s) =>
      s === "default" ? "asc" : s === "asc" ? "desc" : "default",
    );
  };

  useEffect(() => {
    const s = params?.categorie;
    if (!s) return;
    if (selectedCategory?.slug === s) return;
    if (!categories.length) return;
    const match = categories.find((c) => c.slug === s);
    if (match) {
      setSelectedCategory(match);
      setActiveMenu("");
      setDropdownValue("");
      setProducts([]);
    }
  }, [params?.categorie, categories]);

  useEffect(() => {
    const type = selectedCategory?.slug;
    if (!type) return;
    if (type !== params?.categorie) return;
    const lang = (navigator.language || "fr").toLowerCase().slice(0, 2);
    const cacheKey = `${type}_${lang}`;

    if (productsVersion !== lastVersionRef.current) {
      cacheRef.current = {};
      lastVersionRef.current = productsVersion;
    } else if (cacheRef.current[cacheKey]) {
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
  }, [selectedCategory, productsVersion]);

  useEffect(() => {
    if (!products.length) {
      setFilteredProducts([]);
      return;
    }
    if (dropdownValue) {
      setFilteredProducts(
        products.filter((p) => p.subCategory === dropdownValue),
      );
    } else if (activeMenu) {
      setFilteredProducts(products.filter((p) => p.category === activeMenu));
    } else {
      setFilteredProducts(products);
    }
  }, [products, activeMenu, dropdownValue]);

  const headerTitle = (() => {
    const parent = subCategories?.find((s) => s.slug === activeMenu);
    if (parent) return `${name} — ${parent.name}`;
    return name || "";
  })();

  const visibleProducts = (filteredProducts || [])
    .filter((p) => p.visible)
    .filter((p) => !hideChoice || !p.choice)
    .sort((a, b) => {
      if (priceSort === "asc") return (a.price || 0) - (b.price || 0);
      if (priceSort === "desc") return (b.price || 0) - (a.price || 0);
      if (!!a.choice !== !!b.choice) return a.choice ? -1 : 1;
      return (a.price || 0) - (b.price || 0);
    });

  const priceSortLabel =
    priceSort === "asc" ? "Prix ↑" : priceSort === "desc" ? "Prix ↓" : "Prix";

  return (
    <main className="categories ds-root">
      <h1 className="categories-title">{headerTitle}</h1>

      <CategoryFilterPills
        subCategories={subCategories || []}
        products={products}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        dropdownValue={dropdownValue}
        setDropdownValue={setDropdownValue}
        typeSlug={slug}
      />

      <div className="categories-options">
        <button
          type="button"
          className={`cat-opt${priceSort !== "default" ? " cat-opt--active" : ""}`}
          onClick={cyclePriceSort}
          aria-label="Trier par prix"
        >
          {priceSortLabel}
        </button>
        <button
          type="button"
          className={`cat-opt${hideChoice ? " cat-opt--active" : ""}`}
          onClick={() => setHideChoice((v) => !v)}
          aria-pressed={hideChoice}
        >
          {hideChoice ? "Afficher les coups de cœur" : "Masquer les coups de cœur"}
        </button>
      </div>

      {loading && (
        <div className="categories-loader">
          <Loader />
        </div>
      )}

      {!loading && visibleProducts.length === 0 && (
        <p className="categories-empty">
          Aucun produit disponible pour cette sélection.
        </p>
      )}

      <div className="categories-products">
        {!loading &&
          visibleProducts.map((p) => (
            <ProductItem
              key={p._id}
              product={p}
              setOpenImageModal={setOpenImageModal}
              setSelectedProduct={setSelectedProduct}
              onOpenDetail={(prod) => {
                setDetailProduct(prod);
                setDetailOpen(true);
              }}
            />
          ))}
      </div>

      <ProductDetail
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        product={detailProduct}
        onOpenImage={(prod) => {
          setSelectedProduct(prod);
          setOpenImageModal(true);
        }}
      />
    </main>
  );
};

export default Categories;
