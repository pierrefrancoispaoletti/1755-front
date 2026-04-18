import React from "react";
import { ICON_MAP } from "../design-system/iconMap";

// Transforme l'arbre renvoyé par /api/categories?tree=1 au format historique
// consommé par CategoriesSidebar, Categories, AddProduct, EditProduct.
//
// Entrée (API):
//   [{ _id, name, slug, icon: "Wine", iconColor: "#8B0000",
//      badge: { icon, color } | null, visible, children: [...] }]
//
// Sortie (legacy):
//   [{ name, slug, showAlways: true,
//      icon: <JSX>, subCategories: [
//        { name, slug, icon: <JSX>,
//          subCat: [{ name, slug }] }
//      ]
//   }]

const SIZE_MAP = { "4x": 48, "3x": 36, "2x": 28, "1x": 22 };

const renderIcon = (iconName, color, size = "4x", badge = null) => {
  const Icon = iconName ? ICON_MAP[iconName] : null;
  if (!Icon) return null;
  const sizePx = SIZE_MAP[size] || 48;
  const baseIcon = (
    <Icon size={sizePx} style={{ color: color || "#ffffff" }} />
  );
  if (!badge || !badge.icon) return baseIcon;
  const BadgeIcon = ICON_MAP[badge.icon];
  if (!BadgeIcon) return baseIcon;
  return (
    <span
      style={{
        display: "inline-flex",
        position: "relative",
      }}
    >
      {baseIcon}
      <BadgeIcon
        size={Math.max(14, Math.round(sizePx * 0.35))}
        style={{
          position: "absolute",
          top: -6,
          right: -6,
          color: badge.color || "#D4A24C",
        }}
      />
    </span>
  );
};

export function treeToLegacy(tree) {
  if (!Array.isArray(tree)) return [];
  return tree
    .filter((root) => root && root.visible !== false)
    .map((root) => ({
      name: root.name,
      slug: root.slug,
      showAlways: true,
      icon: renderIcon(root.icon, root.iconColor, "4x", root.badge),
      subCategories: (root.children || [])
        .filter((c) => c && c.visible !== false)
        .map((sub) => ({
          name: sub.name,
          slug: sub.slug,
          icon: renderIcon(sub.icon, sub.iconColor, "3x", sub.badge),
          subCat: (sub.children || [])
            .filter((c) => c && c.visible !== false)
            .map((sc) => ({ name: sc.name, slug: sc.slug })),
        })),
    }));
}
