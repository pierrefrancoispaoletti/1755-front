import React from "react";
import { ICON_MAP } from "../iconMap";
import "./ListItem.css";

const ListItem = ({
  icon,
  iconColor,
  badge,
  title,
  subtitle,
  trail,
  hidden = false,
  onClick,
}) => {
  const Icon = icon ? ICON_MAP[icon] : null;
  const BadgeIcon = badge && badge.icon ? ICON_MAP[badge.icon] : null;
  const classes = ["ds-listitem", hidden ? "ds-listitem--hidden" : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={classes} onClick={onClick} role="button" tabIndex={0}>
      <div className="ds-listitem__icon">
        {Icon ? <Icon style={{ color: iconColor || "#ffffff" }} /> : null}
        {BadgeIcon ? (
          <span className="ds-listitem__badge">
            <BadgeIcon style={{ color: badge.color || "#D4A24C" }} />
          </span>
        ) : null}
      </div>
      <div className="ds-listitem__body">
        <span className="ds-listitem__title">{title}</span>
        {subtitle ? <span className="ds-listitem__subtitle">{subtitle}</span> : null}
      </div>
      {trail ? <div className="ds-listitem__trail">{trail}</div> : null}
    </div>
  );
};

export default ListItem;
