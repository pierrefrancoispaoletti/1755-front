/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { faPlus } from "@fortawesome/pro-duotone-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Button, Container, Divider, Header } from "semantic-ui-react";
import AdminCrudButtons from "../../components/Small/AdminCrudButtons";
import ProductItem from "../../components/Small/ProductItem";
import ProductsFilteringMenu from "../../components/Small/ProductsFilteringMenu";
import { $SERVER } from "../../_const/_const";
import "./categories.css";
const Categories = ({
  selectedCategory,
  products,
  user,
  setOpenAddProductModal,
  setProducts,
  setOpenLoginModal,
  setSelectedProduct,
  setOpenEditProductModal,
}) => {
  const category = useParams();
  const { name, subCategories } = selectedCategory;
  const [activeMenu, setActiveMenu] = useState("");
  const [dropdownValue, setDropdownValue] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setFilteredProducts(
      products.filter((p) => p.type === selectedCategory.slug)
    );
  }, [selectedCategory]);

  useEffect(() => {
    setFilteredProducts(products.filter((p) => p.category === activeMenu));
  }, [activeMenu]);

  useEffect(() => {
    setFilteredProducts(products.filter((p) => p.category === activeMenu));
  }, [products]);

  useEffect(() => {
    setFilteredProducts(
      products.filter((p) => p.subCategory === dropdownValue)
    );
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
        .then((response) => setProducts(response.data.data))
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
        .then((response) => setProducts(response.data.data))
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
        .then((response) => setProducts(response.data.data))
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
      <Header className="categories-header" as="h2">{name}</Header>
      {subCategories && (
        <ProductsFilteringMenu
          subCategories={subCategories}
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          setDropdownValue={setDropdownValue}
        />
      )}
      <Divider />
      <div className="products">
        {filteredProducts
          .sort((a, b) => a.choice || a.price - b.price)
          .map((p) => (
            <>
              {user && (
                <AdminCrudButtons
                  {...p}
                  product={p}
                  handleDeleteProduct={handleDeleteProduct}
                  handleChangeVisibility={handleChangeVisibility}
                  handleChangeChoice={handleChangeChoice}
                  setSelectedProduct={setSelectedProduct}
                  setOpenEditProductModal={setOpenEditProductModal}

                />
              )}
              <ProductItem key={p._id} {...p} user={user} />
            </>
          ))}
      </div>
    </Container>
  );
};

export default Categories;
