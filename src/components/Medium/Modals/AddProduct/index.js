/* eslint-disable react-hooks/exhaustive-deps */
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { Button, Form, Header, Icon, Modal, Radio } from "semantic-ui-react";
import categories from "../../../../datas/categories";
import { $SERVER } from "../../../../_const/_const";

const AddProductModal = ({
  selectedCategory,
  setAppMessage,
  openAddProductModal,
  setOpenAddProductModal,
  setOpenLoginModal,
  setProducts,
}) => {
  const [product, setProduct] = useState({
    name: "",
    region: "",
    description: "",
    price: "",
    type: "",
    category: "",
    subCategory: "",
    choice: false,
    visible: true,
    image: "",
  });

  const [loading, setLoading] = useState(false);
  const inputFile = useRef(null);

  useEffect(() => {
    setProduct({ ...product, type: selectedCategory.slug });
  }, [selectedCategory]);

  const changeProduct = (e) => {
    let updatedValue = {};
    updatedValue[e.target.name] = e.target.value;
    setProduct({ ...product, ...updatedValue });
  };

  const setImage = (e) => {
    setProduct({ ...product, image: e.target.files[0] });
  };

  const token = localStorage.getItem("token-1755");

  const onChangeTypeRadio = (value) => {
    let selectedCheckboxes = product.type;

    selectedCheckboxes = value;

    setProduct({ ...product, type: selectedCheckboxes });
  };

  const onChangeCategoryRadio = (value) => {
    let selectedCheckboxes = product.category;

    selectedCheckboxes = value;

    setProduct({ ...product, category: selectedCheckboxes });
  };

  const onChangeSubCategoryRadio = (value) => {
    let selectedCheckboxes = product.subCategory;

    selectedCheckboxes = value;

    setProduct({ ...product, subCategory: selectedCheckboxes });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let formData = new FormData();
    formData.append("name", product.name);
    formData.append("description", product.description || "");
    formData.append("region", product.region || "");
    formData.append("price", product.price);
    formData.append("type", product.type);
    formData.append("category", product.category || "");
    formData.append("subCategory", product.subCategory || "");
    formData.append("choice", product.choice || false);
    formData.append("visible", product.visible || true);
    formData.append("image", product.image || "");
    if (token) {
      setLoading(true);
      axios({
        method: "post",
        url: `${$SERVER}/api/products/createProduct`,
        data: formData,
        headers: {
          "content-type": "multipart/form-data",
          Authorization: "Bearer " + token,
        },
      })
        .then((response) => {
          setProducts(response.data.data);
          setAppMessage({
            success: response.data.status === 200 ? true : false,
            message: response.data.message,
          });
        })
        .then(() => {
          setProduct({
            name: "",
            region: "",
            description: "",
            price: "",
            type: "",
            category: "",
            subCategory: "",
            choice: false,
            visible: true,
            image: "",
          });
          setOpenAddProductModal(false);
        })
        .catch((error) => console.log(error))
        .finally(() => {
          setLoading(false);
        });
    } else {
      setOpenLoginModal(true);
    }
  };

  return (
    <Modal
      onClose={() => setOpenAddProductModal(false)}
      onOpen={() => setOpenAddProductModal(true)}
      open={openAddProductModal}
      size="small"
    >
      <Header icon>
        <Icon name="add" />
        Ajouter un Produit
      </Header>
      <Modal.Content>
        <Form onSubmit={handleSubmit} id="addProduct-form">
          <Form.Field>
            <label>Nom du Produit</label>
            <input
              value={product.name}
              name="name"
              type="text"
              onChange={(e) => changeProduct(e)}
            />
          </Form.Field>
          <Form.Field>
            <label>Description</label>
            <textarea
              value={product.description}
              name="description"
              rows="5"
              cols="33"
              onChange={(e) => changeProduct(e)}
            />
          </Form.Field>
          <Form.Field>
            <label>Région</label>
            <input
              value={product.region}
              name="region"
              type="text"
              onChange={(e) => changeProduct(e)}
            />
          </Form.Field>
          <Form.Field>
            <label>Prix</label>
            <input
              min={1}
              step={0.1}
              value={product.price}
              name="price"
              type="number"
              onChange={(e) => changeProduct(e)}
            />
          </Form.Field>
          <Form.Field>
            <label>Type de Produit</label>
            {categories.map(
              (cat) =>
                cat.slug && (
                  <Radio
                    style={{ padding: 5 }}
                    key={cat.slug}
                    label={cat.name}
                    name={cat.slug}
                    value={cat.slug}
                    onChange={() => onChangeTypeRadio(cat.slug)}
                    checked={product.type === cat.slug}
                  />
                )
            )}
          </Form.Field>
          {(product.type === "vins" || product.type === "alcools") && (
            <Form.Field>
              <label>Categorie de Produit</label>
              {categories.map(
                (cat) =>
                  cat["slug"] === product.type &&
                  cat.subCategories?.map((subC) => (
                    <Radio
                      style={{ padding: 5 }}
                      key={subC.slug}
                      label={subC.name}
                      name={subC.slug}
                      value={subC.slug}
                      onChange={() => onChangeCategoryRadio(subC.slug)}
                      checked={product.category === subC.slug}
                    />
                  ))
              )}
            </Form.Field>
          )}
          {(product.category === "rouges" ||
            product.category === "premiums") && (
            <Form.Field>
              <label>Sous Catégorie de Produit</label>
              {categories.map(
                (cat) =>
                  cat["slug"] === product.type &&
                  cat.subCategories?.map(
                    (subC) =>
                      subC["slug"] === product.category &&
                      subC.subCat.map((sC) => (
                        <Radio
                          style={{ padding: 5 }}
                          key={sC.slug}
                          label={sC.name}
                          name={sC.slug}
                          value={sC.slug}
                          onChange={() => onChangeSubCategoryRadio(sC.slug)}
                          checked={product.subCategory === sC.slug}
                        />
                      ))
                  )
              )}
            </Form.Field>
          )}
          <Form.Field>
            <label>Choix du Patron ?</label>
            <Radio
              toggle
              checked={product.choice}
              onChange={() =>
                setProduct({ ...product, choice: !product.choice })
              }
            />
          </Form.Field>
          <Form.Field>
            <input
              ref={inputFile}
              accept="image/*"
              id="addImage"
              files={product.image}
              type="file"
              hidden
              onChange={(e) => setImage(e)}
            />
            <Button
              type="button"
              onClick={() => inputFile.current.click()}
              color="orange"
              inverted
            >
              Ajouter une image
            </Button>
          </Form.Field>
        </Form>
      </Modal.Content>
      <Modal.Actions>
        <Button color="green" type="submit" form="addProduct-form" inverted>
          <Icon name="add" /> Ajouter
        </Button>
        <Button
          loading={loading}
          color="red"
          type="submit"
          form="addProduct-form"
          inverted
          onClick={() => setOpenAddProductModal(false)}
        >
          <Icon name="remove" /> Annuler
        </Button>
      </Modal.Actions>
    </Modal>
  );
};

export default AddProductModal;
