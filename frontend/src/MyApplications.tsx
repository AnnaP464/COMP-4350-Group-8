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
