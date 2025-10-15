
import { pool } from "./connect";

export type EventRow = {
  id: string;
  organizer_id: string;
  job_name: string;
  description: string;
  min_commitment: string;
  location: string;
  created_at: string;
};

export async function createEvent(input: {
  organizerId: string;
  jobName: string;
  description: string;
  minCommitment: string;
  location: string;
}): Promise<EventRow> {
  const { rows } = await pool.query<EventRow>(
    `INSERT INTO events (organizer_id, job_name, description, min_commitment, location)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [input.organizerId, input.jobName, input.description, input.minCommitment, input.location]
  );
  return rows[0];
}

export async function listByOrganizer(organizerId: string): Promise<EventRow[]> {
  const { rows } = await pool.query<EventRow>(
    `SELECT * FROM events
     WHERE organizer_id = $1
     ORDER BY created_at DESC`,
    [organizerId]
  );
  return rows;
}
