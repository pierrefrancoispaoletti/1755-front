/* eslint-disable no-unused-vars */
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Route, Switch } from "react-router";
import { Divider, Message, Transition } from "semantic-ui-react";
import Categories from "../../pages/Categories";
import Home from "../../pages/Home";
import { $SERVER } from "../../_const/_const";
import AddProductModal from "../Medium/Modals/AddProduct";
import EditProductModal from "../Medium/Modals/EditProduct";
import ImageModal from "../Medium/Modals/ImageModal";
import Login from "../Medium/Modals/Login";
import UpdateImageModal from "../Medium/Modals/UpdateImageModal";
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
  const [openImageModal, setOpenImageModal] = useState(false);
  const [openUpdateImageModal, setOpenUpdateImageModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState({});
  const [products, setProducts] = useState([]);
  const [appMessage, setAppMessage] = useState({});

  useEffect(() => {
    if (Object.keys(appMessage).length !== 0) {
      setTimeout(() => {
        setAppMessage({});
      }, 5000);
    }
  }, [appMessage]);

  useEffect(() => {
    axios.get(`${$SERVER}/api/products/allProducts`).then((response) => {
      if (response) {
        setProducts(response.data.data);
      }
    });
  }, []);

  return (
    <div className="App">
      <Transition
        animation="jiggle"
        duration={500}
        visible={Object.keys(appMessage).length > 0}
      >
        <Message
          style={{ position: "fixed", top:15, zIndex: "1000", width: "100%" }}
          hidden={Object.keys(appMessage).length === 0}
          success={appMessage.success ? true : false}
          error={!appMessage.success ? true : false}
        >
          {appMessage.message}
        </Message>
      </Transition>
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
            <UpdateImageModal
              openUpdateImageModal={openUpdateImageModal}
              setOpenUpdateImageModal={setOpenUpdateImageModal}
              setProducts={setProducts}
              product={selectedProduct}
              setOpenLoginModal={setOpenLoginModal}
              setAppMessage={setAppMessage}
            />
            <ImageModal
              openImageModal={openImageModal}
              setOpenImageModal={setOpenImageModal}
              product={selectedProduct}
            />
            <Categories
              user={user}
              selectedCategory={selectedCategory}
              products={products}
              setProducts={setProducts}
              setOpenLoginModal={setOpenLoginModal}
              setOpenAddProductModal={setOpenAddProductModal}
              setOpenImageModal={setOpenImageModal}
              setOpenUpdateImageModal={setOpenUpdateImageModal}
              setOpenEditProductModal={setOpenEditProductModal}
              setSelectedProduct={setSelectedProduct}
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
