import * as events from "../db/events";

export async function createEventService(args: {
  organizerId: string;
  jobName: string;
  description: string;
  startTime: string; // ISO
  endTime: string;   // ISO
  location: string;
}) {
  return events.createEvent(args);
}

export async function listEventsService() {
  return events.listAll();
}

export async function listMyEventsService(organizerId: string) {
  return events.listByOrganizer(organizerId);
}