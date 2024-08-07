import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Divider, Grid, Menu, Segment, Sidebar } from "semantic-ui-react";
import categories from "../../../datas/categories";
import "./categoriessidebar.css";
import { isBefore18h } from "../../../datas/utils";
import { COLOR_1755, COLOR_ACARCIARA } from "../../../_const/_const";

const CategoriesSidebar = ({
  user,
  selectedCategory,
  setActiveMenu,
  setDropdownValue,
  products,
  setFilteredProducts,
  setSelectedCategory,
  sidebarVisible,
  setSidebarVisible,
  children,
}) => {
  useEffect(() => {
    if (selectedCategory) {
      setActiveMenu("");
      setDropdownValue("");
      setFilteredProducts([]);
      setFilteredProducts(
        products.filter((p) => p.type === selectedCategory.slug),
      );
    }
    if (selectedCategory.slug === "vins") {
      setActiveMenu("rouges");
      setDropdownValue("corses");
      setFilteredProducts(products.filter((p) => p.subCategory === "corses"));
    }
    if (selectedCategory.slug === "alcools") {
      setActiveMenu("premiums");
      setDropdownValue("rhum");
      setFilteredProducts(products.filter((p) => p.subCategory === "rhum"));
    }
    if (selectedCategory.slug === "cuisine") {
      setActiveMenu("tapas");
    }
  }, [selectedCategory]);
  console.log(user);
  return (
    <Grid columns={1}>
      <Grid.Column>
        <Sidebar.Pushable as={Segment}>
          <Sidebar
            style={{ background: isBefore18h() ? COLOR_ACARCIARA : COLOR_1755 }}
            as={Menu}
            animation='overlay'
            icon='labeled'
            onHide={() => setSidebarVisible(false)}
            onShow={() => setSidebarVisible(true)}
            vertical
            visible={sidebarVisible}
            width='thin'
          >
            <Link
              to={`/`}
              onClick={() => setSelectedCategory({})}
            >
              <Menu.Item className='categories-sidebar-item'>
                <Menu.Header>
                  <img
                    width='100px'
                    src={`./assets/images/${
                      isBefore18h() ? "aCarciaraNormal.png" : "1755small.png"
                    }`}
                    alt=''
                  />
                </Menu.Header>
              </Menu.Item>
            </Link>
            <Divider />{" "}
            {categories.map((category) => {
              return (
                (category.showAlways || user) && (
                  <Link
                    key={category.slug}
                    to={`/categories/${category.slug}`}
                    onClick={() => {
                      setSelectedCategory(category);

                      setSidebarVisible(false);
                    }}
                  >
                    <Menu.Item className='categories-sidebar-item'>
                      <Menu.Header>{category.icon}</Menu.Header>

                      <span>{category.name}</span>
                    </Menu.Item>
                  </Link>
                )
              );
            })}
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
