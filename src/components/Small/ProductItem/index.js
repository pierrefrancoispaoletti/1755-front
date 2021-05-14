import { faHeartCircle, faSearch } from "@fortawesome/pro-duotone-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Translator, Translate } from "react-auto-translate";
import React from "react";
import { Header } from "semantic-ui-react";
import "./productitem.css";
import { GOOGLE_API_KEY } from "../../../_const/_const";

const ProductItem = ({
  product,
  _id,
  name,
  type,
  region,
  description,
  price,
  category,
  subCategory,
  choice,
  visible,
  image,
  user,
  setOpenImageModal,
  setSelectedProduct,
}) => {
  const userLang = navigator.language || navigator.userLanguage;

  const cacheProvider = {
    get: (language, key) =>
      ((JSON.parse(localStorage.getItem("translations")) || {})[key] || {})[
        language
      ],
    set: (language, key, value) => {
      const existing = JSON.parse(localStorage.getItem("translations")) || {
        [key]: {},
      };
      existing[key] = { ...existing[key], [language]: value };
      localStorage.setItem("translations", JSON.stringify(existing));
    },
  };

  return (
    <div
      className="productitem"
      style={{ display: visible ? "" : user ? "" : "none" }}
    >
      <div className="productitem-header">
        <Header
          as="h3"
          style={
            type === "vins" && category === "rouges"
              ? { color: "darkred" }
              : type === "vins" && category === "roses"
              ? { color: "#fec5d9" }
              : type === "vins" && category === "blancs"
              ? { color: "#f1f285" }
              : { color: "" }
          }
        >
          {!visible ? "Caché : " : ""}
          {name}
          {image && (
            <FontAwesomeIcon
              style={{ color: "white", margin: 8 }}
              icon={faSearch}
              onClick={() => {
                setSelectedProduct(product);
                setOpenImageModal(true);
              }}
            />
          )}
          {choice ? (
            <FontAwesomeIcon
              icon={faHeartCircle}
              style={{
                "--fa-primary-color": "darkred",
                "--fa-secondary-color": "transparent",
              }}
              size="2x"
            />
          ) : (
            ""
          )}
        </Header>
        <span className="price">
          {price.toFixed(2)}
          <small>€</small>
        </span>
      </div>
      {region && <div className="region">{region}</div>}
      {description && (
        <Translator
          cacheProvider={cacheProvider}
          from="fr"
          to={userLang.substr(0,2)}
          googleApiKey={GOOGLE_API_KEY}
        >
          <p className="description">
            <Translate>{description}</Translate>
          </p>
        </Translator>
      )}
    </div>
  );
};

export default ProductItem;
