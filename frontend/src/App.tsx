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
import * as RoleHelper from "./helpers/RoleHelper";

const signUpPath = "/" + RoleHelper.SIGN_UP;
const logInPath = "/" + RoleHelper.LOG_IN;

function App() {
  return(
    //when url matches the path, react router renders the element component
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthChoice />} />
        <Route path="/Role-Choice" element={<RoleChoice />} />
        <Route path={signUpPath} element={<SignupUser />} />
        <Route path={logInPath} element={<LoginUser />} />
        <Route path="/Homepage-Organizer" element={<HomepageOrganizer />}/>
        <Route path="/Dashboard" element={<Dashboard/>}/>
        <Route path="/VolunteerProfile" element={<VolunteerProfile/>}/>
        <Route path="/My-Registrations" element={<VolunteerRegisteredEvents/>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App
