import React from "react";
import "./admin.css";

const AdminPlaceholder = ({ title, description }) => (
  <div className="ds-root admin-page">
    <h1>{title}</h1>
    <p className="subtitle">{description}</p>
    <div className="admin-placeholder">
      Section en cours de construction.
    </div>
  </div>
);

export default AdminPlaceholder;
