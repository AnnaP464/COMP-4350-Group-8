import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from './Login.tsx'
import SignupOrganizer from './SignupOrganizer.tsx'

function App() {
  
  return(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/Organizer-signup" element={<SignupOrganizer />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
