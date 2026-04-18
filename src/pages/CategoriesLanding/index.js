import React from "react";
import { Link } from "react-router-dom";
import { ICON_MAP } from "../../design-system";
import { useCategoriesTree } from "../../services/useCategoriesTree";
import "./categoriesLanding.css";

const CategoriesLanding = () => {
  const tree = useCategoriesTree();
  const roots = (tree || [])
    .filter((c) => c && c.visible !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <main className="cat-landing ds-root">
      <header className="cat-landing-header">
        <h1 className="cat-landing-title">La carte</h1>
        <p className="cat-landing-sub">Explorer par catégorie</p>
      </header>
      {roots.length === 0 ? (
        <p className="cat-landing-empty">Chargement…</p>
      ) : (
        <div className="cat-landing-grid">
          {roots.map((cat) => {
            const Icon = ICON_MAP[cat.icon] || null;
            return (
              <Link
                key={cat.slug}
                to={`/categories/${cat.slug}`}
                className="cat-landing-card"
              >
                {Icon && (
                  <Icon
                    size={32}
                    strokeWidth={1.75}
                    style={{ color: cat.iconColor || "var(--ds-accent-gold, #D4A24C)" }}
                  />
                )}
                <span className="cat-landing-card-name">{cat.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
};

export default CategoriesLanding;
