import { faHeartCircle, faSearch } from "@fortawesome/pro-duotone-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { Header } from "semantic-ui-react";
import "./productitem.css";

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
      <div className="region">
        {region}
      </div>
      <p className="description">
        {description}
      </p>
    </div>
  );
};

export default ProductItem;
