import { query } from "./connect";

// Shape your code already expects in TS
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

export async function listCollisions(userId: string, eventId: string): Promise<EventRow[]> {
  const {rows} = await query<EventRow>(
    `
    SELECT 1
    FROM registered_users ru
    JOIN events e1 ON e1.id = ru.event_id
    where ru.user_id = $1
    AND EXISTS (
      SELECT 1
      FROM events e2
      WHERE e2.id = $2
      AND e1.id <> e2.id
      AND e1.start_time < e2.end_time
      AND e1.end_time > e2.start_time
    )
    LIMIT 1;
    `,
    [userId, eventId]
  );
  return rows
}

export async function registerUserForEvent(userId: string, eventId: string): Promise<EventRow | null>{
  try{
    const {rows} = await query<EventRow>(
      `
      INSERT INTO registered_users (user_id, event_id)
      VALUES ($1,$2)
      RETURNING
      user_id AS "userID",
      event_id AS "eventID"
      `,
      [userId, eventId]
    );

    return rows[0];
  } catch (error){
    console.log("The user is already registered for this event: " + error);
    return null;
  }
}
