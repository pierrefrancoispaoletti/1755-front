import React from "react";
import "./categoryFilterPills.css";

const WINE_PILL_COLORS = {
  rouges: "#6B1A2C",
  roses: "#8a5560",
  blancs: "#9a7a32",
};

const CategoryFilterPills = ({
  subCategories = [],
  products = [],
  activeMenu,
  setActiveMenu,
  dropdownValue,
  setDropdownValue,
  typeSlug,
}) => {
  if (!subCategories || subCategories.length === 0) return null;

  const totalVisible = products.filter((p) => p.visible).length;
  const countBySubCategory = (slug) =>
    products.filter((p) => p.category === slug && p.visible).length;
  const countBySubSub = (slug) =>
    products.filter((p) => p.subCategory === slug && p.visible).length;

  const isWine = typeSlug === "vins";

  const activeParent = subCategories.find((s) => s.slug === activeMenu);
  const hasChildren = !!(activeParent && Array.isArray(activeParent.subCat) && activeParent.subCat.length > 0);

  const onClickParent = (slug) => {
    if (activeMenu === slug) {
      setActiveMenu("");
      setDropdownValue("");
    } else {
      setActiveMenu(slug);
      setDropdownValue("");
    }
  };

  const onClickChild = (slug) => {
    if (dropdownValue === slug) setDropdownValue("");
    else setDropdownValue(slug);
  };

  return (
    <div className="cfp">
      <div className="cfp-row">
        <button
          type="button"
          className={`cfp-pill${!activeMenu ? " cfp-pill--active" : ""}`}
          onClick={() => { setActiveMenu(""); setDropdownValue(""); }}
        >
          Tous<span className="cfp-badge">{totalVisible}</span>
        </button>
        {subCategories.map((s) => {
          const isActive = activeMenu === s.slug;
          const wineColor = isWine ? WINE_PILL_COLORS[s.slug] : null;
          const style = isActive && wineColor
            ? { background: wineColor, borderColor: wineColor, color: s.slug === "blancs" ? "#0E0A10" : "#F5EFE8" }
            : undefined;
          return (
            <button
              key={s.slug}
              type="button"
              className={`cfp-pill${isActive ? " cfp-pill--active" : ""}`}
              style={style}
              onClick={() => onClickParent(s.slug)}
            >
              {s.name}<span className="cfp-badge">{countBySubCategory(s.slug)}</span>
            </button>
          );
        })}
      </div>

      {hasChildren && (
        <>
          <div className="cfp-label">Affiner</div>
          <div className="cfp-subrow">
            {activeParent.subCat.map((sc) => (
              <button
                key={sc.slug}
                type="button"
                className={`cfp-subpill${dropdownValue === sc.slug ? " cfp-subpill--active" : ""}`}
                onClick={() => onClickChild(sc.slug)}
              >
                {sc.name}<span className="cfp-subbadge">{countBySubSub(sc.slug)}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CategoryFilterPills;
