const API_URL = "http://localhost:4000";

export type Payload = {
    jobName: string;
    startTime: string;
    endTime: string;
    location: string;
    description: string;
};

export function createEvent(token: string | null, payload: Payload) {

  const content = fetch(`${API_URL}/v1/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return content;
}

export function fetchMyEvents(token: string | null) {
  const content = fetch(`${API_URL}/v1/events?mine=1`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });
  return content;
}

export function fetchAllEvents() {
  const content = fetch(`${API_URL}/v1/events`, {
    method: "GET",
    headers: {
       "Accept": "application/json" 
    }
  });
  return content;
}

export function fetchApplications(token: string | null) {
  const content = fetch(`${API_URL}/v1/events/me/applications`, {
    headers: { 
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  return content;
}

export function applyToEvent(token: string | null, eventId: string) {
  const content = fetch(`${API_URL}/v1/events/apply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      eventId: eventId
    })
  });
  return content;
}

export function acceptApplicant(token: string | null, eventId: string, userId: string) {
  const content = fetch(`${API_URL}/v1/events/${eventId}/applicants/${userId}/accept`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` }
  });
  return content;
}

export function rejectApplicant(token: string | null, eventId: string, userId: string) {
  const content = fetch(`${API_URL}/v1/events/${eventId}/applicants/${userId}/reject`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` }
  });
  return content;
}

export function fetchApplicants(token: string | null, eventId: string) {
  const applicants = Promise.all([
    fetchPendingApplicants(token, eventId),
    fetchAcceptedApplicants(token, eventId),
  ]);
  return applicants;
}

function fetchPendingApplicants(token: string | null, eventId: string) {
  const content = fetch(`${API_URL}/v1/events/${eventId}/applicants`, { 
    headers: {
       Authorization: `Bearer ${token}` 
    } 
  });
  return content;
}

export function fetchAcceptedApplicants (token: string | null, eventId: string) {
  const content = fetch(`${API_URL}/v1/events/${eventId}/accepted`, { 
    headers: { 
      Authorization: `Bearer ${token}` 
    } 
  });
  return content;
}

export function deregister(token: string | null, eventId: string) {
  const content = fetch(`${API_URL}/v1/events/deregister`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      eventId: eventId
    })
  });
  return content;
}

export function fetchRegisteredEvents(token: string | null){
  const content = fetch(`${API_URL}/v1/events?registered=1`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return content;
}

export function withdrawFromEvent(token: string | null, eventId: string) {
  const content = fetch(`${API_URL}/v1/events/withdraw`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ eventId }),
  });
  return content;
}