import React, { useState, useEffect } from "react";
import "./css/Homepage.css"; // re-use your existing styles
import "./css/AuthChoice.css";
import "./css/EventList.css";
import { useNavigate, useLocation } from "react-router-dom";
import * as EventHelper from "./helpers/EventHelper";
import * as AlertHelper from "./helpers/AlertHelper";
import HomepageHeader from "./components/HomepageHeader";
import EventList from "./components/EventList";
import useAuthGuard from "./hooks/useAuthGuard";
import GeofenceMap from "./components/GeofenceMap";
import type { Feature } from "geojson";

import * as EventService from "./services/EventService";
import * as AuthService from "./services/AuthService";
import * as UserService from "./services/UserService";

type PublicUser = {
  email: string;
  username: string;
};

type EventDraft = {
  jobName: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
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
  const [geofenceShape, setGeofenceShape] = useState<Feature| null>(null);

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
    setGeofenceShape(null);
  };

  useEffect(() => {
    const raw = AuthService.getUser();
    if(raw){
      setUser(JSON.parse(raw) as PublicUser);
    }

    const token = AuthService.getToken();
    //send user to organizer login
    if (!token) {
      navigate("/User-login", { state: { role } });
      return;
    }

    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await EventService.fetchMyEvents();

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
    const draft = { jobName, startTime, endTime, location, description };
    const error = validateEvent(draft);
    if (error) {
      alert(error);
      return;
    }

    try {
      // Convert local datetime-local values to ISO UTC strings
      const startDate = new Date(startTime)
      const endDate = new Date(endTime)
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        alert(AlertHelper.TIME_FORMATTING_ERROR);
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

      const response = await EventService.createEvent(payload);
    
      if (response.status === 401) { //auto-redirect if timed-out
        alert(AlertHelper.SESSION_EXPIRE_ERROR);
        console.log("401");
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

      alert(AlertHelper.EVENT_CREATED);

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
      alert(AlertHelper.SERVER_ERROR);
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

    const token = AuthService.getToken();
    if (!token) {
      alert(AlertHelper.SESSION_EXPIRE_ERROR);
      navigate("/User-login", { state: { role } });
      return;
    }

    if (!gfName.trim()) {
      alert("Please provide a name for the geofence.");
      return;
    }

    if (!geofenceShape) {
      alert("Please draw a geofence on the map.");
      return;
    }

    const geom = geofenceShape.geometry;
    const props: any = geofenceShape.properties || {};

    let url =
      `${import.meta.env.VITE_API_URL ?? "http://localhost:4000"}` +
      `/v1/events/${createdEventId}/geofences`;
    let body: any;

    // Geoman circle encoding: geometry is Point, properties._pmType === "Circle"
    if (props._pmType === "Circle" && geom.type === "Point") {
      const coords = geom.coordinates as [number, number]; // [lon, lat]
      const lon = coords[0];
      const lat = coords[1];
      const radius_m = props.radius ?? props.radius_m;

      if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(radius_m)) {
        alert("Invalid circle geometry from map.");
        return;
      }

      body = {
        name: gfName.trim(),
        lat,
        lon,
        radius_m,
      };
      url += "/circle";
    } else {
      // Treat anything else as polygon/multipolygon
      if (geom.type !== "Polygon" && geom.type !== "MultiPolygon") {
        alert("Unsupported geometry type. Please draw a polygon or circle.");
        return;
      }

      body = {
        name: gfName.trim(),
        geojson4326: geom, // send full GeoJSON geometry – adjust if your API expects only coordinates
      };
      url += "/polygon";
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.status === 401) {
        alert(AlertHelper.SESSION_EXPIRE_ERROR);
        navigate("/User-login", { state: { role } });
        return;
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        alert(text || "Failed to create geofence.");
        return;
      }

      await res.json().catch(() => undefined);

      alert(
        "Geofence saved! Volunteers will only be able to sign in inside this area."
      );
      resetCreateModal();
    } catch (err) {
      console.error("Create geofence error:", err);
      alert(AlertHelper.SERVER_ERROR);
    }
  };

  const validateEvent = (draft: EventDraft): string | null => {
    if (!draft.jobName.trim()) return AlertHelper.JOB_NAME_ERROR;
    if (!draft.startTime.trim()) return AlertHelper.START_TIME_ERROR;
    if (!draft.endTime.trim()) return AlertHelper.END_TIME_ERROR;
  
    const start = new Date(draft.startTime);
    const end = new Date(draft.endTime);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      if (end <= start) return AlertHelper.TIMING_ERROR;
      if (new Date() > start) return AlertHelper.CAUSALITY_ERROR;
    }
  
    if (!draft.location.trim()) return AlertHelper.LOCATION_ERROR;
    if (!draft.description.trim()) return AlertHelper.DESCRIPTION_ERROR;
  
    return null;
  };


  //handles logging out
  const handleLogout = async (e: React.FormEvent) => {
    e.preventDefault();

    //clear local state
    AuthService.logout();

    try {
      const response = await UserService.logout();

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
      alert(AlertHelper.SERVER_ERROR);
    }
  };

  return (
    <div className="dashboard-container" style={{ alignItems: "stretch" }}>
      {/* Top bar */}
      <HomepageHeader
        title={`Welcome, ${user ? user.username : ""}`}
        subtitle="Organizer Dashboard"
        actions={
          <>
            <button
              className="option-btn primary-action"
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
                setGeofenceShape(null);
              }}
              title="Create a job post"
            >
              <span className="btn-icon">+</span> New Event
            </button>
            <button
              className="option-btn"
              onClick={() =>
                navigate("/Homepage-Organizer/profile", { state: { role } })
              }
              title="Profile & settings"
            >
              <span className="btn-icon">⚙</span> Profile
            </button>

            <button
              className="cancel-btn"
              type="button"
              onClick={handleLogout}
            >
              Sign Out
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

                {/* Interactive map */}
                <div style={{ height: 300, borderRadius: 8, overflow: "hidden" }}>
                  <GeofenceMap
                    value={geofenceShape}
                    onChange={setGeofenceShape}
                  />
                </div>

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
                      onClick={resetCreateModal}
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
