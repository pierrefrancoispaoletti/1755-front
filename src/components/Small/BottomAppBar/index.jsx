import React, { useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { TabBar, ICON_MAP } from "../../../design-system";
import "./BottomAppBar.css";

const BottomAppBar = ({ user, setOpenLoginModal }) => {
  const history = useHistory();
  const location = useLocation();
  const pathname = location.pathname;

  useEffect(() => {
    document.body.classList.add("has-bottom-appbar");
    return () => document.body.classList.remove("has-bottom-appbar");
  }, []);

  const onAdmin = pathname.startsWith("/admin");

  const visitorTabs = [
    {
      key: "home",
      label: "Accueil",
      icon: ICON_MAP.Home,
      active: pathname === "/",
      onClick: () => history.push("/"),
    },
    {
      key: "carte",
      label: "Carte",
      icon: ICON_MAP.BookOpen,
      active: pathname.startsWith("/categories"),
      onClick: () => history.push("/categories"),
    },
    {
      key: "resa",
      label: "Résa",
      icon: ICON_MAP.CalendarCheck,
      active: pathname === "/reserver",
      onClick: () => history.push("/reserver"),
    },
    {
      key: "compte",
      label: user ? "Admin" : "Compte",
      icon: user ? ICON_MAP.UserCheck : ICON_MAP.User,
      active: false,
      modifier: user ? "connected" : null,
      onClick: () => {
        if (user) history.push("/admin");
        else setOpenLoginModal(true);
      },
    },
  ];

  const adminTabs = [
    {
      key: "a-products",
      label: "Produits",
      icon: ICON_MAP.Package,
      active: pathname.startsWith("/admin/products"),
      onClick: () => history.push("/admin/products"),
    },
    {
      key: "a-categories",
      label: "Catégories",
      icon: ICON_MAP.FolderTree,
      active: pathname.startsWith("/admin/categories"),
      onClick: () => history.push("/admin/categories"),
    },
    {
      key: "a-events",
      label: "Events",
      icon: ICON_MAP.Calendar,
      active: pathname.startsWith("/admin/events"),
      onClick: () => history.push("/admin/events"),
    },
    {
      key: "a-bookings",
      label: "Résas",
      icon: ICON_MAP.CalendarCheck,
      active: pathname.startsWith("/admin/bookings"),
      onClick: () => history.push("/admin/bookings"),
    },
    {
      key: "a-quit",
      label: "Quitter",
      icon: ICON_MAP.LogOut,
      active: false,
      onClick: () => history.push("/"),
    },
  ];

  const tabs = onAdmin ? adminTabs : visitorTabs;

  return (
    <div className="ds-root ds-appbar-root">
      <TabBar tabs={tabs} />
    </div>
  );
};

export default BottomAppBar;
