import type { AttendanceRepo } from "../contracts/attendance.contracts";
import type {
  AttendanceService,
  AttendanceInput,
  AttendanceResult,
  AttendanceStatus,
} from "../contracts/attendance.svc.contracts";

// We expect a function that answers: is this point inside *any* fence for the event?
type GeofenceChecker = (opts: {
  eventId: string;
  lon: number;
  lat: number;
}) => Promise<boolean>;

export function makeAttendanceService(deps: {
  repo: AttendanceRepo;
  isPointInsideFence: GeofenceChecker;
}): AttendanceService {
  const { repo, isPointInsideFence } = deps;

  async function computeStatus(eventId: string, userId: string): Promise<AttendanceStatus> {
    const last = await repo.getLastAcceptedAction({ eventId, userId });
    if (!last) return "clocked-out";
    return last.action === "sign_in" ? "clocked-in" : "clocked-out";
  }

  return {
    async signIn(input: AttendanceInput): Promise<AttendanceResult> {
      const { eventId, userId, lon, lat, accuracy_m } = input;

      const inside = await isPointInsideFence({ eventId, lon, lat });

      if (!inside) {
        // Log the attempt as not accepted (so you can audit later)
        await repo.insertAction({
          eventId,
          userId,
          action: "sign_in",
          accepted: false,
          accuracy_m,
        });

        return {
          status: "clocked-out",
          accepted: false,
          reason: "NOT_IN_FENCE",
        };
      }

      await repo.insertAction({
        eventId,
        userId,
        action: "sign_in",
        accepted: true,
        accuracy_m,
      });

      return {
        status: "clocked-in",
        accepted: true,
      };
    },

    async signOut(input: AttendanceInput): Promise<AttendanceResult> {
      const { eventId, userId, lon, lat, accuracy_m } = input;

      // up to you if you want to enforce geofence on sign-out;
      // here we just record it and treat status as clocked-out either way.
      const inside = await isPointInsideFence({ eventId, lon, lat });

      await repo.insertAction({
        eventId,
        userId,
        action: "sign_out",
        accepted: inside,
        accuracy_m,
      });

      return {
        status: "clocked-out",
        accepted: inside,
      };
    },

    async getStatus(input: { eventId: string; userId: string }) {
      const status = await computeStatus(input.eventId, input.userId);
      return { status };
    },
  };
}
