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

/**
 * Get all accepted attendance actions for a user across ALL events,
 * along with each event's end_time so we can cap hours properly.
 * Grouped by event, ordered by event then time.
 */
export type AttendanceWithEventEnd = AttendanceRow & { eventEndTime: string };

export async function listAllAcceptedActionsForUser(
  userId: string
): Promise<AttendanceWithEventEnd[]> {
  const { rows } = await query<AttendanceWithEventEnd>(
    `
    SELECT
      ea.id,
      ea.event_id,
      ea.user_id,
      ea.action,
      ea.at_time,
      ea.accepted,
      e.end_time AS "eventEndTime"
    FROM event_attendance ea
    JOIN events e ON e.id = ea.event_id
    WHERE ea.user_id = $1
      AND ea.accepted = true
    ORDER BY ea.event_id, ea.at_time ASC
    `,
    [userId]
  );

  return rows;
}

/**
 * Count completed events for a user (accepted events that have ended)
 */
export async function countCompletedEventsForUser(userId: string): Promise<number> {
  const { rows } = await query<{ count: string }>(
    `
    SELECT COUNT(DISTINCT ru.event_id)::text AS count
    FROM registered_users ru
    JOIN events e ON e.id = ru.event_id
    WHERE ru.user_id = $1
      AND ru.status = 'accepted'
      AND e.end_time < NOW()
    `,
    [userId]
  );
  return parseInt(rows[0]?.count ?? "0", 10);
}

/**
 * Count upcoming events for a user (accepted events that haven't started yet)
 */
export async function countUpcomingEventsForUser(userId: string): Promise<number> {
  const { rows } = await query<{ count: string }>(
    `
    SELECT COUNT(DISTINCT ru.event_id)::text AS count
    FROM registered_users ru
    JOIN events e ON e.id = ru.event_id
    WHERE ru.user_id = $1
      AND ru.status = 'accepted'
      AND e.start_time > NOW()
    `,
    [userId]
  );
  return parseInt(rows[0]?.count ?? "0", 10);
}

export const attendanceRepo: AttendanceRepo = {
  insertAction,
  getLastAcceptedAction,
  listAcceptedActions
};
