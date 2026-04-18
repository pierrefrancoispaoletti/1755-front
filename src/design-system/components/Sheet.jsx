import React, { useEffect } from "react";
import "./Sheet.css";

const Sheet = ({ open, onClose, title, children, footer }) => {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;
  return (
    <div className="ds-root ds-sheet__overlay" onClick={onClose}>
      <div className="ds-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="ds-sheet__handle" />
        {title && <div className="ds-sheet__header">{title}</div>}
        <div className="ds-sheet__body">{children}</div>
        {footer && <div className="ds-sheet__footer">{footer}</div>}
      </div>
    </div>
  );
};

export default Sheet;
