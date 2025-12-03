/*--------------------------------------------------------
given an eventId + event times, handle:

    Current attendance state.

    "Clock in" / "Clock out" functions that:
    Ask for geolocation.
    Call the backend.
    Update state.

--------------------------------------------------------*/

import { useState, useEffect, useCallback } from "react";
import apiFetch from "../api/ApiFetch";
import type { AttendanceState } from "../helpers/AttendanceHelper";

type UseEventClockOpts = {
  eventId: string;
};

type UseEventClockReturn = {
  status: AttendanceState;
  loading: boolean;
  error: string | null;
  clockIn: () => Promise<void>;
  clockOut: () => Promise<void>;
};

// Helper: wrap navigator.geolocation in a Promise
function getLocationFromBrowser(): Promise<GeolocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      (err) => reject(err)
    );
  });
}

export function useEventClock({ eventId }: UseEventClockOpts): UseEventClockReturn {
  const [status, setStatus] = useState<AttendanceState>("none");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On mount, fetch current attendance status
  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch(`/v1/events/${eventId}/attendance/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.status?.isSignedIn) {
            setStatus("clocked-in");
          }
        }
      } catch {
        // Ignore - will default to "none"
      }
    })();
  }, [eventId]);

  const clockIn = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const coords = await getLocationFromBrowser();
      const res = await apiFetch(`/v1/events/${eventId}/attendance/sign-in`, {
        method: "POST",
        body: JSON.stringify({
          lat: coords.latitude,
          lon: coords.longitude,
          accuracy_m: coords.accuracy,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message = data.message || "Clock in failed";
        setError(message);

        // Update status based on error if provided
        if (data.status && !data.status.isSignedIn) {
          setStatus("not-in-fence");
        }
        return;
      }

      setStatus("clocked-in");
      setError(null);
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        setError("Could not get your location. Please enable location services.");
      } else {
        setError("Failed to clock in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const clockOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/v1/events/${eventId}/attendance/sign-out`, {
        method: "POST",
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Clock out failed");
        return;
      }

      setStatus("none");
      setError(null);
    } catch {
      setError("Failed to clock out. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  return { status, loading, error, clockIn, clockOut };
}
