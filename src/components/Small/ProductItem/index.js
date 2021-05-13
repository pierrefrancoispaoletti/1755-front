import { faHeartCircle } from "@fortawesome/pro-duotone-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { Header } from "semantic-ui-react";
import "./productitem.css"

const ProductItem = ({
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
  user,
}) => {
  return (
    <div className="productitem" style={{display: visible ? "" : user ? "" : "none"}}>
      <div className="productitem-header">
        <Header as="h3" style={(type === "vins" && category === "rouges") ? { color: "darkred"} : (type === "vins" && category === "roses") ? { color: "#fec5d9"} : (type === "vins" && category === "blancs") ? { color: "#f1f285"} : { color: ""} }>
          {!visible ? "Caché : " : ""}{name}
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
        <span>
          {price.toFixed(2)} <small>€</small>
        </span>
      </div>
      <div>{region}</div>
      <div>{description}</div>
    </div>
  );
};

export default ProductItem;
