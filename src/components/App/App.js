/* eslint-disable no-unused-vars */
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Route, Switch } from "react-router";
import { Container, Divider, Message, Transition } from "semantic-ui-react";
import Categories from "../../pages/Categories";
import Home from "../../pages/Home";
import { $SERVER } from "../../_const/_const";
import ImageModal from "../Medium/Modals/ImageModal";
import Login from "../Medium/Modals/Login";
import Copyright from "../Small/Copyright";
import Loader from "../Small/Loader";
import TopAppBar from "../Small/TopAppBar";
import "./App.css";
import BottomAppBar from "../Small/BottomAppBar";
import RequireAuth from "../Small/RequireAuth";
import AdminHome from "../../pages/Admin/Home";
import AdminCategories from "../../pages/Admin/Categories";
import AdminProducts from "../../pages/Admin/Products";
import AdminEvents from "../../pages/Admin/Events";
import AdminThemes from "../../pages/Admin/Themes";
import "../../design-system";

const App = () => {
  const [selectedCategory, setSelectedCategory] = useState({});
  const [activeMenu, setActiveMenu] = useState("");
  const [dropdownValue, setDropdownValue] = useState("");
  const [user, setUser] = useState("");
  const [openLoginModal, setOpenLoginModal] = useState(false);
  const [openImageModal, setOpenImageModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState({});
  const [products, setProducts] = useState([]);
  const [appMessage, setAppMessage] = useState({});
  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState({});
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [eventLoading, setEventLoading] = useState(false);
  const [productsVersion, setProductsVersion] = useState(0);

  useEffect(() => {
    if (Object.keys(appMessage).length !== 0) {
      setTimeout(() => {
        setAppMessage({});
      }, 5000);
    }
  }, [appMessage]);
  useEffect(() => {
    if (!user) {
      setProducts([]);
      setLoading(false);
      return;
    }
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
  }, [user]);

  useEffect(() => {
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
      className='App ds-root'
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
        <TopAppBar />
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
              <Home event={event} />
            </Route>
            <Route path='/categories/:categorie'>
              <ImageModal
                openImageModal={openImageModal}
                setOpenImageModal={setOpenImageModal}
                product={selectedProduct}
              />
              <Categories
                filteredProducts={filteredProducts}
                setFilteredProducts={setFilteredProducts}
                productsVersion={productsVersion}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                dropdownValue={dropdownValue}
                setDropdownValue={setDropdownValue}
                setOpenImageModal={setOpenImageModal}
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
            <Route exact path="/admin">
              <RequireAuth user={user}>
                <AdminHome user={user} setUser={setUser} />
              </RequireAuth>
            </Route>
            <Route path="/admin/products">
              <RequireAuth user={user}>
                <AdminProducts
                  user={user}
                  setAppMessage={setAppMessage}
                  setOpenLoginModal={setOpenLoginModal}
                  productsVersion={productsVersion}
                  setProductsVersion={setProductsVersion}
                />
              </RequireAuth>
            </Route>
            <Route exact path="/admin/categories">
              <RequireAuth user={user}>
                <AdminCategories />
              </RequireAuth>
            </Route>
            <Route exact path="/admin/categories/:parentId">
              <RequireAuth user={user}>
                <AdminCategories />
              </RequireAuth>
            </Route>
            <Route path="/admin/events">
              <RequireAuth user={user}>
                <AdminEvents setAppMessage={setAppMessage} setOpenLoginModal={setOpenLoginModal} />
              </RequireAuth>
            </Route>
            <Route path="/admin/themes">
              <RequireAuth user={user}>
                <AdminThemes setAppMessage={setAppMessage} />
              </RequireAuth>
            </Route>
          </Switch>
          <Divider />
          <Copyright />
        <BottomAppBar user={user} setOpenLoginModal={setOpenLoginModal} />
      </>
    </div>
  );
};

export default App;
