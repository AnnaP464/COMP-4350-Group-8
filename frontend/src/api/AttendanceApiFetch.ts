/*-------------------------------------------------------------------------------------------------------
Used by MyAttendance to make api calls to 
 1. fetchAttendanceStatus, 
 2. signInToEvent and 
 3. signOutOfEvent
----------------------------------------------------------------------------------------------------------*/

import apiFetch from "./ApiFetch";

import * as AuthService from "../services/AuthService";
import * as UserService from "../services/UserService";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

//backend gives me this when fetching status
export type AttendanceStatus = {
  // eventId: string;
  // userId: string;
  status: {
    isSignedIn: boolean;
    // lastAction: "sign_in" | "sign_out" | null;
    // lastActionAt: string | null;
    totalMinutes: number;
  };
  // window: {
  //   startTime: string;
  //   endTime: string;
  // };
  rules: {
    // now: string;
    canSignIn: boolean;
    canSignOut: boolean;
    reason?: string;
  };
};
  const token = AuthService.getToken();
    //send user to organizer login
    

export async function fetchAttendanceStatus(
  eventId: string
): Promise<AttendanceStatus> {
  const res = await fetch (`${API}/v1/events/${eventId}/attendance/status`, {
     headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
    method: "GET",
  });


  if (!res.ok) {
    throw new Error(`Status fetch failed: ${res.status}`);
  }
  return res.json();
}

type SignBody = {
  lon?: number;
  lat?: number;
  accuracy_m?: number;
};

export async function signInToEvent(
  eventId: string,
  body: SignBody
): Promise<AttendanceStatus> {
  const res = await fetch (`${API}/v1/events/${eventId}/attendance/sign-in`, {
    headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
  const res = await fetch (`${API}/v1/events/${eventId}/attendance/sign-out`, {
    headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
    },
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `Sign-out failed (${res.status})`);
  }
  return res.json();
}
