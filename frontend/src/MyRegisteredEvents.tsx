import React from "react";
import MyEventList from "./components/MyEventList";

const RegisteredEvents: React.FC = () => {
  // Items are passed from Dashboard via navigate(..., { state: { items, role } })
  // No fetching here.
  return (
    <MyEventList
      title="My Events"
      mode="accepted"
      // items will be read from location.state.items
    />
  );
};

export default RegisteredEvents;
