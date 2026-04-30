/* eslint-disable no-unused-expressions */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import {
  Button,
  Container,
  Divider,
  Header,
  Transition,
} from "semantic-ui-react";
import AdminCrudButtons from "../../components/Small/AdminCrudButtons";
import Loader from "../../components/Small/Loader";
import ProductItem from "../../components/Small/ProductItem";
import ProductsFilteringMenu from "../../components/Small/ProductsFilteringMenu";
import categories from "../../datas/categories";
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
  user,
  setOpenAddProductModal,
  setOpenLoginModal,
  setSelectedProduct,
  setOpenEditProductModal,
  setOpenImageModal,
  setOpenUpdateImageModal,
}) => {
  const category = useParams();
  const { name, subCategories } = selectedCategory;
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const cacheRef = useRef({});
  const lastVersionRef = useRef(productsVersion);

  useEffect(() => {
    const slug = category?.categorie;
    if (!slug) return;
    if (selectedCategory?.slug === slug) return;
    const match = categories.find((c) => c.slug === slug);
    if (match) setSelectedCategory(match);
  }, [category?.categorie]);

  const result =
    (selectedCategory.slug === "vins" || selectedCategory.slug === "alcools") &&
    (selectedCategory?.subCategories[0]?.subCat?.find(
      ({ name, slug }) => slug === dropdownValue,
    ) ||
      selectedCategory?.subCategories[1]?.subCat?.find(
        ({ name, slug }) => slug === dropdownValue,
      ) ||
      selectedCategory?.subCategories[3]?.subCat?.find(
        ({ name, slug }) => slug === dropdownValue,
      ));
  const prevDropdownValueRef = useRef();

  useEffect(() => {
    prevDropdownValueRef.current = dropdownValue;
  });

  const prevDropdownValue = prevDropdownValueRef.current;

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
    if (!products.length) {
      setFilteredProducts([]);
      return;
    }
    if (activeMenu) {
      setFilteredProducts(products.filter((p) => p.category === activeMenu));
    } else {
      setFilteredProducts(products);
    }
  }, [products, activeMenu]);

  useEffect(() => {
    setDropdownValue("");
    if (activeMenu) {
      setFilteredProducts(products?.filter((p) => p.category === activeMenu));
    }
  }, [activeMenu]);

  useEffect(() => {
    if (dropdownValue) {
      setDropdownValue(dropdownValue);
      setFilteredProducts(
        products?.filter((p) => p.subCategory === dropdownValue),
      );
    }
  }, [dropdownValue]);

  const token = localStorage.getItem("token-1755");

  const handleDeleteProduct = (productId) => {
    if (token) {
      setLoading(true);
      axios({
        method: "delete",
        url: `${$SERVER}/api/products/deleteProduct`,
        data: {
          productId,
        },
        headers: {
          Authorization: "Bearer " + token,
        },
      })
        .then((response) => {
          const filtered = response.data.data.filter(
            (p) => p.type === selectedCategory.slug,
          );
          setProducts(filtered);
          const cacheKey = `${selectedCategory.slug}_${(
            navigator.language || "fr"
          )
            .toLowerCase()
            .slice(0, 2)}`;
          cacheRef.current[cacheKey] = filtered;
        })
        .catch((error) => console.log(error))
        .finally(() => setLoading(false));
    } else {
      setOpenLoginModal(true);
    }
  };

  const handleChangeVisibility = (product) => {
    let { image, ...newProduct } = product;
    newProduct.visible = !product.visible;
    if (token) {
      setLoading(true);
      axios({
        method: "post",
        url: `${$SERVER}/api/products/updateProduct`,
        data: {
          update: newProduct,
          productId: product._id,
        },
        headers: {
          Authorization: "Bearer " + token,
        },
      })
        .then((response) => {
          const filtered = response.data.data.filter(
            (p) => p.type === selectedCategory.slug,
          );
          setProducts(filtered);
          const cacheKey = `${selectedCategory.slug}_${(
            navigator.language || "fr"
          )
            .toLowerCase()
            .slice(0, 2)}`;
          cacheRef.current[cacheKey] = filtered;
        })
        .catch((error) => console.log(error))
        .finally(() => setLoading(false));
    } else {
      setOpenLoginModal(true);
    }
  };

  const handleChangeChoice = (product) => {
    let { image, ...newProduct } = product;
    newProduct.choice = !product.choice;
    if (token) {
      setLoading(true);
      axios({
        method: "post",
        url: `${$SERVER}/api/products/updateProduct`,
        data: {
          update: newProduct,
          productId: product._id,
        },
        headers: {
          Authorization: "Bearer " + token,
        },
      })
        .then((response) => {
          const filtered = response.data.data.filter(
            (p) => p.type === selectedCategory.slug,
          );
          setProducts(filtered);
          const cacheKey = `${selectedCategory.slug}_${(
            navigator.language || "fr"
          )
            .toLowerCase()
            .slice(0, 2)}`;
          cacheRef.current[cacheKey] = filtered;
        })
        .catch((error) => console.log(error))
        .finally(() => setLoading(false));
    } else {
      setOpenLoginModal(true);
    }
  };

  return (
    <Container className="categories">
      {user && (
        <div>
          <Button
            color="green"
            circular
            size="medium"
            onClick={() => setOpenAddProductModal(true)}
          >
            <FontAwesomeIcon icon={faPlus} size="2x" />
          </Button>
        </div>
      )}
      <Header
        className="categories-header"
        as="h2"
        style={
          activeMenu.includes("rouge") || dropdownValue?.includes("rouge")
            ? { color: "darkred" }
            : activeMenu.includes("rose") || dropdownValue?.includes("rose")
              ? { color: "#fec5d9" }
              : activeMenu.includes("blanc") || dropdownValue?.includes("blanc")
                ? { color: "#f1f285" }
                : { color: "white" }
        }
      >
        {selectedCategory.name}
        {(category.categorie === "vins" || category.categorie === "alcools") &&
          !!dropdownValue && (
            <Transition
              visible={dropdownValue === prevDropdownValue}
              animation="fly right"
              duration={1000}
            >
              <Header.Subheader className="categories-subheader">
                {`${result && result.name}`}
              </Header.Subheader>
            </Transition>
          )}
      </Header>
      <Divider hidden />
      {subCategories && (
        <ProductsFilteringMenu
          products={products}
          dropdownValue={dropdownValue}
          subCategories={subCategories}
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          setDropdownValue={setDropdownValue}
        />
      )}
      <Divider hidden />
      {loading && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 5000,
          }}
        >
          <Loader />
        </div>
      )}
      <div className="products">
        {!loading &&
          filteredProducts
            ?.sort((a, b) => a.price - b.price)
            .map((p) => (
              <>
                {user && (
                  <AdminCrudButtons
                    loading={loading}
                    {...p}
                    product={p}
                    handleDeleteProduct={handleDeleteProduct}
                    handleChangeVisibility={handleChangeVisibility}
                    handleChangeChoice={handleChangeChoice}
                    setSelectedProduct={setSelectedProduct}
                    setOpenEditProductModal={setOpenEditProductModal}
                    setOpenUpdateImageModal={setOpenUpdateImageModal}
                  />
                )}
                <ProductItem
                  key={p._id}
                  product={p}
                  {...p}
                  user={user}
                  setOpenImageModal={setOpenImageModal}
                  setSelectedProduct={setSelectedProduct}
                />
              </>
            ))}
      </div>
      <Divider hidden />
      {subCategories && filteredProducts.length > 1 && (
        <ProductsFilteringMenu
          products={products}
          dropdownValue={dropdownValue}
          subCategories={subCategories}
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          setDropdownValue={setDropdownValue}
        />
      )}
    </Container>
  );
};

export default Categories;
