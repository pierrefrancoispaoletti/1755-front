import React, { useEffect, useState } from "react";
import axios from "axios";
import { $SERVER } from "../../_const/_const";
import { ListItem } from "../../design-system";
import "./admin.css";

const Themes = ({ setAppMessage }) => {
  const [themes, setThemes] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${$SERVER}/api/themes/allThemes`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token-1755")}` },
        });
        setThemes(Array.isArray(data?.data) ? data.data : []);
      } catch (e) {
        setAppMessage && setAppMessage({ negative: true, header: "Erreur", content: e.message });
      }
    })();
  }, [setAppMessage]);

  return (
    <div className="ds-root admin-page">
      <h1 style={{ margin: 0 }}>Thèmes</h1>
      <p className="subtitle">Liste des thèmes visuels (édition à compléter).</p>
      {themes.length === 0 && <div style={{ color: "var(--ds-text-muted)" }}>Aucun thème trouvé.</div>}
      {themes.map((t) => (
        <ListItem
          key={t._id || t.slug || t.name}
          icon="Palette"
          title={t.name || t.slug || "Thème"}
          subtitle={t.active ? "actif" : ""}
        />
      ))}
    </div>
  );
};

export default Themes;
