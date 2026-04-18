import React from "react";
import "./TabBar.css";

/**
 * tabs: [{ key, label, icon: Component, onClick, active: bool, modifier?: string }]
 */
const TabBar = ({ tabs }) => (
  <nav className="ds-tabbar" role="navigation" aria-label="Navigation principale">
    {tabs.map((tab) => {
      const Icon = tab.icon;
      const classes = [
        "ds-tab",
        tab.active ? "ds-tab--active" : "",
        tab.modifier ? `ds-tab--${tab.modifier}` : "",
      ]
        .filter(Boolean)
        .join(" ");
      return (
        <button
          key={tab.key}
          className={classes}
          onClick={tab.onClick}
          aria-label={tab.label}
          aria-current={tab.active ? "page" : undefined}
        >
          {Icon ? <Icon /> : null}
          <span className="ds-tab__label">{tab.label}</span>
        </button>
      );
    })}
  </nav>
);

export default TabBar;
