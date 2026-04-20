import React, { useState } from "react";
import { Sheet } from "../../../../design-system";
import { buildImageSrc } from "../../../../services/image";
import { WINE_COLORS } from "../../../../_const/_const";
import "./productDetail.css";

const formatPrice = (p) =>
  typeof p === "number" ? `${p.toFixed(2).replace(".", ",")}€` : "";

const ProductDetail = ({ open, onClose, product, onOpenImage }) => {
  const p = product || {};
  const imageSrc = buildImageSrc(p.image);
  const filetColor = p.type === "vins" ? (WINE_COLORS || {})[p.category] : null;

  return (
    <Sheet open={open} onClose={onClose} title={null}>
      <div className="pd">
        {imageSrc ? (
          <button
            type="button"
            className="pd-image"
            onClick={() => onOpenImage && onOpenImage(p)}
            aria-label="Agrandir l'image"
          >
            <img src={imageSrc} alt={p.name || ""} />
          </button>
        ) : (
          <div className="pd-image pd-image--empty" aria-hidden="true" />
        )}

        <div className="pd-head">
          {filetColor && (
            <span className="pd-filet" style={{ background: filetColor }} />
          )}
          {p.choice && <span className="pd-choice-badge">★ COUP DE CŒUR</span>}
          <h2 className="pd-name">{p.name}</h2>
          {p.region && <p className="pd-region">{p.region}</p>}
          <p className="pd-price">{formatPrice(p.price)}</p>
        </div>

        {p.description && <p className="pd-desc">{p.description}</p>}
      </div>
    </Sheet>
  );
};

export default ProductDetail;
