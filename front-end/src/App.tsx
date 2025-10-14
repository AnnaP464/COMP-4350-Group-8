import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthChoice from './AuthChoice.tsx';
import SignupUser from './SignupUser';
import LoginUser from './LoginUser';
import HomepageOrganizer from "./Homepage-Organizer.tsx";
import Dashboard from "./Dashboard.tsx";

function App() {
  
  return(

    //when url matches the path, react router renders the element component
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthChoice />} />
        <Route path="/User-signup" element={<SignupUser />} />
        <Route path="/User-login" element={<LoginUser />} />
        <Route path="/Homepage-Organizer" element={<HomepageOrganizer />}/>
        <Route path="/Dashboard" element={<Dashboard/>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App
