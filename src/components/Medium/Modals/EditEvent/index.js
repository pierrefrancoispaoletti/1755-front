import axios from "axios";
import React, { useEffect, useState } from "react";
import { Button, Sheet } from "../../../design-system";
import { $SERVER } from "../../../_const/_const";

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
      title={<h2 className="ee-title">Éditer l'événement</h2>}
    >
      <form id="editEvent-form" onSubmit={handleSubmit} className="ee-form">
        <label className="ee-field">
          <span className="ee-label">Nom de l'événement</span>
          <input
            type="text"
            name="name"
            value={edited.name}
            onChange={change}
            required
          />
        </label>
        <label className="ee-field">
          <span className="ee-label">Description</span>
          <textarea
            name="description"
            rows={5}
            value={edited.description}
            onChange={change}
          />
        </label>
        <label className="ee-field">
          <span className="ee-label">Date</span>
          <input
            type="date"
            name="date"
            value={edited.date}
            min={today}
            onChange={change}
          />
        </label>
        <p className="ee-note">
          L'image n'est pas modifiable ici — supprimer puis recréer l'événement
          pour changer l'image.
        </p>
        <div className="ee-actions">
          <Button
            variant="primary"
            type="submit"
            disabled={loading || !edited.name}
            block
          >
            {loading ? "Enregistrement…" : "Enregistrer"}
          </Button>
          <button
            type="button"
            className="ee-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </button>
        </div>
      </form>
      <style>{`
        .ee-title {
          font-family: var(--ds-font-serif, "DM Serif Display", Georgia, serif);
          font-size: var(--ds-size-h1, 22px);
          color: var(--ds-accent-gold, #D4A24C);
          margin: 0;
        }
        .ee-form {
          display: flex;
          flex-direction: column;
          gap: var(--ds-space-3, 12px);
        }
        .ee-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .ee-label {
          font-size: var(--ds-size-small, 13px);
          color: var(--ds-text-muted, #9A8B90);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .ee-field input,
        .ee-field textarea {
          background: var(--ds-bg-elevated, #241820);
          border: 1px solid var(--ds-border-subtle, #2C1E25);
          border-radius: var(--ds-radius-sm, 8px);
          color: var(--ds-text-primary, #F5EFE8);
          padding: 10px 12px;
          font-size: var(--ds-size-body, 15px);
          font-family: var(--ds-font-sans, "Inter", system-ui, sans-serif);
          resize: vertical;
        }
        .ee-field input:focus,
        .ee-field textarea:focus {
          outline: none;
          border-color: var(--ds-accent-gold, #D4A24C);
        }
        .ee-note {
          color: var(--ds-text-muted, #9A8B90);
          font-size: var(--ds-size-tiny, 11px);
          margin: 0;
        }
        .ee-actions {
          display: flex;
          flex-direction: column;
          gap: var(--ds-space-2, 8px);
          margin-top: var(--ds-space-2, 8px);
        }
        .ee-cancel {
          background: transparent;
          border: none;
          color: var(--ds-text-muted, #9A8B90);
          font-size: var(--ds-size-small, 13px);
          padding: 8px;
          cursor: pointer;
        }
        .ee-cancel:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>
    </Sheet>
  );
};

export default EditEventModal;
