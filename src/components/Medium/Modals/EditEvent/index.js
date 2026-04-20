import axios from "axios";
import React, { useEffect, useState } from "react";
import { Button, Sheet } from "../../../../design-system";
import { $SERVER } from "../../../../_const/_const";
import "../AddProduct/productModal.css";

const EditEventModal = ({
  event,
  setEvent,
  setAppMessage,
  setOpenLoginModal,
  openEditEventModal,
  setOpenEditEventModal,
}) => {
  const [edited, setEdited] = useState({
    name: "",
    description: "",
    date: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!event) return;
    setEdited({
      name: event.name || "",
      description: event.description || "",
      date: event.date ? event.date.slice(0, 10) : "",
    });
  }, [event, openEditEventModal]);

  const today = new Date().toISOString().split("T")[0];
  const change = (e) =>
    setEdited((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onClose = () => setOpenEditEventModal(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token-1755");
    if (!token) {
      setOpenEditEventModal(false);
      setOpenLoginModal && setOpenLoginModal(true);
      return;
    }
    setLoading(true);
    axios({
      method: "post",
      url: `${$SERVER}/api/events/editEvent`,
      data: { update: edited, eventId: event._id },
      headers: { Authorization: "Bearer " + token },
    })
      .then((response) => {
        if (response?.data?.status === 200) {
          setEvent(response.data.data);
          setAppMessage &&
            setAppMessage({ success: true, message: response.data.message });
          setOpenEditEventModal(false);
        } else {
          setAppMessage &&
            setAppMessage({
              success: false,
              message: response?.data?.message || "Échec de la mise à jour",
            });
        }
      })
      .catch(
        () =>
          setAppMessage &&
          setAppMessage({
            success: false,
            message: "Il y a eu un probléme, veuillez réessayer",
          }),
      )
      .finally(() => setLoading(false));
  };

  return (
    <Sheet
      open={openEditEventModal}
      onClose={onClose}
      title={<h2 className="pm-title">Éditer l'événement</h2>}
    >
      <form id="editEvent-form" onSubmit={handleSubmit} className="pm-form">
        <label className="pm-field">
          <span className="pm-label">Nom de l'événement</span>
          <input
            type="text"
            name="name"
            value={edited.name}
            onChange={change}
            required
          />
        </label>
        <label className="pm-field">
          <span className="pm-label">Description</span>
          <textarea
            name="description"
            rows={5}
            value={edited.description}
            onChange={change}
          />
        </label>
        <label className="pm-field">
          <span className="pm-label">Date</span>
          <input
            type="date"
            name="date"
            value={edited.date}
            min={today}
            onChange={change}
          />
        </label>
        <p className="pm-note">
          L'image n'est pas modifiable ici — supprimer puis recréer l'événement
          pour changer l'image.
        </p>
        <div className="pm-actions">
          <button
            type="button"
            className="pm-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </button>
          <Button
            variant="primary"
            type="submit"
            disabled={loading || !edited.name}
          >
            {loading ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </form>
    </Sheet>
  );
};

export default EditEventModal;
