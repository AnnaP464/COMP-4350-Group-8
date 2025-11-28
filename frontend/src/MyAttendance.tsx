// src/MyAttendance.tsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./css/EventList.css"; // re-use glass layout
import useAuthGuard from "./hooks/useAuthGuard";
import EventCard from "./components/EventCard";
import type { EventWithStatus } from "./components/MyEventList";
import useAccurateMinuteClock from "./hooks/useAccurateMinuteClock";
import formatMinutes from "./helpers/FormatMinutes";
import "./css/MyAttendance.css";

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
  lastSyncedAt: number;
};

type StatusMap = Record<string, StatusEntry | undefined>;

const MyAttendance: React.FC = () => {
  const loc = useLocation();
  const navigate = useNavigate();

  const state = loc.state as AttendanceNavState | undefined;
  const role = state?.role ?? "";
  const items = (state?.items ?? []) as EventWithStatus[];

  // Must be logged in
  const authStatus = useAuthGuard(role);

  const [statuses, setStatuses] = useState<StatusMap>({});

  // Global clock for live display of minutes
  const nowMs = useAccurateMinuteClock();

  // Load status for all accepted events on mount
  useEffect(() => {
    async function load() {
      const next: StatusMap = {};

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

        // If event already ended: no need to hit backend
        if (now > endTime) {
          next[event.id] = {
            data: {
              eventId: event.id,
              userId: userId ?? "unknown",
              status: {
                isSignedIn: false,
                lastAction: null,
                lastActionAt: null,
                totalMinutes: 0,
              },
              window: {
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(endTime).toISOString(),
              },
              rules: {
                now: new Date().toISOString(),
                canSignIn: false,
                canSignOut: false,
                reason: "Event has already ended",
              },
            },
            lastSyncedAt: now,
          };
          continue;
        }

        // Otherwise: active or upcoming → fetch status
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


  if (authStatus !== "authorized") return null;
  
  // Split events using the raw timestamps
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

  const handleClock = (evId: string, entry?: StatusEntry) => {
    const current = entry?.data;

    if (!navigator.geolocation) {
      alert("Geolocation not supported in this browser.");
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
          const isSignedIn = current?.status.isSignedIn;
          const updated = isSignedIn
            ? await signOutFromEvent(evId, body)
            : await signInToEvent(evId, body);

          setStatuses((prev) => ({
            ...prev,
            [evId]: {
              data: updated,
              lastSyncedAt: Date.now(),
            },
          }));
        } catch (err: any) {
          console.error(err);
          alert(err.message || "Clock-in/out failed.");
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        alert("Could not get your location. Please allow location access.");
      }
    );
  };

  return (
    <main className="myreg-container">
      {/* FIRST GLASS — UPCOMING / ACTIVE EVENTS */}
      <div className="myreg-glass">
        <header className="myreg-header">
          <h2 className="myreg-title">Clock in to my events</h2>
          <div className="myreg-actions">
            <button
              className="option-btn"
              onClick={() => navigate("/Dashboard", { state: { role } })}
            >
              Back to Dashboard
            </button>
          </div>
        </header>

        {upcomingOrActive.length === 0 ? (
          <p className="myreg-empty">No active or upcoming events.</p>
        ) : (
          <div className="myreg-list">
            {upcomingOrActive.map((ev: EventWithStatus) => {
              const entry = statuses[ev.id];
              const s = entry?.data;

              const label = !s
                ? "Check status"
                : s.status.isSignedIn
                ? "Clock out"
                : "Clock in";

              const disabled =
                !!s && !s.rules.canSignIn && !s.rules.canSignOut;

              const reason = s?.rules.reason;

              let displayMinutes = s?.status.totalMinutes ?? 0;
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
                    <>
                      <span className="status-line">
                        {s
                          ? s.status.isSignedIn
                            ? "Currently signed in"
                            : "Not signed in"
                          : "Status unknown"}
                        {s &&
                          ` · ${formatMinutes(displayMinutes)} tracked`}
                      </span>

                      <button
                        className="option-btn"
                        type="button"
                        disabled={disabled}
                        onClick={() => handleClock(ev.id, entry)}
                      >
                        {label}
                      </button>

                      {reason && (
                        <span className="reason-text">{reason}</span>
                      )}
                    </>
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      {/* SECOND GLASS — PAST EVENTS */}
      <div className="myreg-glass" style={{ marginTop: "30px" }}>
        <header className="myreg-header">
          <h2 className="myreg-title">Past events</h2>
        </header>

        {pastEvents.length === 0 ? (
          <p className="myreg-empty">No past events.</p>
        ) : (
          <div className="myreg-list">
            {pastEvents.map((ev: EventWithStatus) => (
              <EventCard
                key={ev.id}
                ev={ev}
                variant="myEvents"
                footer={
                  <span className="status-line">Event ended</span>
                }
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default MyAttendance;
