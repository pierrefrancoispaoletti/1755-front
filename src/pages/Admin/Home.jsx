import React from "react";
import { Button } from "../../design-system";
import "./admin.css";

const AdminHome = ({ user, setUser }) => {
  const handleLogout = () => {
    localStorage.removeItem("jwt");
    setUser("");
  };
  return (
    <div className="ds-root admin-page">
      <h1>Administration</h1>
      <p className="subtitle">
        Connecté en tant que {user?.username || "admin"}. Choisis une section
        dans la barre du bas.
      </p>
      <div className="admin-placeholder">
        Sélectionne Produits, Catégories, Events ou Thèmes.
      </div>
      <div className="admin-logout">
        <Button variant="ghost" onClick={handleLogout}>
          Déconnexion
        </Button>
      </div>
    </div>
  );
};

export default AdminHome;
