import React from "react";
import MyEventList from "./components/MyEventList";

const MyApplications: React.FC = () => {
    
  // Items are passed from Dashboard via navigate({ state: { items, role } })
   return (
    <MyEventList
      title="My Applications"
      mode="applications" //applied and rejected events only
      // items will be read from location.state.items    
    />
  );
};

export default MyApplications;
