import React, { useMemo, useState, useEffect } from "react";
import "./css/Homepage.css"; // re-use your existing styles
import "./css/AuthChoice.css";
import "./css/EventList.css";
import { useNavigate, useLocation } from "react-router-dom";
import * as EventHelper from "./helpers/EventHelper";
import * as ErrorHelper from "./helpers/ErrorHelper";
import HomepageHeader from "./components/HomepageHeader";
import EventList from "./components/EventList";
import useAuthGuard from "./hooks/useAuthGuard";

const API_URL = "http://localhost:4000";

type PublicUser = {
  email: string;
  username: string;
};

const HomepageOrganizer: React.FC = () => {
  const [events, setEvents] = useState<EventHelper.CleanEvent[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  // Wizard step: "event" -> create event, "geofence" -> optional geofence
  const [createStep, setCreateStep] = useState<"event" | "geofence">("event");
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);

  // Step 1 – Create Event form state
  const [jobName, setJobName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  // Step 2 – Geofence form state (optional)
  const [gfName, setGfName] = useState("");
  const [gfLat, setGfLat] = useState("");
  const [gfLon, setGfLon] = useState("");
  const [gfRadius, setGfRadius] = useState("");

  const authStatus = useAuthGuard();
  const [user, setUser] = React.useState<PublicUser | null>(null);

  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const locationState = useLocation();
  const state = locationState.state as { role?: string } | undefined;
  const role = state?.role;

  const navigate = useNavigate();

  // Helper to reset all create modal state when closing
  const resetCreateModal = () => {
    setShowCreate(false);
    setCreateStep("event");
    setCreatedEventId(null);

    setJobName("");
    setStartTime("");
    setEndTime("");
    setLocation("");
    setDescription("");

    setGfName("");
    setGfLat("");
    setGfLon("");
    setGfRadius("");
  };

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      setUser(JSON.parse(raw) as PublicUser);
    }

    const token = localStorage.getItem("access_token");
    //send user to organizer login
    if (!token) {
      navigate("/User-login", { state: { role } });
      return;
    }

    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/v1/events?mine=1`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          return;
        }

        const rows = await response.json();
        const cleanData = EventHelper.cleanEvents(rows, false);
        setEvents(cleanData);
      } catch {
        console.log("The GET event call failed");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [navigate, refreshKey]);

  if (authStatus !== "authorized") {
    return null;
  }

  // STEP 1: handles creation of events
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    // basic client-side validation
    if (!jobName.trim()) return alert(ErrorHelper.JOB_NAME_ERROR);
    if (!startTime.trim()) return alert(ErrorHelper.START_TIME_ERROR);
    if (!endTime.trim()) return alert(ErrorHelper.END_TIME_ERROR);
    if (new Date(endTime) <= new Date(startTime))
      return alert(ErrorHelper.TIMING_ERROR);
    if (new Date() > new Date(startTime))
      return alert(ErrorHelper.CAUSALITY_ERROR);
    if (!location.trim()) return alert(ErrorHelper.LOCATION_ERROR);
    if (!description.trim()) return alert(ErrorHelper.DESCRIPTION_ERROR);

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        alert(ErrorHelper.SESSION_EXPIRE_ERROR);
        navigate("/User-login", { state: { role } });
        return;
      }

      // Convert local datetime-local values to ISO UTC strings
      const startDate = new Date(startTime);
      const endDate = new Date(endTime);
      if (
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(endDate.getTime())
      ) {
        alert("Please choose valid start and end times.");
        return;
      }

      const startISO = startDate.toISOString();
      const endISO = endDate.toISOString();

      // payload for API
      const payload = {
        jobName: jobName.trim(),
        startTime: startISO,
        endTime: endISO,
        location: location.trim(),
        description: description.trim(),
      };

      const response = await fetch(`${API_URL}/v1/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        alert("Your session has expired. Please log in again.");
        navigate("/User-login", { state: { role } });
        return;
      }

      if (!response.ok) {
        const errText = await response.text();
        alert(`Failed to create job: ${errText}`);
        return;
      }

      // Expect the created event back from API
      const created = await response.json().catch((err) => {
        console.error("Unexpected JSON package", err);
        return null;
      });

      alert("Success, Event created!");

      // Refresh the list so new event appears in feed
      setRefreshKey((k) => k + 1);

      // If we got an id, go to Step 2 (geofence)
      if (created && created.id) {
        setCreatedEventId(created.id as string);
        setCreateStep("geofence");
      } else {
        // If for some reason we don't get id, just close as before
        resetCreateModal();
      }
    } catch (err) {
      console.error("Create job error:", err);
      alert(ErrorHelper.SERVER_ERROR);
    }
  };

  // STEP 2: optional geofence creation
  const handleCreateGeofence = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createdEventId) {
      alert("Missing event id. Please create the event again.");
      resetCreateModal();
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      alert(ErrorHelper.SESSION_EXPIRE_ERROR);
      navigate("/User-login", { state: { role } });
      return;
    }

    const lon = Number(gfLon);
    const lat = Number(gfLat);
    const radius_m = Number(gfRadius);

    if (!gfName.trim()) {
      alert("Please provide a name for the geofence.");
      return;
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      alert("Please provide valid latitude and longitude.");
      return;
    }
    if (!Number.isFinite(radius_m) || radius_m <= 0) {
      alert("Please provide a positive radius in meters.");
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/v1/events/${createdEventId}/geofences/circle`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: gfName.trim(),
            lon,
            lat,
            radius_m,
          }),
        }
      );

      if (res.status === 401) {
        alert("Your session has expired. Please log in again.");
        navigate("/User-login", { state: { role } });
        return;
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        alert(text || "Failed to create geofence.");
        return;
      }

      // We don't strictly need the response body here
      await res.json().catch(() => undefined);

      alert("Geofence saved! Volunteers will only be able to sign in inside this area.");
      resetCreateModal();
    } catch (err) {
      console.error("Create geofence error:", err);
      alert(ErrorHelper.SERVER_ERROR);
    }
  };

  //handles logging out
  const handleLogout = async (e: React.FormEvent) => {
    e.preventDefault();

    //clear local state
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    try {
      const response = await fetch(`${API_URL}/v1/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const err = await response.text();
        alert(`Log-out failed: ${err}`);
        return;
      }

      if (response.status !== 204) {
        try {
          await response.json();
        } catch (error) {
          console.error("Unexpected JSON package", error);
        }
      }

      navigate("/", { replace: true });
    } catch (error) {
      console.error("Log-out Error:", error);
      alert(ErrorHelper.SERVER_ERROR);
    }
  };

  return (
    <div className="dashboard-container" style={{ alignItems: "stretch" }}>
      {/* Top bar */}
      <HomepageHeader
        title={`HiveHand - ${user ? user.username : ""}`}
        subtitle="Homepage"
        actions={
          <>
            <button
              className="option-btn"
              onClick={() => {
                setShowCreate(true);
                setCreateStep("event");
                setCreatedEventId(null);
                // reset forms when opening
                setJobName("");
                setStartTime("");
                setEndTime("");
                setLocation("");
                setDescription("");
                setGfName("");
                setGfLat("");
                setGfLon("");
                setGfRadius("");
              }}
              title="Create a job post"
            >
              Create Event
            </button>
            <button
              className="option-btn"
              onClick={() =>
                navigate("/Homepage-Organizer/profile", { state: { role } })
              }
              title="Profile & settings"
            >
              Profile
            </button>

            <button
              className="cancel-btn"
              type="button"
              onClick={handleLogout}
            >
              Log-out
            </button>
          </>
        }
      />

      {/* Feed */}
      <EventList
        title={`${user ? user.username : "Your"}'s job postings`}
        events={events}
        emptyMessage="No job postings posted yet."
        onCardClick={(ev) =>
          navigate(`/ManageEvents/${ev.id}`, { state: { role } })
        }
      />

      {/* Create Event / Geofence wizard modal */}
      {showCreate && (
        <div
          className="create-event-screen"
          role="dialog"
          aria-modal="true"
          onClick={resetCreateModal}
        >
          <div
            className="create-event-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="create-event-title">
              <h3 style={{ margin: 0 }}>
                {createStep === "event"
                  ? "Create a job post"
                  : "Add a geofence (optional)"}
              </h3>
            </div>

            {createStep === "event" && (
              <form
                onSubmit={handleCreateEvent}
                style={{ display: "grid", gap: 10, marginTop: 8 }}
              >
                <input
                  className="text-input"
                  type="text"
                  placeholder="Job name *"
                  value={jobName}
                  onChange={(e) => setJobName(e.target.value)}
                />
                <input
                  id="start-time-input"
                  className="text-input"
                  type="datetime-local"
                  placeholder="Start time *"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
                <input
                  id="end-time-input"
                  className="text-input"
                  type="datetime-local"
                  placeholder="End time *"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
                <input
                  className="text-input"
                  type="text"
                  placeholder="Location *"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
                <textarea
                  className="text-input"
                  placeholder="Job description *"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                />
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    type="button"
                    className="guest-btn"
                    onClick={resetCreateModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="option-btn">
                    Next: Geofence
                  </button>
                </div>
              </form>
            )}

            {createStep === "geofence" && (
              <form
                onSubmit={handleCreateGeofence}
                style={{ display: "grid", gap: 10, marginTop: 8 }}
              >
                <p style={{ marginTop: 0, fontSize: 14 }}>
                  Your event has been created. You can optionally restrict
                  sign-ins to a specific area. Volunteers will need to be inside
                  this geofence to clock in.
                </p>
                <input
                  className="text-input"
                  type="text"
                  placeholder="Geofence name (e.g. Main gate)"
                  value={gfName}
                  onChange={(e) => setGfName(e.target.value)}
                />
                <input
                  className="text-input"
                  type="number"
                  step="0.000001"
                  placeholder="Latitude (e.g. 49.8951)"
                  value={gfLat}
                  onChange={(e) => setGfLat(e.target.value)}
                />
                <input
                  className="text-input"
                  type="number"
                  step="0.000001"
                  placeholder="Longitude (e.g. -97.1384)"
                  value={gfLon}
                  onChange={(e) => setGfLon(e.target.value)}
                />
                <input
                  className="text-input"
                  type="number"
                  min="1"
                  placeholder="Radius in meters (e.g. 100)"
                  value={gfRadius}
                  onChange={(e) => setGfRadius(e.target.value)}
                />
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    justifyContent: "space-between",
                    marginTop: 4,
                  }}
                >
                  <button
                    type="button"
                    className="guest-btn"
                    onClick={resetCreateModal}
                  >
                    Skip geofence
                  </button>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      className="guest-btn"
                      onClick={() => {
                        // let them tweak event again if you want to allow; for now
                        // just go back to viewing their events
                        resetCreateModal();
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="option-btn">
                      Save geofence
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomepageOrganizer;
