/* eslint-disable react-hooks/exhaustive-deps */
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import Loader from "../../components/Small/Loader";
import ProductItem from "../../components/Small/ProductItem";
import CategoryFilterPills from "../../components/Small/CategoryFilterPills";
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
  const cacheRef = useRef({});
  const lastVersionRef = useRef(productsVersion);

  useEffect(() => {
    const s = params?.categorie;
    if (!s) return;
    if (selectedCategory?.slug === s) return;
    if (!categories.length) return;
    const match = categories.find((c) => c.slug === s);
    if (match) setSelectedCategory(match);
  }, [params?.categorie, categories]);

  useEffect(() => {
    const type = selectedCategory?.slug;
    if (!type) return;
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
    if (!products.length) { setFilteredProducts([]); return; }
    if (dropdownValue) {
      setFilteredProducts(products.filter((p) => p.subCategory === dropdownValue));
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
    .sort((a, b) => {
      if (!!a.choice !== !!b.choice) return a.choice ? -1 : 1;
      return (a.price || 0) - (b.price || 0);
    });

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

      {loading && (
        <div className="categories-loader">
          <Loader />
        </div>
      )}

      {!loading && visibleProducts.length === 0 && (
        <p className="categories-empty">Aucun produit disponible pour cette sélection.</p>
      )}

      <div className="categories-products">
        {!loading &&
          visibleProducts.map((p) => (
            <ProductItem
              key={p._id}
              product={p}
              setOpenImageModal={setOpenImageModal}
              setSelectedProduct={setSelectedProduct}
            />
          ))}
      </div>
    </main>
  );
};

export default Categories;
