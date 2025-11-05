// src/composition/events.ts

//  Geofence stack factories (match your naming style)
import { geofences} from "../db/geofences";                  // persistence adapter
import { makeGeofencesService } from "../services/geofencesService";  // domain/service
import { makeGeofencesController } from "../controllers/geofenceController"; // controller

//  Events router (top layer). It accepts DI (geofencesController) and internally
//  composes the geofence route file so all event paths are authored here.
import { createEventsRouter } from "../routes/eventsRoutes";

// If your repo needs a db handle/pool, import it here (or pass from caller).
// import { pool } from "../db/pool"; 


// 2) Build the service with its dependency
const geofencesService = makeGeofencesService({ repo: geofences });

// 3) Build the controller with the service
const geofencesController = makeGeofencesController({ service: geofencesService });

// 4) Build and export a ready-to-mount router for /v1/events
export const eventsRouter = createEventsRouter({ geofencesController });