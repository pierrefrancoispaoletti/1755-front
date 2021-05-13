/* eslint-disable no-unused-vars */
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Route, Switch } from "react-router";
import { Divider } from "semantic-ui-react";
import Categories from "../../pages/Categories";
import Home from "../../pages/Home";
import { $SERVER } from "../../_const/_const";
import AddProductModal from "../Medium/Modals/AddProduct";
import EditProductModal from "../Medium/Modals/EditProduct";
import Login from "../Medium/Modals/Login";
import CategoriesSidebar from "../Small/CategoriesSidebar";
import Copyright from "../Small/Copyright";
import TopAppBar from "../Small/TopAppBar";
import "./App.css";

const App = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState({});
  const [user, setUser] = useState("");
  const [openLoginModal, setOpenLoginModal] = useState(false);
  const [openAddProductModal, setOpenAddProductModal] = useState(false);
  const [openEditProductModal, setOpenEditProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState({});
  const [products, setProducts] = useState([]);
  const [appMessage, setAppMessage] = useState({});

  useEffect(() => {
    axios.get(`${$SERVER}/api/products/allProducts`).then((response) => {
      if (response) {
        setProducts(response.data.data);
      }
    });
  }, []);

  return (
    <div className="App">
      <CategoriesSidebar
        sidebarVisible={sidebarVisible}
        setSidebarVisible={setSidebarVisible}
        setSelectedCategory={setSelectedCategory}
      >
        <TopAppBar
          user={user}
          setSidebarVisible={setSidebarVisible}
          setOpenLoginModal={setOpenLoginModal}
        />
        <Divider hidden />
        <Login
          setUser={setUser}
          openLoginModal={openLoginModal}
          setOpenLoginModal={setOpenLoginModal}
          setAppMessage={setAppMessage}
        />
        <Switch>
          <Route exact path="/">
            <Home />
          </Route>
          <Route path="/categories/:categorie">
            <AddProductModal
              setProducts={setProducts}
              selectedCategory={selectedCategory}
              setOpenLoginModal={setOpenLoginModal}
              setAppMessage={setAppMessage}
              openAddProductModal={openAddProductModal}
              setOpenAddProductModal={setOpenAddProductModal}
            />
            <EditProductModal
              product={selectedProduct}
              setOpenEditProductModal={setOpenEditProductModal}
              setAppMessage={setAppMessage}
              setOpenLoginModal={setOpenLoginModal}
              openEditProductModal={openEditProductModal}
              setProducts={setProducts}
            />
            <Categories
              user={user}
              selectedCategory={selectedCategory}
              setOpenLoginModal={setOpenLoginModal}
              products={products}
              setProducts={setProducts}
              setOpenAddProductModal={setOpenAddProductModal}
              setSelectedProduct={setSelectedProduct}
              setOpenEditProductModal={setOpenEditProductModal}
            />
          </Route>
        </Switch>
        <Divider />
        <Copyright />
      </CategoriesSidebar>
    </div>
  );
};

export default App;
