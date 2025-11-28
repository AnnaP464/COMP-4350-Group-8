/*--------------------------------------------------------
given an eventId + event times, handle:

    Current attendance state.

    “Clock in” / “Clock out” functions that:
    Ask for geolocation.
    Call the backend.
    Update state.

--------------------------------------------------------*/

import { useState, useEffect, useCallback } from "react";
import apiFetch from "../api/ApiFetch";
import type { AttendanceState } from "../helpers/AttendanceHelper";

type UseEventClockOpts = {
  eventId: string;
  startTimeIso: string;  // or startDate + startTime, whichever you have
  endTimeIso: string;
};

export function useEventClock({ eventId, startTimeIso, endTimeIso }: UseEventClockOpts) {
  const [status, setStatus] = useState<AttendanceState>("none");
  const [loading, setLoading] = useState(false);

  // Optional: on mount, ask backend if user is currently clocked in
  useEffect(() => {
    (async () => {
      // e.g. const res = await apiFetch(`/v1/events/${eventId}/attendance/me`);
      // setStatus(...) based on response
    })();
  }, [eventId]);

  const clockIn = useCallback(async () => {
    setLoading(true);
    try {
      const coords = await getLocationFromBrowser(); // wraps navigator.geolocation
      const res = await apiFetch(`/v1/events/${eventId}/attendance/sign-in`, {
        method: "POST",
        body: JSON.stringify({
          lat: coords.latitude,
          lon: coords.longitude,
          accuracy: coords.accuracy,
        }),
      });

      if (!res.ok) {
        // TODO: handle 400/403 etc
        return;
      }

      setStatus("clocked-in");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const clockOut = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/v1/events/${eventId}/attendance/sign-out`, {
        method: "POST",
      });

      if (!res.ok) {
        return;
      }
      setStatus("none"); // or "event-ended" depending on server
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  return { status, loading, clockIn, clockOut };
}
