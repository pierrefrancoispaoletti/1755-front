import React from "react";
import { Link } from "react-router-dom";
import "./topappbar.css";

const TopAppBar = () => {
  return (
    <header className="topappbar ds-root">
      <Link to="/" className="topappbar-brand" aria-label="Accueil">
        <img
          src="./assets/images/1755medium.png"
          width="32"
          height="32"
          alt="Logo Baravin 1755"
          className="topappbar-logo"
        />
        <span className="topappbar-name">Bar à vin 1755</span>
      </Link>
    </header>
  );
};

export default TopAppBar;
