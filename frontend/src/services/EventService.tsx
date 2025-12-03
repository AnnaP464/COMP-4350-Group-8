import apiFetch from "../api/ApiFetch";

export type Payload = {
  jobName: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
};

export function createEvent(payload: Payload) {
  return apiFetch("/v1/events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchMyEvents() {
  return apiFetch("/v1/events?mine=1", {
    method: "GET",
    headers: { Accept: "application/json" },
  });
}

export function fetchAllEvents() {
  return apiFetch("/v1/events", {
    method: "GET",
    headers: { Accept: "application/json" },
  });
}

export function fetchApplications() {
  return apiFetch("/v1/events/me/applications", {
    headers: { Accept: "application/json" },
  });
}

export function applyToEvent(eventId: string) {
  return apiFetch("/v1/events/apply", {
    method: "POST",
    body: JSON.stringify({ eventId }),
  });
}

export function acceptApplicant(eventId: string, userId: string) {
  return apiFetch(`/v1/events/${eventId}/applicants/${userId}/accept`, {
    method: "PATCH",
  });
}

export function rejectApplicant(eventId: string, userId: string) {
  return apiFetch(`/v1/events/${eventId}/applicants/${userId}/reject`, {
    method: "PATCH",
  });
}

export function fetchApplicants(eventId: string) {
  return Promise.all([
    fetchPendingApplicants(eventId),
    fetchAcceptedApplicants(eventId),
  ]);
}

function fetchPendingApplicants(eventId: string) {
  return apiFetch(`/v1/events/${eventId}/applicants`);
}

export function fetchAcceptedApplicants(eventId: string) {
  return apiFetch(`/v1/events/${eventId}/accepted`);
}

export function deregister(eventId: string) {
  return apiFetch("/v1/events/deregister", {
    method: "DELETE",
    body: JSON.stringify({ eventId }),
  });
}

export function fetchRegisteredEvents() {
  return apiFetch("/v1/events?registered=1", {
    headers: { Accept: "application/json" },
  });
}

export function withdrawFromEvent(eventId: string) {
  return apiFetch("/v1/events/withdraw", {
    method: "DELETE",
    body: JSON.stringify({ eventId }),
  });
}

// ─────────────────────────────────────────────────────────────
// Geofence Management
// ─────────────────────────────────────────────────────────────

export function fetchGeofences(eventId: string) {
  return apiFetch(`/v1/events/${eventId}/geofences`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
}

export function deleteGeofence(geofenceId: string) {
  return apiFetch(`/v1/events/geofences/${geofenceId}`, {
    method: "DELETE",
  });
}

export function createPolygonGeofence(
  eventId: string,
  name: string,
  geojson4326: object
) {
  return apiFetch(`/v1/events/${eventId}/geofences/polygon`, {
    method: "POST",
    body: JSON.stringify({ name, geojson4326 }),
  });
}

export function createCircleGeofence(
  eventId: string,
  name: string,
  lat: number,
  lon: number,
  radius_m: number
) {
  return apiFetch(`/v1/events/${eventId}/geofences/circle`, {
    method: "POST",
    body: JSON.stringify({ name, lat, lon, radius_m }),
  });
}