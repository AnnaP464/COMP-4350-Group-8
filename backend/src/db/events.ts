import { query } from "./connect";

export type EventRow = {
  id: string;
  organizerId: string;
  jobName: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  createdAt: string;
};

export async function createEvent(input: {
  organizerId: string;
  jobName: string;
  description: string;
  startTime: string; // ISO
  endTime: string;   // ISO
  location: string;
}): Promise<EventRow> {
  const { rows } = await query<EventRow>(
    `
    INSERT INTO events (organizer_id, job_name, description, start_time, end_time, location)
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING
      id,
      organizer_id AS "organizerId",
      job_name     AS "jobName",
      description,
      start_time   AS "startTime",
      end_time     AS "endTime",
      location,
      created_at   AS "createdAt"
    `,
    [input.organizerId, input.jobName, input.description, input.startTime, input.endTime, input.location]
  );
  return rows[0];
}

export async function listByOrganizer(organizerId: string): Promise<EventRow[]> {
  const { rows } = await query<EventRow>(
    `
    SELECT
      id,
      organizer_id AS "organizerId",
      job_name     AS "jobName",
      description,
      start_time   AS "startTime",
      end_time     AS "endTime",
      location,
      created_at   AS "createdAt"
    FROM events
    WHERE organizer_id = $1
    ORDER BY created_at DESC
    `,
    [organizerId]
  );
  return rows;
}

export async function listAll(): Promise<EventRow[]> {
  const { rows } = await query<EventRow>(
    `
    SELECT
      id,
      organizer_id AS "organizerId",
      job_name     AS "jobName",
      description,
      start_time   AS "startTime",
      end_time     AS "endTime",
      location,
      created_at   AS "createdAt"
    FROM events
    ORDER BY created_at DESC
    `
  );
  return rows;
}


/** 
 * If user already has an ACCEPTED event that overlaps the given event,
 * return conflict
 * Overlap rule: e1.start < e2.end AND e1.end > e2.start
 */
export async function userHasAcceptedCollision(
  userId: string,
  eventId: string
): Promise<boolean> {
  const { rows } = await query<{ exists: boolean }>(
    `
    SELECT EXISTS (
      SELECT 1
      FROM registered_users ru
      JOIN events e1 ON e1.id = ru.event_id
      WHERE ru.user_id = $1
        AND ru.status = 'accepted'
        AND EXISTS (
          SELECT 1
          FROM events e2
          WHERE e2.id = $2
            AND e1.id <> e2.id
            AND e1.start_time < e2.end_time
            AND e1.end_time   > e2.start_time
        )
    ) AS exists
    `,
    [userId, eventId]
  );
  return rows[0]?.exists ?? false;
}


export async function registerUserForEvent(
  userId: string,
  eventId: string
): Promise<{ outcome: 'inserted' | 'already_applied' | 'already_accepted' | 'rejected' | 'event_not_found'; row: any | null }> {
  
  //First check that the event exists
  const eventResult = await query(
    `SELECT id FROM events WHERE id = $1`,
    [eventId]
  );

  if (eventResult.rowCount === 0) {
    // No such event
    return { outcome: "event_not_found", row: null };
  }
  
  // Single SQL that either inserts or returns an outcome describing why it didn't.
  const { rows } = await query(
    `
    WITH existing AS (
      SELECT status
      FROM registered_users
      WHERE user_id = $1 AND event_id = $2
    ),
    ins AS (
      INSERT INTO registered_users (user_id, event_id, status, applied_at)
      SELECT $1, $2, 'applied', now()
      WHERE NOT EXISTS (SELECT 1 FROM existing)
      RETURNING
        'inserted'::text AS outcome,
        user_id   AS "userID",
        event_id  AS "eventID",
        status,
        applied_at AS "appliedAt"
    )
    SELECT outcome, "userID","eventID",status,"appliedAt"
    FROM ins
    UNION ALL
    SELECT
      CASE
        WHEN status = 'applied'  THEN 'already_applied'
        WHEN status = 'accepted' THEN 'already_accepted'
        WHEN status = 'rejected' THEN 'rejected'
      END AS outcome,
      $1::uuid AS "userID",
      $2::uuid AS "eventID",
      status,
      NULL::timestamptz AS "appliedAt"
    FROM existing
    LIMIT 1;
    `,
    [userId, eventId]
  );

  const row = rows[0];
  // outcome is always present; when inserted you'll also get appliedAt
  return { outcome: row.outcome, row };
}


export async function acceptApplicant(organizerId: string, userId: string, eventId: string) {
  const { rows } = await query(
    `UPDATE registered_users
       SET status='accepted', decided_at=now(), decided_by=$1
     WHERE user_id=$2 AND event_id=$3
     RETURNING *`,
    [organizerId, userId, eventId]
  );
  return rows[0] ?? null;
}

export async function rejectApplicant(organizerId: string, userId: string, eventId: string) {
  const { rows } = await query(
    `UPDATE registered_users
       SET status='rejected', decided_at=now(), decided_by=$1
     WHERE user_id=$2 AND event_id=$3
     RETURNING *`,
    [organizerId, userId, eventId]
  );
  return rows[0] ?? null;
}


export async function listApplicants(eventId: string) {
  const { rows } = await query(
    `SELECT u.id, u.username, u.email, ru.applied_at
       FROM registered_users ru
       JOIN users u ON u.id = ru.user_id
      WHERE ru.event_id=$1 AND ru.status='applied'
      ORDER BY ru.applied_at ASC`,
    [eventId]
  );
  return rows;
}


export async function listAccepted(eventId: string) {
  const { rows } = await query(
    `SELECT u.id, u.username, u.email, ru.registered_at, ru.decided_at
       FROM registered_users ru
       JOIN users u ON u.id = ru.user_id
      WHERE ru.event_id=$1 AND ru.status='accepted'
      ORDER BY ru.decided_at ASC NULLS LAST, ru.registered_at ASC`,
    [eventId]
  );
  return rows;
}

export async function listMyApplications(userId: string) {
  const { rows } = await query(
    `SELECT ru.event_id, e.job_name, e.start_time, e.end_time, ru.status, ru.applied_at, ru.decided_at
       FROM registered_users ru
       JOIN events e ON e.id = ru.event_id
      WHERE ru.user_id=$1
      ORDER BY e.start_time DESC`,
    [userId]
  );
  return rows;
}
export async function deregisterUserForEvent(userId: string, eventId: string): Promise<EventRow>{
  const { rows } = await query<EventRow>(
    `
    DELETE
    FROM registered_users as ru
    WHERE ru.user_id = $1 AND ru.event_id = $2
    RETURNING 
    user_id AS "userID",
    event_id AS "eventID"
    `,
    [userId, eventId]
  );

  return rows[0];
}

export async function listRegisteredEventsByUser(userId: string): Promise<EventRow[]> {
  const { rows } = await query<EventRow>(
    `
    SELECT
      e.id,
      e.organizer_id AS "organizerId",
      e.job_name     AS "jobName",
      e.description,
      e.start_time   AS "startTime",
      e.end_time     AS "endTime",
      e.location,
      e.created_at   AS "createdAt"
    FROM registered_users ru
    JOIN events e ON e.id = ru.event_id
    WHERE ru.user_id = $1
      AND ru.status = 'accepted'
    ORDER BY e.start_time ASC
    `,
    [userId]
  );
  return rows;
}

