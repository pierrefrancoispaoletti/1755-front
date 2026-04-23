import React, { useEffect, useState } from "react";
import { Button } from "../../design-system";
import { createBooking } from "../../services/bookingsApi";
import { fetchConfig } from "../../services/configApi";
import "./reservation.css";

const emptyBooking = {
  bookerName: "",
  bookerEmail: "",
  bookerPhoneNumber: "",
  bookerNumber: "",
  bookingDate: "",
  bookingTime: "18:00",
};

const Reservation = ({ setAppMessage, pushNotificationToken }) => {
  const [booking, setBooking] = useState(emptyBooking);
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const today = new Date();
    const dd = `0${today.getDate()}`.slice(-2);
    const mm = `0${today.getMonth() + 1}`.slice(-2);
    setBooking((b) => ({ ...b, bookingDate: `${today.getFullYear()}-${mm}-${dd}` }));
    fetchConfig().then(setConfig).catch(() => setConfig({}));
  }, []);

  const onField = (e) => setBooking((b) => ({ ...b, [e.target.name]: e.target.value }));

  const reset = () => {
    setBooking(emptyBooking);
    setSuccess(false);
    setError(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createBooking(booking, pushNotificationToken || "");
      if (res?.status === 200) {
        setSuccess(true);
        setError(false);
        setAppMessage && setAppMessage({ success: true, message: res.message || "Réservation envoyée" });
      } else {
        setError(true);
        setSuccess(false);
        setAppMessage && setAppMessage({ success: false, message: "Erreur lors de la réservation" });
      }
    } catch {
      setError(true);
      setAppMessage && setAppMessage({ success: false, message: "Erreur lors de la réservation" });
    } finally {
      setLoading(false);
    }
  };

  if (!config.resaOpen && Object.keys(config).length > 0) {
    return (
      <div className="reservation">
        <div className="reservation__closed">
          Les réservations sont désactivées pour le moment.<br />
          Revenez plus tard !
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="reservation">
        <div className="reservation__success">
          ✓ Votre réservation a été envoyée.<br />
          Vous recevrez un email de confirmation.
        </div>
        <Button variant="ghost" block onClick={reset}>Nouvelle réservation</Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reservation">
        <div className="reservation__error">
          Un problème est survenu. Veuillez réessayer.
        </div>
        <Button variant="primary" block onClick={reset}>Réessayer</Button>
      </div>
    );
  }

  const invalid =
    loading ||
    !booking.bookerName ||
    !booking.bookerEmail ||
    !booking.bookerPhoneNumber ||
    !booking.bookerNumber ||
    !booking.bookingDate ||
    !booking.bookingTime;

  return (
    <form className="reservation" onSubmit={onSubmit}>
      <h1 className="reservation__title">Réserver une table</h1>
      <p className="reservation__subtitle">Baravin 1755 — Ajaccio</p>

      <div className="reservation__field">
        <label htmlFor="bookerName">Votre nom</label>
        <input id="bookerName" name="bookerName" value={booking.bookerName} autoComplete="name" type="text" placeholder="Nom et prénom" onChange={onField} required />
      </div>

      <div className="reservation__field">
        <label htmlFor="bookerEmail">Email</label>
        <input id="bookerEmail" name="bookerEmail" value={booking.bookerEmail} autoComplete="email" type="email" placeholder="vous@exemple.fr" onChange={onField} required />
      </div>

      <div className="reservation__field">
        <label htmlFor="bookerPhoneNumber">Téléphone</label>
        <input id="bookerPhoneNumber" name="bookerPhoneNumber" value={booking.bookerPhoneNumber} autoComplete="tel" type="tel" placeholder="06 ..." onChange={onField} required />
      </div>

      <div className="reservation__field">
        <label htmlFor="bookerNumber">Nombre de personnes</label>
        <input id="bookerNumber" name="bookerNumber" value={booking.bookerNumber} min={1} step={1} type="number" placeholder="4" onChange={onField} required />
      </div>

      <div className="reservation__field">
        <label htmlFor="bookingDate">Date</label>
        <input id="bookingDate" name="bookingDate" value={booking.bookingDate} type="date" onChange={onField} required />
      </div>

      <div className="reservation__field">
        <label htmlFor="bookingTime">Heure</label>
        <input id="bookingTime" name="bookingTime" value={booking.bookingTime} type="time" onChange={onField} required />
        <span className="reservation__hint">Minimum 18h00</span>
      </div>

      <Button variant="primary" block type="submit" disabled={invalid}>
        {loading ? "Envoi…" : "Je réserve"}
      </Button>
    </form>
  );
};

export default Reservation;
