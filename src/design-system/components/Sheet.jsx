import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import "./Sheet.css";

const Sheet = ({ open, onClose, title, children, footer }) => {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;
  // Portal mount sur document.body pour échapper à tout parent avec transform
  // (Semantic UI Sidebar.Pushable casse position: fixed sinon).
  return ReactDOM.createPortal(
    <div className="ds-root ds-sheet__overlay" onClick={onClose}>
      <div className="ds-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="ds-sheet__handle" />
        {title && <div className="ds-sheet__header">{title}</div>}
        <div className="ds-sheet__body">{children}</div>
        {footer && <div className="ds-sheet__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

export default Sheet;
