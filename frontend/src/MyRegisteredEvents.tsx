import React from "react";
import MyEventList from "./components/MyEventList";
import useAuthGuard from "./hooks/useAuthGuard";

import { useLocation } from "react-router-dom";

// Items are passed from Dashboard via navigate(..., { state: { items, role } })
// No fetching here.
const RegisteredEvents: React.FC = () => {
  const location = useLocation();
  const state = location.state;
  const role = state.role;

  const authStatus = useAuthGuard(role);

  //protected route: user needs to log in with valid access token to access this path
  if (authStatus === "checking" || authStatus === "unauthorized") {
    return null; 
  }
  
  return (
    <MyEventList
      title="My Events"
      mode="accepted"
      // items will be read from location.state.items
    />
  );
};

export default RegisteredEvents;
