/*-------------------------------------------------------------------------------------------------------
Used by MyAttendance to make api calls to
 1. fetchAttendanceStatus,
 2. signInToEvent and
 3. signOutOfEvent
----------------------------------------------------------------------------------------------------------*/

import apiFetch from "./ApiFetch";

//backend gives me this when fetching status
export type AttendanceStatus = {
  status: {
    isSignedIn: boolean;
    totalMinutes: number;
  };
  rules: {
    canSignIn: boolean;
    canSignOut: boolean;
    reason?: string;
  };
};

type SignBody = {
  lon?: number;
  lat?: number;
  accuracy_m?: number;
};

export async function fetchAttendanceStatus(
  eventId: string
): Promise<AttendanceStatus> {
  const res = await apiFetch(`/v1/events/${eventId}/attendance/status`, {
    method: "GET",
  });

  if (!res.ok) {
    throw new Error(`Status fetch failed: ${res.status}`);
  }
  return res.json();
}

export async function signInToEvent(
  eventId: string,
  body: SignBody
): Promise<AttendanceStatus> {
  const res = await apiFetch(`/v1/events/${eventId}/attendance/sign-in`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `Sign-in failed (${res.status})`);
  }
  return res.json();
}

export async function signOutFromEvent(
  eventId: string,
  body: SignBody
): Promise<AttendanceStatus> {
  const res = await apiFetch(`/v1/events/${eventId}/attendance/sign-out`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `Sign-out failed (${res.status})`);
  }
  return res.json();
}
