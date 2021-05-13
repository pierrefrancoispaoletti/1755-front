import React from "react";
import { Button } from "semantic-ui-react";

const AdminCrudButtons = ({
  visible,
  _id,
  choice,
  product,
  handleDeleteProduct,
  handleChangeChoice,
  handleChangeVisibility,
  setSelectedProduct,
  setOpenEditProductModal,
  setOpenUpdateImageModal
}) => {
  return (
    <div className="adminbuttons">
      <Button
        circular
        icon="remove"
        size="large"
        color="red"
        onClick={() => handleDeleteProduct(_id)}
      />
      <Button
        circular
        icon="edit"
        size="large"
        color="purple"
        onClick={() => {
          setSelectedProduct(product);
          setOpenEditProductModal(true);
        }}
      />
      <Button
        circular
        icon={visible ? "hide" : "unhide"}
        size="large"
        onClick={() => handleChangeVisibility(product)}
      />
       <Button
        circular
        icon="heart"
        size="large"
        color={choice ? "red": "grey"}
        onClick={() => handleChangeChoice(product)} />
      <Button
        circular
        icon="image"
        size="large"
        color="yellow"
        onClick={() => {
          setSelectedProduct(product);
          setOpenUpdateImageModal(true);
        }}
      />
    </div>
  );
};

export default AdminCrudButtons;
