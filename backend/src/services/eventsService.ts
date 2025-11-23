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

// Volunteer feed
export async function listEventsService() {
  return events.listAll();
}

//Organizer feed (own events)
export async function listMyEventsService(organizerId: string) {
  return events.listByOrganizer(organizerId);
}

// export async function registerUserForEventService(volunteerId: string, eventId: string){

//   //first check that the event is not conflicting with the events the user is already registered for
//   //get the list of events the user is registered for
//   //get their times and check that all their times are not overlapping

//   const conflictingEvents = await events.listCollisions(volunteerId, eventId);
//   if(conflictingEvents.length != 0){
//     throw new Error("There are conflicting events");
//   }
  
//   return events.registerUserForEvent(volunteerId, eventId);// will return just one row of the event & user ids 
// }


/** VOLUNTEER: list events where I’m accepted (registered) */
export async function listRegisteredEventsService(userId: string) {
  return events.listRegisteredEventsByUser(userId);
}

/** VOLUNTEER: apply for an event (idempotent sets status='applied') */
export async function applyForEventService(volunteerId: string, eventId: string) {
  // No collision check here — volunteers can apply to overlapping events
  return events.registerUserForEvent(volunteerId, eventId);
}

/** VOLUNTEER: withdraw application (or deregister) */
export async function withdrawApplicationService(volunteerId: string, eventId: string) {
  // If you want to “soft” withdraw instead of delete, change the DB fn to update status='withdrawn'
  return events.deregisterUserForEvent(volunteerId, eventId);
}

/** VOLUNTEER: list my applications with status */
export async function listMyApplicationsService(userId: string) {
  return events.listMyApplications(userId);
}



/** ORGANIZER: list applicants (status='applied') for an event */
export async function listApplicantsService(eventId: string) {
  return events.listApplicants(eventId);
}

/** ORGANIZER: list accepted (status='accepted') for an event */
export async function listAcceptedService(eventId: string) {
  return events.listAccepted(eventId);
}

/** ORGANIZER: accept an applicant (does collision check here) */
export async function acceptApplicantService(organizerId: string, userId: string, eventId: string) {
  // Only block if there’s a time overlap with the user’s other *accepted* events
  const hasConflict = await events.userHasAcceptedCollision(userId, eventId);
  if (hasConflict) {
    throw new Error("User has a conflicting accepted event");
  }
  return events.acceptApplicant(organizerId, userId, eventId);
}

/** ORGANIZER: reject an applicant */
export async function rejectApplicantService(organizerId: string, userId: string, eventId: string) {
  return events.rejectApplicant(organizerId, userId, eventId);
}