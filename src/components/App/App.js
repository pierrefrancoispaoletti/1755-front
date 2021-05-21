/* eslint-disable no-unused-vars */
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Route, Switch } from "react-router";
import { Divider, Message, Transition } from "semantic-ui-react";
import Categories from "../../pages/Categories";
import Home from "../../pages/Home";
import { $SERVER } from "../../_const/_const";
import AddEventModal from "../Medium/Modals/AddEvent";
import AddProductModal from "../Medium/Modals/AddProduct";
import EditProductModal from "../Medium/Modals/EditProduct";
import ImageModal from "../Medium/Modals/ImageModal";
import Login from "../Medium/Modals/Login";
import UpdateImageModal from "../Medium/Modals/UpdateImageModal";
import CategoriesSidebar from "../Small/CategoriesSidebar";
import Copyright from "../Small/Copyright";
import Loader from "../Small/Loader";
import TopAppBar from "../Small/TopAppBar";
import "./App.css";

const App = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState({});
  const [activeMenu, setActiveMenu] = useState("");
  const [dropdownValue, setDropdownValue] = useState("");
  const [user, setUser] = useState("");
  const [openLoginModal, setOpenLoginModal] = useState(false);
  const [openAddProductModal, setOpenAddProductModal] = useState(false);
  const [openEditProductModal, setOpenEditProductModal] = useState(false);
  const [openImageModal, setOpenImageModal] = useState(false);
  const [openUpdateImageModal, setOpenUpdateImageModal] = useState(false);
  const [openAddEventModal, setOpenAddEventModal] = useState(false);
  const [openEditEventModal, setOpenEditEventModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState({});
  const [products, setProducts] = useState([]);
  const [appMessage, setAppMessage] = useState({});
  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState({});
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [eventLoading, setEventLoading] = useState(false);

  useEffect(() => {
    if (Object.keys(appMessage).length !== 0) {
      setTimeout(() => {
        setAppMessage({});
      }, 5000);
    }
  }, [appMessage]);
  useEffect(() => {
    setLoading(true);
    axios
      .get(`${$SERVER}/api/products/allProducts`)
      .then((response) => {
        if (response) {
          setProducts(response.data.data);
        }
      })
      .catch((error) =>
        setAppMessage({
          success: false,
          message: "Il y a eu un probléme, veuillez recharger la page",
        })
      )
      .finally(() => setLoading(false));

    setEventLoading(true);
    axios
      .get(`${$SERVER}/api/events/getEvent`)
      .then((response) => {
        if (response) {
          setEvent(response.data.data);
        }
      })
      .catch((error) => {
        setAppMessage({
          success: false,
          message: "Il y a eu un probléme, veuillez recharger la page",
        });
      })
      .finally(() => setEventLoading(false));
  }, []);

  return (
    <div className="App" style={{ position: "relative" }}>
      <>
        <Transition
          animation="jiggle"
          duration={500}
          visible={Object.keys(appMessage).length > 0}
        >
          <Message
            style={{
              position: "fixed",
              top: 15,
              zIndex: "1000",
              width: "100%",
            }}
            hidden={Object.keys(appMessage).length === 0}
            success={appMessage.success ? true : false}
            error={!appMessage.success ? true : false}
          >
            {appMessage.message}
          </Message>
        </Transition>
        <CategoriesSidebar
        setActiveMenu={setActiveMenu}
        setDropdownValue={setDropdownValue}
        selectedCategory={selectedCategory}
          setFilteredProducts={setFilteredProducts}
          products={products}
          sidebarVisible={sidebarVisible}
          setSidebarVisible={setSidebarVisible}
          setSelectedCategory={setSelectedCategory}
        >
          <TopAppBar
          setSelectedCategory={setSelectedCategory}
            loading={loading}
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
              <AddEventModal
                setEvent={setEvent}
                setAppMessage={setAppMessage}
                setOpenLoginModal={setOpenLoginModal}
                openAddEventModal={openAddEventModal}
                setOpenAddEventModal={setOpenAddEventModal}
              />
              <Home
                user={user}
                event={event}
                setEvent={setEvent}
                setOpenLoginModal={setOpenLoginModal}
                setOpenAddEventModal={setOpenAddEventModal}
                setOpenEditEventModal={setOpenEditEventModal}
              />
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
                filteredProducts={filteredProducts}
                setFilteredProducts={setFilteredProducts}
                user={user}
                selectedCategory={selectedCategory}
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                dropdownValue={dropdownValue}
                setDropdownValue={setDropdownValue}
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
      </>
    </div>
  );
};

export default App;
