// src/composition/events.ts

//  Geofence stack factories (match your naming style)
import { geofences} from "../db/geofences";                  // persistence adapter
import { makeGeofencesService } from "../services/geofencesService";  // domain/service
import { makeGeofencesController } from "../controllers/geofenceController"; // controller

import { attendanceRepo } from "../db/attendance";

//  Events router (top layer). It accepts DI (geofencesController) and internally
//  composes the geofence route file so all event paths are authored here.
import { createEventsRouter } from "../routes/eventsRoutes";

// If your repo needs a db handle/pool, import it here (or pass from caller).
// import { pool } from "../db/pool"; 

// 1) Geofence wiring
// 1a) Build the service with its dependency
const geofencesService = makeGeofencesService({ repo: geofences });

// 1b) Build the controller with the service
const geofencesController = makeGeofencesController({ service: geofencesService });

// 2) Attendance wiring
// 2a) Build the service with its dependecy
// const attendanceService = makeAttendanceService({
//   repo: attendanceRepo,
//   isPointInsideFence: geofences.isPointInsideAnyFence,
// });
// 2b) Build the controller with the service 
//const attendanceController = makeAttendanceController({ service: attendanceService });

// 3) Build and export a ready-to-mount router for /v1/events
export const eventsRouter = createEventsRouter({ 
  geofencesController, 
  //attendanceController,
});