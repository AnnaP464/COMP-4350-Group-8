import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthChoice from './AuthChoice.tsx';
import SignupUser from './SignupUser';
import LoginUser from './LoginUser';

function App() {
  
  return(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthChoice />} />
        <Route path="/User-signup" element={<SignupUser />} />
        <Route path="/User-login" element={<LoginUser />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
