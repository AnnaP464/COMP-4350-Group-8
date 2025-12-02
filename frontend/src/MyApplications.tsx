/*------------------------------------------------------------------------------------------------
Displays the list of events whose status is applied OR rejected
When the applicant is accepted for the event, that event is moved to the MyRegisteredEvents page 

uses useAuthGaurd to protect this path
Calls /components/MyEventList to list the appliedORrejected events

--------------------------------------------------------------------------------------------------*/

import React from "react";
import MyEventList from "./components/MyEventList";
import { useLocation } from "react-router-dom";
import useAuthGuard from "./hooks/useAuthGuard";


const MyApplications: React.FC = () => {

  const location = useLocation();
  const state = location.state;
  const role = state.role;

  const authStatus = useAuthGuard(role);

  //protected route: user needs to log in with valid access token to access this path
  if (authStatus === "checking" || authStatus === "unauthorized") {
    return null; 
  }
    
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
