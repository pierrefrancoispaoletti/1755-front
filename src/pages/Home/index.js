/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { faThumbsUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Button, Container, Header } from "semantic-ui-react";
import { $SERVER } from "../../_const/_const";
import "./home.css";
import { isBefore18h } from "../../datas/utils";

const Home = ({ event }) => {
  const [like, setLike] = useState(0);

  const vote = localStorage.getItem(`1755-event`);

  console.log(vote);
  useEffect(() => {
    setLike(event.like);
    console.log(vote === event._id);
    console.log(event._id === vote);
    if (vote && vote !== event._id && event._id) {
      console.log("am here");
      localStorage.removeItem(`1755-event`);
    }
  }, [event]);

  const handleAddLike = () => {
    if (!vote) {
      localStorage.setItem(`1755-event`, event._id);
      axios({
        method: "post",
        url: `${$SERVER}/api/events/updateLikes`,
        data: { _id: event._id },
      });
      setLike(like + 1);
    }
  };
  const arrayBufferToBase64 = (buffer) => {
    let binary = "";
    const bytes = [].slice.call(new Uint8Array(buffer));
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return window.btoa(binary);
  };

  const base64Flag = `data:${event.image?.contentType};base64,`;
  const imageStr = arrayBufferToBase64(event.image?.data?.data);

  return (
    <Container className='home'>
      {event && Object.keys(event).length > 0 && (
        <>
          <Header
            className='home-header'
            as='h1'
          >
            {event.name}
          </Header>
          <Container
            text
            className='home-presentation'
          >
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
            <div className='home-like-button'>
              <Button
                disabled={vote ? true : false}
                icon
                circular
                color='facebook'
                onClick={() => handleAddLike()}
              >
                <FontAwesomeIcon
                  size='1x'
                  icon={faThumbsUp}
                  style={{
                    "--fa-secondary-color": "white",
                    "--fa-secondary-opacity": 1,
                  }}
                />
              </Button>
              <span
                style={{
                  background: "transparent",
                  color: "white",
                  borderRadius: 50,
                  display: "inline-block",
                  padding: "5px 10px",
                }}
              >
                {like}
              </span>
            </div>
          </Container>
        </>
      )}
      {event && Object.keys(event).length === 0 && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <img
            height='300px'
            src={`./assets/images/${
              isBefore18h() ? "aCarciaraNormal.png" : "1755medium.png"
            }`}
            alt=''
          />
        </div>
      )}
    </Container>
  );
};

export default Home;
