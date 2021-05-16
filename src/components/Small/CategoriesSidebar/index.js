import React from "react";
import { Link } from "react-router-dom";
import { Divider, Grid, Menu, Segment, Sidebar } from "semantic-ui-react";
import categories from "../../../datas/categories";
import "./categoriessidebar.css";
const CategoriesSidebar = ({
  products,
  setFilteredProducts,
  setSelectedCategory,
  sidebarVisible,
  setSidebarVisible,
  children,
}) => {
  const handleFilterProducts = (category) => {
    setFilteredProducts([]);
    setSelectedCategory(category);
    setFilteredProducts(products.filter((p) => p.type === category.slug));
  };
  return (
    <Grid columns={1}>
      <Grid.Column>
        <Sidebar.Pushable as={Segment}>
          <Sidebar
            style={{ background: "#2B2B29" }}
            as={Menu}
            animation="overlay"
            icon="labeled"
            onHide={() => setSidebarVisible(false)}
            onShow={() => setSidebarVisible(true)}
            vertical
            visible={sidebarVisible}
            width="thin"
          >
            <Link to={`/`}>
              <Menu.Item className="categories-sidebar-item">
                <Menu.Header>
                  <img src="./assets/images/1755small.png" alt="" />
                </Menu.Header>
              </Menu.Item>
            </Link>
            <Divider />
            {categories.map((category) => (
              <Link
                key={category.slug}
                to={`/categories/${category.slug}`}
              >
                <Menu.Item className="categories-sidebar-item" onClick={() => handleFilterProducts(category)}>
                  <Menu.Header>{category.icon}</Menu.Header>
                  <span>{category.name}</span>
                </Menu.Item>
              </Link>
            ))}
          </Sidebar>
          <Sidebar.Pusher dimmed={sidebarVisible}>
            <Segment basic>{children}</Segment>
          </Sidebar.Pusher>
        </Sidebar.Pushable>
      </Grid.Column>
    </Grid>
  );
};

export default CategoriesSidebar;
