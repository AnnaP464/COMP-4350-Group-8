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

export async function registerUserForEventService(volunteerId: string, eventId: string){

  //first check that the event is not conflicting with the events the user is already registered for
  //get the list of events the user is registered for
  //get their times and check that all their times are not overlapping

  const conflictingEvents = await events.listCollisions(volunteerId, eventId);
  if(conflictingEvents.length != 0){
    throw new Error("There are conflicting events");
  }
  
  return events.registerUserForEvent(volunteerId, eventId);// will return just one row of the event & user ids 
}

export async function listRegisteredEventsService(userId: string) {
  return events.listRegisteredEventsByUser(userId);
}