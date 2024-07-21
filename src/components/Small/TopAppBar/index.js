import {
  faBars,
  faBookAlt,
  faBookOpen,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "semantic-ui-react";
import "./topappbar.css";
import { isBefore18h } from "../../../datas/utils";
const TopAppBar = ({
  setSelectedCategory,
  setSidebarVisible,
  setOpenLoginModal,
  user,
  loading,
}) => {
  return (
    <div className='topappbar'>
      <Link
        to='/'
        onClick={() => setSelectedCategory({})}
      >
        <div className='topappbar-image'>
          <img
            width='100px'
            src={`./assets/images/${
              isBefore18h() ? "aCarciaraNormal.png" : "1755small.png"
            }`}
            alt='logo 1755'
          />
        </div>
      </Link>
      <div className='topappbar-icons'>
        <Button
          disabled={loading}
          loading={loading}
          icon
          circular
          color={user ? "green" : "grey"}
          onClick={() => setOpenLoginModal(true)}
        >
          <FontAwesomeIcon
            size='3x'
            icon={faUser}
          />
        </Button>
        <Button
          disabled={loading}
          loading={loading}
          icon
          circular
          onClick={() => setSidebarVisible(true)}
        >
          <FontAwesomeIcon
            size='3x'
            icon={faBars}
          />
        </Button>
        <a
          href='https://pierrefrancoispaoletti.github.io/1755-resas'
          target='_blank'
          rel='noreferrer'
        >
          <Button
            style={{ position: "relative" }}
            disabled={loading}
            loading={loading}
            icon
            circular
            color='orange'
          >
            {/* <span className="alvp__icon" style ={{position: "absolute", top:"-14px", right: "8px", display: "inline-block", padding:"3px 4px", background: "red", borderRadius:"50px", fontWeight: "bold"}}>New</span> */}

            <FontAwesomeIcon
              icon={faBookOpen}
              size='3x'
            />
          </Button>
        </a>
      </div>
    </div>
  );
};

export default TopAppBar;
