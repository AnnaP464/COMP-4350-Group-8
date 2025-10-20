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
