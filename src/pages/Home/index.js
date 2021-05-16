import {
  faEdit,
  faPlus,
  faThumbsUp,
  faTrashAlt,
} from "@fortawesome/pro-duotone-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Button, Container, Header } from "semantic-ui-react";
import { $SERVER } from "../../_const/_const";
import "./home.css";

const Home = ({
  user,
  event,
  setEvent,
  setOpenAddEventModal,
  setOpenEditEventModal,
  setOpenLoginModal,
}) => {
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token-1755");
  const [like, setLike] = useState(0);

  useEffect(() => {
    if (event && Object.keys(event).length > 0) setLike(event.like);
  }, []);

  const arrayBufferToBase64 = (buffer) => {
    let binary = "";
    const bytes = [].slice.call(new Uint8Array(buffer));
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return window.btoa(binary);
  };

  const base64Flag = `data:${event.image?.contentType};base64,`;
  const imageStr = arrayBufferToBase64(event.image?.data?.data);

  const handleDeleteEvent = (eventId) => {
    if (token) {
      setLoading(true);
      axios({
        method: "delete",
        url: `${$SERVER}/api/events/deleteEvent`,
        data: {
          eventId,
        },
        headers: {
          Authorization: "Bearer " + token,
        },
      })
        .then((response) => setEvent({}))
        .catch((error) => console.log(error))
        .finally(() => setLoading(false));
    } else {
      setOpenLoginModal(true);
    }
  };
  return (
    <Container className="home">
      {user && (
        <div className="home-addbutton">
          {event && Object.keys(event).length === 0 && (
            <Button
              loading={loading}
              disabled={loading}
              color="green"
              circular
              size="medium"
              onClick={() => setOpenAddEventModal(true)}
            >
              <FontAwesomeIcon icon={faPlus} size="2x" />
            </Button>
          )}
          {event && Object.keys(event).length > 0 && (
            <>
              {/* <Button
                loading={loading}
                disabled={loading}
                color="purple"
                circular
                size="medium"
                onClick={() => setOpenEditEventModal(true)}
              >
                <FontAwesomeIcon icon={faEdit} size="2x" />
              </Button> */}
              <Button
                loading={loading}
                disabled={loading}
                color="red"
                circular
                size="medium"
                onClick={() => handleDeleteEvent(event._id)}
              >
                <FontAwesomeIcon icon={faTrashAlt} size="2x" />
              </Button>
            </>
          )}
        </div>
      )}
      {event && Object.keys(event).length > 0 && (
        <>
          <Header className="home-header" as="h1">
            {event.name}
          </Header>
          <Container text className="home-presentation">
            {event.image && (
              <div>
                <img
                  style={{ width: "100%" }}
                  src={base64Flag + imageStr}
                  alt={event.name}
                />
              </div>
            )}
            {event.date && (
              <p>
                {`Le :
                ${new Date(event.date).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}`}
              </p>
            )}
            <p>{event.description}</p>
            {/* <div className="home-like-button">
              <Button
                icon
                circular
                color="facebook"
                onClick={() => setLike(like + 1)}
              >
                <FontAwesomeIcon
                  size="2x"
                  icon={faThumbsUp}
                  style={{
                    "--fa-secondary-color": "white",
                    "--fa-secondary-opacity": 1,
                  }}
                />
              </Button>
              <span>{like}</span>
            </div> */}
          </Container>
        </>
      )}
      {event && Object.keys(event).length === 0 && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <img height="300px" src="./assets/images/1755medium.png" alt="" />
        </div>
      )}
    </Container>
  );
};

export default Home;
