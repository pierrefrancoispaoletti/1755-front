import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { Button, ICON_MAP } from "../../design-system";
import { useCategoriesTree } from "../../services/useCategoriesTree";
import Copyright from "../../components/Small/Copyright";
import { buildImageSrc } from "../../services/image";
import { $SERVER } from "../../_const/_const";
import "./home.css";

const formatEventDate = (d) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  } catch { return ""; }
};

const Home = ({ event }) => {
  const tree = useCategoriesTree();
  const featured = (tree || [])
    .filter((c) => c && c.visible !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .slice(0, 3);

  const hasEvent = event && Object.keys(event).length > 0;
  const vote = typeof window !== "undefined" ? localStorage.getItem("1755-event") : null;
  const [like, setLike] = useState(0);

  useEffect(() => {
    if (hasEvent) setLike(event.like || 0);
    if (vote && event?._id && vote !== event._id) {
      localStorage.removeItem("1755-event");
    }
  }, [event, hasEvent, vote]);

  const handleLike = () => {
    if (vote || !event?._id) return;
    localStorage.setItem("1755-event", event._id);
    axios.post(`${$SERVER}/api/events/updateLikes`, { _id: event._id });
    setLike((n) => n + 1);
  };

  const eventImageSrc = hasEvent ? buildImageSrc(event.image) : null;

  return (
    <main className="home ds-root">
      <section className="home-hero">
        <div className="home-hero-band">
          <img
            src="./assets/images/1755medium.png"
            alt="Logo Baravin 1755"
            className="home-hero-logo"
          />
        </div>
        <h1 className="home-hero-title">Baravin 1755</h1>
        <p className="home-hero-sub">Bar à vin — Ajaccio</p>
      </section>

      {hasEvent && (
        <article className="home-event">
          {eventImageSrc && (
            <div className="home-event-image" style={{ backgroundImage: `url(${eventImageSrc})` }} />
          )}
          <div className="home-event-body">
            <span className="home-event-label">À l'affiche</span>
            <h2 className="home-event-name">{event.name}</h2>
            {event.date && <p className="home-event-date">{formatEventDate(event.date)}</p>}
            {event.description && <p className="home-event-desc">{event.description}</p>}
            <div className="home-event-like">
              <Button
                variant="primary"
                disabled={!!vote}
                onClick={handleLike}
                aria-label="J'aime cet événement"
              >
                <Heart size={16} fill={vote ? "currentColor" : "none"} />
                <span>{like}</span>
              </Button>
            </div>
          </div>
        </article>
      )}

      {featured.length > 0 && (
        <section className="home-featured">
          <span className="home-featured-label">Explorer la carte</span>
          <div className="home-featured-grid">
            {featured.map((c) => {
              const Icon = ICON_MAP[c.icon] || null;
              return (
                <Link key={c.slug} to={`/categories/${c.slug}`} className="home-featured-tile">
                  {Icon && (
                    <Icon
                      size={24}
                      strokeWidth={1.75}
                      style={{ color: c.iconColor || "var(--ds-accent-gold, #D4A24C)" }}
                    />
                  )}
                  <span className="home-featured-name">{c.name}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <Copyright />
    </main>
  );
};

export default Home;
