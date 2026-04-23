import React, { useEffect, useState } from "react";
import {
  fetchAllBookings,
  updateBooking,
  deleteBooking,
  postAdminRegistrationToken,
} from "../../services/bookingsApi";
import { fetchConfig, updateConfig } from "../../services/configApi";
import { bookingsFilter } from "../../services/dateUtils";
import BookingCard from "../../components/Small/BookingCard";
import BookingFilters from "../../components/Small/BookingFilters";
import ResaSwitch from "../../components/Small/ResaSwitch";
import "./admin.css";
import "./bookings.css";

const Bookings = ({ setAppMessage, pushNotificationToken }) => {
  const [bookings, setBookings] = useState([]);
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [b, c] = await Promise.all([fetchAllBookings(), fetchConfig()]);
        const sorted = [...b]
          .sort((x, y) => new Date(x.bookingDate) - new Date(y.bookingDate))
          .sort((x, y) => (y.bookingValidatedByAdmin === null) - (x.bookingValidatedByAdmin === null));
        setBookings(sorted);
        setConfig(c);
      } catch (e) {
        setAppMessage && setAppMessage({ success: false, message: "Erreur chargement" });
      } finally {
        setLoading(false);
      }
    })();
    if (pushNotificationToken) {
      postAdminRegistrationToken(pushNotificationToken).catch(() => {});
    }
  }, [pushNotificationToken, setAppMessage]);

  const patchBooking = async (booking, value) => {
    setLoading(true);
    try {
      const res = await updateBooking({ ...booking, bookingValidatedByAdmin: value });
      if (res?.status === 200 && res.updatedBooking) {
        setBookings((prev) => prev.map((b) => (b._id === res.updatedBooking._id ? res.updatedBooking : b)));
        setAppMessage && setAppMessage({ success: true, message: res.message });
      }
    } catch {
      setAppMessage && setAppMessage({ success: false, message: "Erreur mise à jour" });
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = (booking) => patchBooking(booking, true);
  const handleReject = (booking) => patchBooking(booking, false);

  const handleDelete = async (booking) => {
    if (!window.confirm(`Supprimer la résa de ${booking.bookerName} ?`)) return;
    setLoading(true);
    try {
      const res = await deleteBooking(booking);
      if (res?.status === 200 && res.deletedBooking) {
        setBookings((prev) => prev.filter((b) => b._id !== res.deletedBooking._id));
        setAppMessage && setAppMessage({ success: true, message: res.message });
      }
    } catch {
      setAppMessage && setAppMessage({ success: false, message: "Erreur suppression" });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleResa = async () => {
    setLoading(true);
    try {
      const updated = await updateConfig({ _id: config._id, resaOpen: !config.resaOpen });
      if (updated) setConfig(updated);
    } catch {
      setAppMessage && setAppMessage({ success: false, message: "Erreur config" });
    } finally {
      setLoading(false);
    }
  };

  const visible = bookingsFilter(bookings, filter);

  return (
    <div className="ds-root admin-page admin-bookings">
      <h1>Réservations</h1>
      <ResaSwitch resaOpen={!!config.resaOpen} onToggle={handleToggleResa} loading={loading} />
      <BookingFilters filter={filter} setFilter={setFilter} bookings={bookings} />
      {visible.length === 0 && <div className="admin-bookings__empty">Aucune réservation.</div>}
      {visible.map((b) => (
        <BookingCard
          key={b._id}
          booking={b}
          loading={loading}
          onValidate={handleValidate}
          onReject={handleReject}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
};

export default Bookings;
