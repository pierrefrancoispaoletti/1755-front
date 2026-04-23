import React from "react";
import { Button, ICON_MAP } from "../../../design-system";

const ResaSwitch = ({ resaOpen, onToggle, loading }) => (
  <div style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "var(--ds-space-3, 12px)",
    background: "var(--ds-bg-elevated, #241820)",
    borderRadius: "var(--ds-radius-md, 16px)",
    marginBottom: "var(--ds-space-3, 12px)",
  }}>
    <span style={{ color: "var(--ds-text-primary, #F5EFE8)" }}>
      Réservations {resaOpen ? "ouvertes" : "fermées"}
    </span>
    <Button variant={resaOpen ? "danger" : "primary"} onClick={onToggle} disabled={loading}>
      {resaOpen ? <><ICON_MAP.Lock size={14} /> Fermer</> : <><ICON_MAP.Unlock size={14} /> Ouvrir</>}
    </Button>
  </div>
);

export default ResaSwitch;
