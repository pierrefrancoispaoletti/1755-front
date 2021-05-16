import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Container,
  Form,
  Header,
  Icon,
  Modal,
} from "semantic-ui-react";
import Resizer from "react-image-file-resizer";
import { $SERVER } from "../../../../_const/_const";

const UpdateImageModal = ({
  openUpdateImageModal,
  setOpenUpdateImageModal,
  product,
  setProducts,
  setOpenLoginModal,
  setAppMessage,
}) => {
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);

  const updateFile = useRef(null);

  const { _id, name, image: productImage } = product;

  const handleChangeImage = (image) => {
    let showimage = document.querySelector(".showimage");
    let reader = new FileReader();
    if (showimage) {
      reader.onload = () => {
        showimage.src = reader.result;
      };
      reader.readAsDataURL(image);
    }
  };
  useEffect(() => {
    if (image) {
      handleChangeImage(image);
    }
  }, [image]);

  const handleSubmitImage = (e) => {
    e.preventDefault();
    let imageFormData = new FormData();
    imageFormData.append("image", image);
    const token = localStorage.getItem("token-1755");
    if (token) {
      setLoading(true);
      axios({
        method: "post",
        url: `${$SERVER}/api/products/updateProductImage/${_id}`,
        data: imageFormData,
        headers: {
          "content-type": "multipart/form-data",
          Authorization: "Bearer " + token,
        },
      })
        .then((response) => {
          if (response && response.data.status === 200) {
            setProducts(response.data.data);
            setAppMessage({
              success: response.data.status === 200 ? true : false,
              message: response.data.message,
            });
          } else {
            setAppMessage({
              success: response.data.status === 200 ? true : false,
              message: response.data.message,
            });
          }
        })
        .then(() => {
          setOpenUpdateImageModal(false);
          setImage("");
        })
        .catch((error) => console.log(error))
        .finally(() => setLoading(false));
    } else {
      setOpenUpdateImageModal(false);
      setOpenLoginModal(true);
    }
  };
  const token = localStorage.getItem("token-1755");

  const handleDeleteImage = () => {
    if (token) {
      setLoading(true);
      axios({
        method: "post",
        url: `${$SERVER}/api/products/updateProduct`,
        data: {
          update: { image: "" },
          productId: _id,
        },
        headers: {
          Authorization: "Bearer " + token,
        },
      })
        .then((response) => {
          setProducts(response.data.data);
          setAppMessage({
            success: response.data.status === 200 ? true : false,
            message: "Image supprimée avec succés",
          });
        })
        .catch((error) => console.log(error))
        .finally(() => {
          setLoading(false);
          setOpenUpdateImageModal(false);
        });
    } else {
      setOpenUpdateImageModal(false);
      setOpenLoginModal(true);
    }
  };

  const arrayBufferToBase64 = (buffer) => {
    let binary = "";
    const bytes = [].slice.call(new Uint8Array(buffer));
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return window.btoa(binary);
  };

  const base64Flag = `data:${productImage?.contentType};base64,`;
  const imageStr = arrayBufferToBase64(productImage?.data?.data);
  return (
    <Modal
      open={openUpdateImageModal}
      onClose={() => setOpenUpdateImageModal(false)}
    >
      <Header icon>
        <Icon name="image" />
        Editer l'image
      </Header>
      {(productImage || image) && (
        <Container>
          <img
            className="showimage"
            style={{ width: "100%", height: "100%" }}
            src={base64Flag + imageStr}
            alt={name}
          />
        </Container>
      )}
      <Modal.Content>
        <Form onSubmit={handleSubmitImage} id="editImage-form">
          <Form.Field>
            <input
              ref={updateFile}
              accept="image/*"
              id="addImage"
              files={image}
              type="file"
              hidden
              onChange={(e) => {
                Resizer.imageFileResizer(
                  e.target.files[0],
                  500,
                  500,
                  "JPEG",
                  100,
                  0,
                  (uri) => {
                    setImage(uri);
                  },
                  "file"
                );
              }}
            />
            <Button
              disabled={loading}
              loading={loading}
              type="button"
              onClick={() => updateFile.current.click()}
              color="orange"
              inverted
            >
              Modifier l'image
            </Button>
          </Form.Field>
        </Form>
      </Modal.Content>
      <Modal.Actions>
        {image && (
          <Button
            loading={loading}
            disabled={loading}
            color="green"
            type="submit"
            form="editImage-form"
            inverted
          >
            <Icon name="add" /> Envoyer l'image pour {name}
          </Button>
        )}
        {productImage && (
          <Button
            loading={loading}
            disabled={loading}
            type="button"
            color="red"
            form="editImage-form"
            inverted
            onClick={handleDeleteImage}
          >
            <Icon name="delete" /> Supprimer l'image pour {name}
          </Button>
        )}
        <Button
          loading={loading}
          disabled={loading}
          color="red"
          type="submit"
          form="editImage-form"
          inverted
          onClick={() => setOpenUpdateImageModal(false)}
        >
          <Icon name="remove" /> Annuler
        </Button>
      </Modal.Actions>
    </Modal>
  );
};

export default UpdateImageModal;
