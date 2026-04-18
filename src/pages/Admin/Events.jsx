import React, { useEffect, useState } from "react";
import axios from "axios";
import { $SERVER } from "../../_const/_const";
import { Button, ListItem, ICON_MAP } from "../../design-system";
import AddEventModal from "../../components/Medium/Modals/AddEvent";
import EditEventModal from "../../components/Medium/Modals/EditEvent";
import "./admin.css";

const Events = ({ setAppMessage, setOpenLoginModal }) => {
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${$SERVER}/api/events/getEvent`);
        const list = Array.isArray(data?.data) ? data.data : data?.data ? [data.data] : [];
        setEvents(list);
      } catch (e) {
        setAppMessage && setAppMessage({ negative: true, header: "Erreur", content: e.message });
      }
    })();
  }, [version, setAppMessage]);

  return (
    <div className="ds-root admin-page">
      <h1 style={{ margin: 0 }}>Events</h1>
      <p className="subtitle">Événements programmés au 1755.</p>

      <div style={{ marginBottom: 16 }}>
        <Button variant="primary" block onClick={() => setOpenAdd(true)}>
          <ICON_MAP.Plus /> Ajouter un event
        </Button>
      </div>

      {events.map((ev, idx) => (
        <ListItem
          key={ev._id || ev.id || ev.title || idx}
          icon="Calendar"
          title={ev.title || ev.name || "Event"}
          subtitle={ev.date || ev.startDate || ""}
          onClick={() => { setSelected(ev); setOpenEdit(true); }}
          trail={<ICON_MAP.ChevronRight />}
        />
      ))}

      <AddEventModal
        setEvent={() => setVersion((v) => v + 1)}
        setAppMessage={setAppMessage}
        setOpenLoginModal={setOpenLoginModal}
        openAddEventModal={openAdd}
        setOpenAddEventModal={setOpenAdd}
      />
      <EditEventModal
        event={selected || {}}
        setEvent={() => setVersion((v) => v + 1)}
        setAppMessage={setAppMessage}
        setOpenLoginModal={setOpenLoginModal}
        openEditEventModal={openEdit}
        setOpenEditEventModal={setOpenEdit}
      />
    </div>
  );
};

export default Events;
