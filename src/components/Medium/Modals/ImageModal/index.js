import React from "react";
import { Header, Modal } from "semantic-ui-react";

const ImageModal = ({ openImageModal, setOpenImageModal, product }) => {
  const { image, name } = product;

  const arrayBufferToBase64 = (buffer) => {
    let binary = "";
    const bytes = [].slice.call(new Uint8Array(buffer));
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return window.btoa(binary);
  };

  const base64Flag = `data:${image?.contentType};base64,`;
  const imageStr = arrayBufferToBase64(image?.data?.data);
  return (
    <Modal
      closeIcon
      basic
      open={openImageModal}
      onClose={() => setOpenImageModal(false)}
    >
      <Header>{name}</Header>
      <Modal.Content>
        <img
          style={{ width: "100%" }}
          src={base64Flag + imageStr}
          alt={name}
        />
      </Modal.Content>
    </Modal>
  );
};

export default ImageModal;
