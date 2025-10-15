import * as events from "../db/events";

export async function create(organizerId: string, body: any) {
  // validate shape (use your validateRequest middleware if you have it)
  const { jobName, description, minCommitment, location } = body;
  if (!jobName || !description || !minCommitment || !location) {
    throw new Error("Missing fields");
  }
  return events.createEvent({ organizerId, jobName, description, minCommitment, location });
}

export async function listMine(organizerId: string) {
  return events.listByOrganizer(organizerId);
}
