import axios from "axios";
import React, { useEffect, useState } from "react";
import { Button, Form, Header, Icon, Modal } from "semantic-ui-react";
import { $SERVER } from "../../../../_const/_const";

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

  const token = localStorage.getItem("token-1755");

  const handleSubmit = (e) => {
    e.preventDefault();
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
      .catch(() =>
        setAppMessage &&
        setAppMessage({
          success: false,
          message: "Il y a eu un probléme, veuillez réessayer",
        })
      )
      .finally(() => setLoading(false));
  };

  return (
    <Modal
      closeIcon
      onClose={() => setOpenEditEventModal(false)}
      onOpen={() => setOpenEditEventModal(true)}
      open={openEditEventModal}
      size="small"
    >
      <Header icon>
        <Icon name="edit" />
        Éditer l'événement
      </Header>
      <Modal.Content>
        <Form onSubmit={handleSubmit} id="editEvent-form">
          <Form.Field required error={!edited.name}>
            <label>Nom de l'evenement</label>
            <input
              value={edited.name}
              name="name"
              type="text"
              onChange={change}
            />
          </Form.Field>
          <Form.Field>
            <label>Description</label>
            <textarea
              value={edited.description}
              name="description"
              rows="5"
              cols="33"
              onChange={change}
            />
          </Form.Field>
          <Form.Field>
            <label>Date de l'evenement</label>
            <input
              value={edited.date}
              name="date"
              type="date"
              min={today}
              onChange={change}
            />
          </Form.Field>
          <p style={{ color: "#888", fontSize: 12 }}>
            L'image n'est pas modifiable ici — supprimer puis recréer
            l'événement pour changer l'image.
          </p>
        </Form>
      </Modal.Content>
      <Modal.Actions>
        <Button
          disabled={loading || !edited.name}
          loading={loading}
          color="purple"
          type="submit"
          form="editEvent-form"
          inverted
        >
          <Icon name="edit" /> Enregistrer
        </Button>
        <Button
          disabled={loading}
          color="red"
          inverted
          onClick={() => setOpenEditEventModal(false)}
        >
          <Icon name="remove" /> Annuler
        </Button>
      </Modal.Actions>
    </Modal>
  );
};

export default EditEventModal;
