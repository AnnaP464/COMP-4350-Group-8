// import type { Request, Response } from "express";
// import type { AttendanceService } from "../contracts/attendance.svc.contracts";
// import type { AttendanceController } from "../contracts/attendance.ctrl.contracts";

// export function makeAttendanceController(deps: {
//   service: AttendanceService;
// }): AttendanceController {
//   const { service } = deps;

//   return {
//     // POST /events/:eventId/attendance/sign-in
//     async signIn(req: Request, res: Response): Promise<void> {
//       const { eventId } = req.params as { eventId: string };
//       const { lon, lat, accuracy_m } = req.body as {
//         lon: number;
//         lat: number;
//         accuracy_m?: number;
//       };

//       const userId = (req as any).user?.id as string | undefined;
//       if (!userId) {
//         res.status(401).json({ message: "Unauthorized" });
//         return;
//       }

//       const result = await service.signIn({
//         eventId,
//         userId,
//         lon,
//         lat,
//         accuracy_m,
//       });

//       if (!result.accepted) {
//         res.status(403).json(result); // {status, accepted:false, reason}
//         return;
//       }

//       res.status(200).json(result);
//     },

//     // POST /events/:eventId/attendance/sign-out
//     async signOut(req: Request, res: Response): Promise<void> {
//       const { eventId } = req.params as { eventId: string };
//       const { lon, lat, accuracy_m } = req.body as {
//         lon: number;
//         lat: number;
//         accuracy_m?: number;
//       };

//       const userId = (req as any).user?.id as string | undefined;
//       if (!userId) {
//         res.status(401).json({ message: "Unauthorized" });
//         return;
//       }

//       const result = await service.signOut({
//         eventId,
//         userId,
//         lon,
//         lat,
//         accuracy_m,
//       });

//       res.status(200).json(result);
//     },

//     // GET /events/:eventId/attendance/status
//     async getStatus(req: Request, res: Response): Promise<void> {
//       const { eventId } = req.params as { eventId: string };
//       const userId = (req as any).user?.id as string | undefined;

//       if (!userId) {
//         res.status(401).json({ message: "Unauthorized" });
//         return;
//       }

//       const result = await service.getStatus({ eventId, userId });
//       res.status(200).json(result);
//     },
//   };
// }
