import axios from "axios";
import React, { useRef, useState } from "react";
import { Button, Form, Header, Icon, Modal } from "semantic-ui-react";
import Resizer from "react-image-file-resizer";
import { $SERVER } from "../../../../_const/_const";

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

  let date = new Date();

  const [loading, setLoading] = useState(false);

  const changeEvent = (e) => {
    let updatedValue = {};
    updatedValue[e.target.name] = e.target.value;
    setNewEvent({ ...newEvent, ...updatedValue });
  };

  const setImage = async (e) => {
    Resizer.imageFileResizer(
      e.target.files[0],
      500,
      500,
      "JPEG",
      100,
      0,
      (uri) => {
        setNewEvent({ ...newEvent, image: uri });
      },
      "file"
    );
  };
  const inputEventFile = useRef(null);

  const token = localStorage.getItem("token-1755");

  const handleSubmit = (e) => {
    e.preventDefault();
    let formData = new FormData();
    formData.append("name", newEvent.name);
    formData.append("description", newEvent.description || "");
    formData.append("date", newEvent.date || "");
    formData.append("like", 0);
    formData.append("image", newEvent.image || "");
    if (token) {
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
          if (response && response.data.status === 200) {
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
            success: response.data.status === 200 ? true : false,
            message: response.data.message,
          });
        })
        .then(() => {
          setOpenAddEventModal(false);
        })
        .catch((error) =>
          setAppMessage({
            success: false,
            message: "Il y a eu un probleme, veuillez reessayer",
          })
        )
        .finally(() => {
          setLoading(false);
        });
    } else {
      setOpenLoginModal(true);
    }
  };
  return (
    <Modal
      closeIcon
      onClose={() => setOpenAddEventModal(false)}
      onOpen={() => setOpenAddEventModal(true)}
      open={openAddEventModal}
      size="small"
    >
      <Header icon>
        <Icon name="add" />
        Ajouter un Evenement
      </Header>
      <Modal.Content>
        <Form onSubmit={handleSubmit} id="addEvent-form">
          <Form.Field required error={!newEvent.name}>
            <label>Nom de l'evenement</label>
            <input
              value={newEvent.name}
              name="name"
              type="text"
              onChange={(e) => changeEvent(e)}
            />
          </Form.Field>
          <Form.Field>
            <label>Description</label>
            <textarea
              value={newEvent.description}
              name="description"
              rows="5"
              cols="33"
              onChange={(e) => changeEvent(e)}
            />
          </Form.Field>
          <Form.Field>
            <label>Date de l'evenement</label>
            <input
              value={newEvent.date}
              name="date"
              type="date"
              min={date.toISOString().split("T")[0]}
              onChange={(e) => changeEvent(e)}
            />
          </Form.Field>
          <Form.Field>
            <input
              ref={inputEventFile}
              accept="image/*"
              id="addEventImage"
              files={newEvent.image}
              type="file"
              hidden
              onChange={(e) => setImage(e)}
            />
            <Button
              disabled={loading}
              loading={loading}
              type="button"
              onClick={() => inputEventFile.current.click()}
              color="orange"
              inverted
            >
              Ajouter une image
            </Button>
          </Form.Field>
        </Form>
      </Modal.Content>
      <Modal.Actions>
        <Button
          disabled={loading || !newEvent.name}
          loading={loading}
          color="green"
          type="submit"
          form="addEvent-form"
          inverted
        >
          <Icon name="add" /> Ajouter
        </Button>
        <Button
          disabled={loading}
          loading={loading}
          color="red"
          type="submit"
          form="addEvent-form"
          inverted
          onClick={() => setOpenAddEventModal(false)}
        >
          <Icon name="remove" /> Annuler
        </Button>
      </Modal.Actions>
    </Modal>
  );
};

export default AddEventModal;
