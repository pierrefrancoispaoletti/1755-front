import React from "react";
import { ICON_MAP } from "../../../design-system";
import { calculateDate } from "../../../services/dateUtils";
import "./bookingCard.css";

const formatTime = (t) => (t || "").slice(0, 5);
const formatDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" });
};

const BookingCard = ({ booking, loading, onValidate, onReject, onDelete }) => {
  const validated = booking.bookingValidatedByAdmin === true;
  const rejected = booking.bookingValidatedByAdmin === false;
  const [, whenLabel] = calculateDate(booking.bookingDate);

  return (
    <div className={`booking-card${validated ? " booking-card--validated" : ""}${rejected ? " booking-card--rejected" : ""}`}>
      <div className="booking-card__head">
        <h3 className="booking-card__name">
          {booking.bookerName} — {booking.bookerNumber} pers.
        </h3>
        <span className="booking-card__when">{whenLabel} · {formatTime(booking.bookingTime)}</span>
      </div>
      <div className="booking-card__meta">
        <span>{formatDate(booking.bookingDate)}</span>
        <a href={`tel:${booking.bookerPhoneNumber}`}><ICON_MAP.Phone size={12} /> {booking.bookerPhoneNumber}</a>
        <a href={`mailto:${booking.bookerEmail}`}><ICON_MAP.Mail size={12} /> {booking.bookerEmail}</a>
      </div>
      <div className="booking-card__actions">
        {!validated && (
          <button type="button" className="admin-prod__action-btn" onClick={() => onValidate(booking)} disabled={loading}>
            <ICON_MAP.Check size={14} /> Valider
          </button>
        )}
        {!rejected && (
          <button type="button" className="admin-prod__action-btn" onClick={() => onReject(booking)} disabled={loading}>
            <ICON_MAP.X size={14} /> Refuser
          </button>
        )}
        <button type="button" className="admin-prod__action-btn admin-prod__action-btn--danger" onClick={() => onDelete(booking)} disabled={loading}>
          <ICON_MAP.Trash size={14} /> Supprimer
        </button>
      </div>
    </div>
  );
};

export default BookingCard;
