// src/MyAttendance.tsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./css/EventList.css"; // re-use glass layout
import useAuthGuard from "./hooks/useAuthGuard";
import EventCard from "./components/EventCard";
import type { EventWithStatus } from "./components/MyEventList";
import useAccurateMinuteClock from "./hooks/useAccurateMinuteClock"; // to live update minutes tracked: reduce backend stress
import formatMinutes from "./helpers/FormatMinutes";
import "./css/MyAttendance.css";
import { MyRegContainer, MyRegSection } from "./components/MyRegLayout";

import {
  fetchAttendanceStatus,
  signInToEvent,
  signOutFromEvent,
} from "./api/AttendanceApiFetch";

import type { AttendanceStatus } from "./api/AttendanceApiFetch";

type AttendanceNavState = {
  role?: string;
  items?: EventWithStatus[];
};

// Per-event local status
type StatusEntry = {
  data: AttendanceStatus;
  lastSyncedAt: number; //attendance minutes fetched from backend
  autoSignedOut?: boolean; //to avoid repeating auto sign out
};

type StatusMap = Record<string, StatusEntry | undefined>;

// Per-event error messages (for geofence failures, etc.)
type ErrorMap = Record<string, string | undefined>;

// Per-event success messages
type SuccessMap = Record<string, string | undefined>;

const MyAttendance: React.FC = () => {
  const loc = useLocation();
  const navigate = useNavigate();

  const state = loc.state as AttendanceNavState | undefined;
  const role = state?.role ?? "";

  //Recv the accepted events via router state from Dashboard
  //??? if state is null, need to fecth from backend
  const items = (state?.items ?? []) as EventWithStatus[];

  // Must be logged in: protected path
  // Checked at the end of all useEffects orelse React complains abt #useeffects
  const authStatus = useAuthGuard(role);

  const [statuses, setStatuses] = useState<StatusMap>({});
  const [errors, setErrors] = useState<ErrorMap>({});
  const [successes, setSuccesses] = useState<SuccessMap>({});


  // Global ticking clock for live display of minutes: mock the real hrs, no continuous fetching needed
  const nowMs = useAccurateMinuteClock();

  // Load status for all accepted events on mount
  //accepted events recvd via srouter state from Dashboard
  useEffect(() => {
    async function load() {
      const next: StatusMap = {};

      //??? Is this the best way to check for user?
      const rawUser = localStorage.getItem("user");
      const userId = rawUser ? JSON.parse(rawUser)?.id : null;

      for (const event of items) {
        const startTime = event.startTimestamp;
        const endTime = event.endTimestamp;
        const now = Date.now();

        // If timestamps are somehow missing, fall back to direct fetch
        if (
          typeof startTime !== "number" ||
          typeof endTime !== "number" ||
          Number.isNaN(startTime) ||
          Number.isNaN(endTime)
        ) {
          try {
            const s = await fetchAttendanceStatus(event.id);
            next[event.id] = {
              data: s,
              lastSyncedAt: now,
            };
          } catch (e) {
            console.warn("status fetch failed for", event.id, e);
          }
          continue;
        }

        // fetch status of all events to get user's sign in/out activities
        try {
          const s = await fetchAttendanceStatus(event.id);
          next[event.id] = {
            data: s,
            lastSyncedAt: now,
          };
        } catch (e) {
          console.warn("status fetch failed for", event.id, e);
        }
      }

      setStatuses(next);
    }

    load();
  }, [items]);


  // Auto sign-out when an event has ended but the user is still signed in
  useEffect(() => {
    const now = nowMs;

    const toAutoSignOut: string[] = [];

    for (const ev of items) {
      const end = ev.endTimestamp;
      if (typeof end !== "number" || Number.isNaN(end)) continue;

      // Only care about events that have ended
      if (end > now) continue;

      const entry = statuses[ev.id];
      const s = entry?.data;

      // Skip if no status, not signed in, or we already auto-signed out
      if (!s?.status.isSignedIn) continue;
      if (entry?.autoSignedOut) continue;

      toAutoSignOut.push(ev.id);
    }

    if (toAutoSignOut.length === 0) return;

    (async () => {
      for (const evId of toAutoSignOut) {
        try {
          // Backend already treats lon/lat as optional; we just need the action.
          const updated = await signOutFromEvent(evId, {});

          setStatuses(prev => ({
            ...prev,
            [evId]: {
              data: updated,
              lastSyncedAt: Date.now(),
              autoSignedOut: true,
            },
          }));
        } catch (err) {
          console.warn("Auto sign-out failed for event", evId, err);
        }
      }
    })();
  }, [nowMs, items, statuses]);


  // protected route
  if (authStatus !== "authorized") return null;
  
  /*---------------------------------------------------------------------------------------------
  Split events using the raw timestamps: upcomingOrActive AND pastEvent 
  -----------------------------------------------------------------------------------------------*/
  const now = Date.now();

  const upcomingOrActive: EventWithStatus[] = items.filter((ev) => {
    const end = ev.endTimestamp;
    if (typeof end !== "number" || Number.isNaN(end)) return true; // keep if unknown
    return end >= now;
  });

  const pastEvents: EventWithStatus[] = items.filter((ev) => {
    const end = ev.endTimestamp;
    if (typeof end !== "number" || Number.isNaN(end)) return false;
    return end < now;
  });

  // Clear error for a specific event after a delay
  const clearError = (evId: string, delay = 5000) => {
    setTimeout(() => {
      setErrors((prev) => ({ ...prev, [evId]: undefined }));
    }, delay);
  };

  // Clear success message for a specific event after a delay
  const clearSuccess = (evId: string, delay = 3000) => {
    setTimeout(() => {
      setSuccesses((prev) => ({ ...prev, [evId]: undefined }));
    }, delay);
  };

  //when Clock in/Clock out clicked, handleClock handles it
  const handleClock = (evId: string, entry?: StatusEntry) => {
    const current = entry?.data;

    // Clear any previous error/success for this event
    setErrors((prev) => ({ ...prev, [evId]: undefined }));
    setSuccesses((prev) => ({ ...prev, [evId]: undefined }));

    if (!navigator.geolocation) {
      setErrors((prev) => ({ ...prev, [evId]: "Geolocation is not supported in this browser." }));
      clearError(evId);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const body = {
          lon: pos.coords.longitude,
          lat: pos.coords.latitude,
          accuracy_m: Math.round(pos.coords.accuracy || 0),
        };

        try {
          // Decide SIGN IN vs SIGN OUT based on current.status.isSignedIn
          const isSignedIn = current?.status.isSignedIn;
          const updated = isSignedIn
            ? await signOutFromEvent(evId, body)
            : await signInToEvent(evId, body);

           // Store the fresh AttendanceStatus for this event
          setStatuses((prev) => ({
            ...prev,
            [evId]: {
              data: updated,
              lastSyncedAt: Date.now(),
            },
          }));

          // Show success message
          const successMsg = isSignedIn
            ? "You've clocked out. Great work!"
            : "You're now clocked in. Have a great shift!";
          setSuccesses((prev) => ({ ...prev, [evId]: successMsg }));
          clearSuccess(evId);
        } catch (err: any) {
          console.error(err);
          const message = err.message || "Clock-in/out failed. Please try again.";
          setErrors((prev) => ({ ...prev, [evId]: message }));
          clearError(evId);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        setErrors((prev) => ({
          ...prev,
          [evId]: "Could not get your location. Please enable location access and try again."
        }));
        clearError(evId);
      }
    );
  };



return (
    <MyRegContainer>
      {/* FIRST GLASS — UPCOMING / ACTIVE EVENTS */}
      <MyRegSection
        title="Clock in to my events"
        actions={
          <button
            className="option-btn"
            onClick={() => navigate("/Dashboard", { state: { role } })}
          >
            Back to Dashboard
          </button>
        }
      >
        {upcomingOrActive.length === 0 ? (
          <p className="myreg-empty">No upcoming or active events.</p>
        ) : (
          <div className="myreg-list">
            {upcomingOrActive.map((ev: EventWithStatus) => {
              const entry = statuses[ev.id];
              const s = entry?.data;
              const lastSyncedAt = entry?.lastSyncedAt ?? 0;

              const label = !s
                ? "Check status"
                : s.status.isSignedIn
                ? "Clock out"
                : "Clock in";

              const disabled = !!s && !s.rules.canSignIn && !s.rules.canSignOut;

              const reason = s?.rules.reason;
              const errorMsg = errors[ev.id];
              const successMsg = successes[ev.id];
              let displayMinutes = s?.status.totalMinutes ?? 0; // Base minutes from the backend (totalMinutes up to last sync)
              
              //If user is currently signed in, add extra minutes since last sync
              if (entry && s?.status.isSignedIn) {
                const extraMs = nowMs - entry.lastSyncedAt;
                if (extraMs > 0) {
                  displayMinutes += Math.floor(extraMs / 60000);
                }
              }

              return (
                <EventCard
                  key={ev.id}
                  ev={ev}
                  variant="myEvents"
                  footer={
                    <div className="footer-wrapper">
                      <div className="footer-main">
                        <span className="status-line">
                          {s
                            ? s.status.isSignedIn
                              ? "Currently signed in"
                              : "Not signed in"
                            : "Status unknown"}
                          {s && ` · ${formatMinutes(displayMinutes)} tracked`}
                        </span>

                        <button
                          className="option-btn"
                          type="button"
                          disabled={disabled}
                          onClick={() => handleClock(ev.id, entry)}
                        >
                          {label}
                        </button>
                      </div>
                      {reason && (
                        <span className="reason-text">{reason}</span>
                      )}
                      {errorMsg && (
                        <div className="error-toast">
                          <span className="error-icon">📍</span>
                          <span>{errorMsg}</span>
                        </div>
                      )}
                      {successMsg && (
                        <div className="success-toast">
                          <span className="success-icon">✓</span>
                          <span>{successMsg}</span>
                        </div>
                      )}
                    </div>
                  }
                />
              );
            })}
          </div>
        )}
      </MyRegSection>

      {/* SECOND GLASS — PAST EVENTS */}
      <MyRegSection
        title="Past events"
        style={{ marginTop: "30px" }}
      >
        {pastEvents.length === 0 ? (
          <p className="myreg-empty">No past events.</p>
        ) : (
          <div className="myreg-list">
            {pastEvents.map((ev: EventWithStatus) => {
              const entry = statuses[ev.id];
              const s = entry?.data;
              const minutes = s?.status.totalMinutes ?? 0;

              return (
                <EventCard
                  key={ev.id}
                  ev={ev}
                  variant="myEvents"
                  footer={
                    <span className="status-line">
                      {minutes > 0
                        ? `Tracked ${formatMinutes(minutes)}`
                        : "No attendance recorded"}
                    </span>
                  }
                />
              );
            })}
          </div>
        )}
      </MyRegSection>
    </MyRegContainer>
  );
};

export default MyAttendance;
