import React, { useMemo, useState } from "react";
import { ICON_MAP, PICKER_ICONS, PICKER_COLORS } from "../iconMap";
import "./IconPicker.css";

const IconPicker = ({ value, color, onChange }) => {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PICKER_ICONS;
    return PICKER_ICONS.filter((n) => n.toLowerCase().includes(q));
  }, [query]);

  const update = (patch) => onChange({ icon: value, color, ...patch });

  return (
    <div>
      <input
        className="ds-iconpicker__search"
        placeholder="Rechercher (wine, beer, cake...)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="ds-iconpicker__grid">
        {filtered.map((name) => {
          const Icon = ICON_MAP[name];
          const selected = value === name;
          return (
            <div
              key={name}
              className={`ds-iconpicker__cell ${selected ? "ds-iconpicker__cell--selected" : ""}`}
              onClick={() => update({ icon: name })}
              title={name}
            >
              <Icon style={{ color: color || "#ffffff" }} />
            </div>
          );
        })}
      </div>
      <div className="ds-iconpicker__colors">
        {PICKER_COLORS.map((c) => (
          <div
            key={c}
            className={`ds-iconpicker__swatch ${color === c ? "ds-iconpicker__swatch--selected" : ""}`}
            style={{ background: c }}
            onClick={() => update({ color: c })}
          />
        ))}
        <input
          type="color"
          className="ds-iconpicker__custom-color"
          value={color || "#ffffff"}
          onChange={(e) => update({ color: e.target.value })}
          title="Couleur personnalisée"
        />
      </div>
    </div>
  );
};

export default IconPicker;
