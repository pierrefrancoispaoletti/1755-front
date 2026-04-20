import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import Resizer from "react-image-file-resizer";
import { Button, Sheet } from "../../../../design-system";
import { buildImageSrc } from "../../../../services/image";
import { $SERVER, COMPRESSION_QUALITY } from "../../../../_const/_const";
import "../AddProduct/productModal.css";

const UpdateImageModal = ({
  openUpdateImageModal,
  setOpenUpdateImageModal,
  product,
  setProducts,
  setProductsVersion,
  setOpenLoginModal,
  setAppMessage,
}) => {
  const [image, setImage] = useState("");
  const [previewSrc, setPreviewSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const updateFile = useRef(null);

  const { _id, name, image: productImage } = product || {};

  useEffect(() => {
    if (!image) {
      setPreviewSrc(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreviewSrc(reader.result);
    reader.readAsDataURL(image);
  }, [image]);

  useEffect(() => {
    if (!openUpdateImageModal) {
      setImage("");
      setPreviewSrc(null);
    }
  }, [openUpdateImageModal]);

  const onClose = () => setOpenUpdateImageModal(false);

  const currentImageSrc = previewSrc || buildImageSrc(productImage);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Resizer.imageFileResizer(
      file,
      363,
      360,
      "JPEG",
      COMPRESSION_QUALITY,
      0,
      (uri) => setImage(uri),
      "file",
    );
  };

  const handleSubmitImage = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token-1755");
    if (!token) {
      setOpenUpdateImageModal(false);
      setOpenLoginModal(true);
      return;
    }
    const formData = new FormData();
    formData.append("image", image);
    setLoading(true);
    axios({
      method: "post",
      url: `${$SERVER}/api/products/updateProductImage/${_id}`,
      data: formData,
      headers: {
        "content-type": "multipart/form-data",
        Authorization: "Bearer " + token,
      },
    })
      .then((response) => {
        if (response?.data?.status === 200) {
          setProducts(response.data.data);
          setProductsVersion?.((v) => v + 1);
        }
        setAppMessage({
          success: response.data.status === 200,
          message: response.data.message,
        });
        setOpenUpdateImageModal(false);
        setImage("");
      })
      .catch(() =>
        setAppMessage({
          success: false,
          message: "Il y a eu un probleme, veuillez reessayer",
        }),
      )
      .finally(() => setLoading(false));
  };

  const handleDeleteImage = () => {
    const token = localStorage.getItem("token-1755");
    if (!token) {
      setOpenUpdateImageModal(false);
      setOpenLoginModal(true);
      return;
    }
    setLoading(true);
    axios({
      method: "post",
      url: `${$SERVER}/api/products/updateProduct`,
      data: { update: { image: "" }, productId: _id },
      headers: { Authorization: "Bearer " + token },
    })
      .then((response) => {
        setProducts(response.data.data);
        setProductsVersion?.((v) => v + 1);
        setAppMessage({
          success: response.data.status === 200,
          message: "Image supprimée avec succés",
        });
      })
      .catch(() =>
        setAppMessage({
          success: false,
          message: "Il y a eu un probleme, veuillez reessayer",
        }),
      )
      .finally(() => {
        setLoading(false);
        setOpenUpdateImageModal(false);
      });
  };

  return (
    <Sheet
      open={openUpdateImageModal}
      onClose={onClose}
      title={<h2 className="pm-title">Image — {name}</h2>}
    >
      <form id="editImage-form" onSubmit={handleSubmitImage} className="pm-form">
        {currentImageSrc && (
          <div className="pm-image-preview">
            <img src={currentImageSrc} alt={name || ""} />
          </div>
        )}

        <input
          ref={updateFile}
          type="file"
          accept="image/*"
          hidden
          onChange={handleFile}
        />
        <button
          type="button"
          className="pm-file-btn"
          onClick={() => updateFile.current.click()}
          disabled={loading}
        >
          {image ? "Image sélectionnée — changer" : "Choisir une image"}
        </button>

        <div className="pm-actions">
          {image && (
            <Button
              variant="primary"
              type="submit"
              disabled={loading}
              block
            >
              {loading ? "Envoi…" : "Envoyer la nouvelle image"}
            </Button>
          )}
          {productImage && (
            <button
              type="button"
              className="pm-action-danger"
              disabled={loading}
              onClick={handleDeleteImage}
            >
              Supprimer l'image actuelle
            </button>
          )}
          <button
            type="button"
            className="pm-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </button>
        </div>
      </form>
    </Sheet>
  );
};

export default UpdateImageModal;
