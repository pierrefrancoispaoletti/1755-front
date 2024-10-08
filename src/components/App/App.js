/* eslint-disable no-unused-vars */
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Route, Switch } from "react-router";
import { Container, Divider, Message, Transition } from "semantic-ui-react";
import Categories from "../../pages/Categories";
import Home from "../../pages/Home";
import { $SERVER, COLOR_1755, COLOR_ACARCIARA } from "../../_const/_const";
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
import { isBefore18h } from "../../datas/utils";

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
    const backgroundColor = isBefore18h() ? COLOR_ACARCIARA : COLOR_1755;
    document.body.style.background = backgroundColor;

    const elementsToUpdate = [
      ".ui.segment",
      ".App",
      ".loader",
      ".categories",
      ".topappbar",
    ];

    elementsToUpdate.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        element.style.backgroundColor = backgroundColor;
      });
    });
  });

  useEffect(() => {
    if (Object.keys(appMessage).length !== 0) {
      setTimeout(() => {
        setAppMessage({});
      }, 5000);
    }
  }, [appMessage]);
  useEffect(() => {
    setLoading(true);
    fetch(`${$SERVER}/api/products/allProducts`)
      .then((response) => {
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let productsData = "";

        reader.read().then(function processText({ done, value }) {
          if (done) {
            setProducts(JSON.parse(productsData).data);
            return;
          }
          productsData += decoder.decode(value, { stream: true });
          return reader.read().then(processText);
        });
      })
      .catch((error) => {
        console.error("Erreur lors de la récupération des produits:", error);
        setAppMessage({
          success: false,
          message: "Il y a eu un probléme, veuillez recharger la page",
        });
      })
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
    <div
      className='App'
      style={{ position: "relative" }}
    >
      <>
        <Transition
          animation='jiggle'
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
          user={user}
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
            <Route
              exact
              path='/'
            >
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
            <Route path='/categories/:categorie'>
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
            <Route path='/confidentialite-de-lapp'>
              <Container
                style={{
                  color: "white",
                  fontSize: "1.5em",
                  textAlign: "center",
                  lineHeight: "1.5em",
                }}
              >
                <h2>Engagement de confidentialité</h2>
                La protection de vos données est importante pour le Baravin1755
                Le présent engagement de confidentialité s’applique à la façon
                dont nous collectons, utilisons, divulguons, transférons et
                conservons vos données. Veuillez prendre le temps de vous
                familiariser avec nos pratiques en matière de protection des
                données à caractère personnel et contactez-nous si vous avez des
                questions.
                <h2>
                  Collecte et utilisation des données à caractère personnel
                </h2>
                Les données personnelles (ou « informations personnelles ») sont
                des données qui peuvent être utilisées pour identifier de
                manière unique ou contacter une seule personne.
                <h2>
                  Collecte et utilisation des données à caractère non-
                  Divulgation à des tiers
                </h2>
                Aucune donnée n’est divulguée a des tiers.
                <h2>Protection des données à caractère personnels</h2>
                Le Baravin1755 prend des précautions – y compris des mesures
                administratives, techniques et physiques – pour protéger vos
                données personnelles contre la perte, le vol et la mauvaise
                utilisation, ainsi que l’accès, la divulgation, l’altération et
                la destruction non autorisés.
                <h2>
                  Intégrité et conservation des données à caractère personnel
                </h2>
                Vos données ne sont pas conservées, dés que votre réservation
                est traitée (que vous recevez le mail de confirmation), vos
                données sont effacées de nos serveurs de façon programmatique.
                <h2>Questions sur la confidentialité</h2>
                Si vous avez des questions ou des inquiétudes concernant le
                traitement de vos données ou l’Engagement de confidentialité
                d’Apple, contactez-nous.
              </Container>
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
