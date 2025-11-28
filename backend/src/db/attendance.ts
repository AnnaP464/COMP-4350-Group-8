import { query } from "./connect";
import type {
  AttendanceAction,
  AttendanceRow,
  AttendanceRepo,
} from "../contracts/attendance.contracts";

// If you FIX the location column to geometry(Point, 3857), you can uncomment
// the location insertion part below. For now we keep it simple and leave
// location as NULL to avoid geometry type issues.

export async function insertAction(input: {
  eventId: string;
  userId: string;
  action: AttendanceAction;
  accepted: boolean;
  accuracy_m?: number | null;
}): Promise<AttendanceRow> {
  const { eventId, userId, action, accepted, accuracy_m } = input;

  const { rows } = await query<AttendanceRow>(
    `
    INSERT INTO event_attendance (event_id, user_id, action, accuracy_m, accepted)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, event_id, user_id, action, at_time, accepted
    `,
    [eventId, userId, action, accuracy_m ?? null, accepted]
  );

  return rows[0];
}

export async function getLastAcceptedAction(opts: {
  eventId: string;
  userId: string;
}): Promise<AttendanceRow | null> {
  const { eventId, userId } = opts;

  const { rows } = await query<AttendanceRow>(
    `
    SELECT id, event_id, user_id, action, at_time, accepted
    FROM event_attendance
    WHERE event_id = $1
      AND user_id  = $2
      AND accepted = true
    ORDER BY at_time DESC
    LIMIT 1
    `,
    [eventId, userId]
  );

  return rows[0] ?? null;
}

/** All accepted attendance actions for this user/event, oldest first */
export async function listAcceptedActions(opts: {
  eventId: string;
  userId: string;
}): Promise<AttendanceRow[]> {
  const { eventId, userId } = opts;

  const { rows } = await query<AttendanceRow>(
    `
    SELECT id, event_id, user_id, action, at_time, accepted
    FROM event_attendance
    WHERE event_id = $1
      AND user_id  = $2
      AND accepted = true
    ORDER BY at_time ASC
    `,
    [eventId, userId]
  );

  return rows;
}

export const attendanceRepo: AttendanceRepo = {
  insertAction,
  getLastAcceptedAction,
  listAcceptedActions
};
