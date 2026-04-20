import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";
import { buildImageSrc } from "../../../../services/image";
import "./imageLightbox.css";

const formatPrice = (p) =>
  typeof p === "number" ? `${p.toFixed(2).replace(".", ",")}€` : "";

const ImageLightbox = ({ openImageModal, setOpenImageModal, product }) => {
  useEffect(() => {
    if (!openImageModal) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpenImageModal(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [openImageModal, setOpenImageModal]);

  if (!openImageModal || !product) return null;

  const { image, name, price } = product;
  const src = buildImageSrc(image);

  return ReactDOM.createPortal(
    <div
      className="ds-root lb-overlay"
      onClick={() => setOpenImageModal(false)}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="lb-close"
        aria-label="Fermer"
        onClick={(e) => { e.stopPropagation(); setOpenImageModal(false); }}
      >
        <X size={28} />
      </button>
      {src && (
        <img
          src={src}
          alt={name || ""}
          className="lb-image"
          onClick={(e) => e.stopPropagation()}
        />
      )}
      <div className="lb-caption" onClick={(e) => e.stopPropagation()}>
        {name && <div className="lb-name">{name}</div>}
        {typeof price === "number" && <div className="lb-price">{formatPrice(price)}</div>}
      </div>
    </div>,
    document.body
  );
};

export default ImageLightbox;
