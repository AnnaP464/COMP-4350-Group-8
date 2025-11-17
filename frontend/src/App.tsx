import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RoleChoice from './RoleChoice.tsx'
import AuthChoice from './AuthChoice.tsx';
import SignupUser from './SignupUser';
import LoginUser from './LoginUser';
import HomepageOrganizer from "./HomepageOrganizer.tsx";
import Dashboard from "./Dashboard.tsx";
import VolunteerProfile from "./VolunteerProfile.tsx";
import VolunteerRegisteredEvents from "./VolunteerRegisteredEvents.tsx";

function App() {
  return(
    //when url matches the path, react router renders the element component
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleChoice />} />
        <Route path="Auth-Choice" element={<AuthChoice />} />
        <Route path="/User-signup" element={<SignupUser />} />
        <Route path="/User-login" element={<LoginUser />} />
        <Route path="/Homepage-Organizer" element={<HomepageOrganizer />}/>
        <Route path="/Dashboard" element={<Dashboard/>}/>
        <Route path="/VolunteerProfile" element={<VolunteerProfile/>}/>
        <Route path="/My-Registrations" element={<VolunteerRegisteredEvents/>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App
