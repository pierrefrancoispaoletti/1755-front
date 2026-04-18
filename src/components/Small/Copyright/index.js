import React from "react";
import { Facebook, Instagram, Mail, Phone, Heart } from "lucide-react";
import "./copyright.css";

const FB_URL = "https://www.facebook.com/Brasserie-1755-196458368600";
const IG_URL = "https://www.instagram.com/1755baravin/";
const MAIL = "christophemartinetti@baravin1755.com";
const TEL = "0609542757";

const Copyright = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="footer ds-root">
      <div className="footer-icons">
        <a href={FB_URL} target="_blank" rel="noreferrer" aria-label="Facebook">
          <Facebook size={18} strokeWidth={1.75} />
        </a>
        <a href={IG_URL} target="_blank" rel="noreferrer" aria-label="Instagram">
          <Instagram size={18} strokeWidth={1.75} />
        </a>
        <span className="footer-sep" aria-hidden="true" />
        <a href={`mailto:${MAIL}`} aria-label="E-mail">
          <Mail size={18} strokeWidth={1.75} />
        </a>
        <a href={`tel:${TEL}`} aria-label="Téléphone">
          <Phone size={18} strokeWidth={1.75} />
        </a>
      </div>
      <p className="footer-copy">
        © Baravin 1755 · {year} · Made with{" "}
        <Heart size={10} fill="currentColor" className="footer-heart" /> by{" "}
        <a href="mailto:pef@alvp-developments.com">ALVP</a>
      </p>
    </footer>
  );
};

export default Copyright;
