import axios from "axios";
import React, { useRef, useState } from "react";
import Resizer from "react-image-file-resizer";
import { Button, Sheet } from "../../../../design-system";
import { $SERVER, COMPRESSION_QUALITY } from "../../../../_const/_const";
import "../AddProduct/productModal.css";

const AddEventModal = ({
  setEvent,
  setAppMessage,
  setOpenLoginModal,
  openAddEventModal,
  setOpenAddEventModal,
}) => {
  const [newEvent, setNewEvent] = useState({
    name: "",
    description: "",
    date: "",
    like: 0,
    image: "",
  });
  const [loading, setLoading] = useState(false);
  const inputFile = useRef(null);

  const today = new Date().toISOString().split("T")[0];

  const change = (e) =>
    setNewEvent((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const setImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Resizer.imageFileResizer(
      file,
      363,
      360,
      "JPEG",
      COMPRESSION_QUALITY,
      0,
      (uri) => setNewEvent((prev) => ({ ...prev, image: uri })),
      "file",
    );
  };

  const onClose = () => setOpenAddEventModal(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token-1755");
    if (!token) {
      setOpenAddEventModal(false);
      setOpenLoginModal(true);
      return;
    }
    const formData = new FormData();
    formData.append("name", newEvent.name);
    formData.append("description", newEvent.description || "");
    formData.append("date", newEvent.date || "");
    formData.append("like", 0);
    formData.append("image", newEvent.image || "");
    setLoading(true);
    axios({
      method: "post",
      url: `${$SERVER}/api/events/createEvent`,
      data: formData,
      headers: {
        "content-type": "multipart/form-data",
        Authorization: "Bearer " + token,
      },
    })
      .then((response) => {
        if (response?.data?.status === 200) {
          setEvent(response.data.data);
          setNewEvent({
            name: "",
            description: "",
            date: "",
            like: 0,
            image: "",
          });
        }
        setAppMessage({
          success: response.data.status === 200,
          message: response.data.message,
        });
        setOpenAddEventModal(false);
      })
      .catch(() =>
        setAppMessage({
          success: false,
          message: "Il y a eu un probleme, veuillez reessayer",
        }),
      )
      .finally(() => setLoading(false));
  };

  return (
    <Sheet
      open={openAddEventModal}
      onClose={onClose}
      title={<h2 className="pm-title">Ajouter un événement</h2>}
    >
      <form id="addEvent-form" onSubmit={handleSubmit} className="pm-form">
        <label className="pm-field">
          <span className="pm-label">Nom de l'événement</span>
          <input
            type="text"
            name="name"
            value={newEvent.name}
            onChange={change}
            required
          />
        </label>
        <label className="pm-field">
          <span className="pm-label">Description</span>
          <textarea
            name="description"
            rows={4}
            value={newEvent.description}
            onChange={change}
          />
        </label>
        <label className="pm-field">
          <span className="pm-label">Date</span>
          <input
            type="date"
            name="date"
            value={newEvent.date}
            min={today}
            onChange={change}
          />
        </label>
        <div className="pm-section">
          <input
            ref={inputFile}
            type="file"
            accept="image/*"
            hidden
            onChange={setImage}
          />
          <button
            type="button"
            className="pm-file-btn"
            onClick={() => inputFile.current.click()}
            disabled={loading}
          >
            {newEvent.image ? "Image sélectionnée — changer" : "Ajouter une image"}
          </button>
        </div>
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
            disabled={loading || !newEvent.name}
          >
            {loading ? "Ajout…" : "Ajouter"}
          </Button>
        </div>
      </form>
    </Sheet>
  );
};

export default AddEventModal;
