import React from "react";
import "./Button.css";

const Button = ({
  variant = "primary",
  block = false,
  iconOnly = false,
  className = "",
  children,
  ...rest
}) => {
  const classes = [
    "ds-btn",
    `ds-btn--${variant}`,
    block ? "ds-btn--block" : "",
    iconOnly ? "ds-btn--icon-only" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
};

export default Button;
