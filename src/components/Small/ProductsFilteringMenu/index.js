import React from "react";
import { Dropdown, Menu } from "semantic-ui-react";

const ProductsFilteringMenu = ({
  dropdownValue,
  subCategories,
  activeMenu,
  setActiveMenu,
  setDropdownValue,
  products,
}) => {
  return (
    <Menu
      compact
      borderless
      icon="labeled"
      className="categories-menu"
      style={{ position: "relative" }}
    >
      {subCategories.map((subCategory) => (
        <>
          {subCategory.subCat ? (
            <div style={{ position: "relative" }}>
              <sup
                style={{ position: "absolute", top: 9, right: 3, zIndex: 10 }}
              >
                <span className="badge">
                  {products &&
                    products.filter(
                      (p) => p.category === subCategory.slug && p.visible
                    ).length}
                </span>
              </sup>
              <Dropdown
                key={subCategory.slug}
                className={
                  activeMenu === subCategory.slug
                    ? "categories-dropdown active"
                    : "categories-dropdown"
                }
                item
                icon={subCategory.icon}
                text={subCategory.name}
                onClick={() => setActiveMenu(subCategory.slug)}
              >
                <Dropdown.Menu>
                  {subCategory.subCat.map((sc) => (
                    <Dropdown.Item
                      key={sc.slug}
                      active={dropdownValue === sc.slug}
                      onClick={(e) => setDropdownValue(sc.slug)}
                    >
                      <span className="dropdown-menuitem">
                        {sc.name}
                        <span className="badge">
                          {products &&
                            products.filter(
                              (p) => p.subCategory === sc.slug && p.visible
                            ).length}
                        </span>
                      </span>
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </div>
          ) : (
            <>
              <Menu.Item
                style={{ position: "relative" }}
                key={subCategory.slug}
                className="menu-items"
                active={activeMenu === subCategory.slug}
                onClick={() => setActiveMenu(subCategory.slug)}
              >
                <Menu.Header>{subCategory.icon}</Menu.Header>
                {subCategory.name}
                <sup style={{ position: "absolute", top: 9, right: 3 }}>
                  <span className="badge top-menu">
                    {products &&
                      products.filter(
                        (p) => p.category === subCategory.slug && p.visible
                      ).length}
                  </span>
                </sup>
              </Menu.Item>
            </>
          )}
        </>
      ))}
    </Menu>
  );
};

export default ProductsFilteringMenu;
