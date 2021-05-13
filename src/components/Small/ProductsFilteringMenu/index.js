import React from 'react';
import { Dropdown, Menu } from 'semantic-ui-react';

const ProductsFilteringMenu = ({subCategories, activeMenu, setActiveMenu, setDropdownValue}) => {
    return (
        <Menu compact borderless icon="labeled" className="categories-menu">
        {subCategories.map((subCategory) => (
          <>
            {subCategory.subCat ? (
              <Dropdown
                className="categories-dropdown"
                item
                icon={subCategory.icon}
                text={subCategory.name}
                onClick={() => setActiveMenu(subCategory.slug)}
              >
                <Dropdown.Menu>
                  {subCategory.subCat.map((sc) => (
                    <Dropdown.Item key={sc.slug} onClick={(e) => setDropdownValue(sc.slug)}>
                      {sc.name}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <Menu.Item
                key={subCategory.slug}
                className="menu-items"
                active={activeMenu === subCategory.slug}
                onClick={() => setActiveMenu(subCategory.slug)}
              >
                <Menu.Header>{subCategory.icon}</Menu.Header>
                {subCategory.name}
              </Menu.Item>
            )}
          </>
        ))}
      </Menu>
    );
}

export default ProductsFilteringMenu;
