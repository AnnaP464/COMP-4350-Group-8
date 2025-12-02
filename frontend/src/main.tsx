import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './css/Index.css'

// Leaflet base map styles
import "leaflet/dist/leaflet.css";
// Geoman drawing controls
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";

import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
