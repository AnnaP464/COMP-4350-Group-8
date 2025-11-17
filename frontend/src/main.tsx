import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './css/Index.css'
import App from './App.tsx'

//const API_URL = "http://localhost:4000";
//const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

//console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
