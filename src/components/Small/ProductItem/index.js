import React from "react";
import "./productitem.css";

const WINE_FILET = {
  rouges: "#6B1A2C",
  roses: "#8a5560",
  blancs: "#9a7a32",
};

const arrayBufferToBase64 = (buffer) => {
  let binary = "";
  const bytes = [].slice.call(new Uint8Array(buffer));
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return window.btoa(binary);
};

const formatPrice = (p) => {
  if (typeof p !== "number") return "";
  return `${p.toFixed(2).replace(".", ",")}€`;
};

const ProductItem = ({
  product,
  setOpenImageModal,
  setSelectedProduct,
}) => {
  if (!product || !product.visible) return null;

  const { name, type, region, description, price, category, choice, image } = product;

  const filetColor = type === "vins" ? WINE_FILET[category] : null;

  let imageSrc = null;
  if (image?.data?.data) {
    imageSrc = `data:${image.contentType};base64,${arrayBufferToBase64(image.data.data)}`;
  }

  const openImage = (e) => {
    e.stopPropagation();
    if (!imageSrc) return;
    setSelectedProduct(product);
    setOpenImageModal(true);
  };

  const regionLine = [region, product.year].filter(Boolean).join(" · ");

  const Wrapper = choice ? "article" : "div";
  const rootClass = choice ? "pi pi--choice" : "pi";

  return (
    <Wrapper className={rootClass}>
      {filetColor && <span className="pi-filet" style={{ background: filetColor }} />}
      {choice && <span className="pi-choice-badge">★ COUP DE CŒUR</span>}
      {imageSrc && (
        <button
          type="button"
          className="pi-thumb"
          onClick={openImage}
          aria-label={`Voir la photo de ${name}`}
        >
          <img src={imageSrc} alt={name} />
        </button>
      )}
      <div className="pi-body">
        <div className="pi-name">{name}</div>
        {regionLine && <div className="pi-region">{regionLine}</div>}
        {description && <p className="pi-desc">{description}</p>}
      </div>
      <div className="pi-price">{formatPrice(price)}</div>
    </Wrapper>
  );
};

export default ProductItem;
