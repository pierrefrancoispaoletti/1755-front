import React, { useEffect } from "react";
import { Redirect } from "react-router-dom";

const RequireAuth = ({ user, children }) => {
  useEffect(() => {
    // Hook pour logger le blocage si besoin plus tard
  }, [user]);
  if (!user) return <Redirect to="/" />;
  return children;
};

export default RequireAuth;
