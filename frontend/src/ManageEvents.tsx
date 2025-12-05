// src/ManageEvent.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import * as EventHelper from "./helpers/EventHelper";
import * as AlertHelper from "./helpers/AlertHelper";
import * as AuthService from "./services/AuthService";
import * as EventService from "./services/EventService";
import "./css/Homepage.css";
import "./css/EventList.css";
import "./css/ManageEvents.css";
import "./css/EventCard.css";

import EventCard from "./components/EventCard";
import GeofenceModal from "./components/GeofenceModal";
import type { GeofenceView } from "./components/GeofenceModal";
import useAuthGuard from "./hooks/useAuthGuard";
import formatMinutes from "./helpers/FormatMinutes";
import type { AttendanceStatus } from "./api/AttendanceApiFetch";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type Applicant = { id: string; username: string; email: string; applied_at: string };
type Accepted  = { id: string; username: string; email: string; registered_at: string; decided_at: string };

type AttendanceMap = Record<string, AttendanceStatus | undefined>;

const ManageEvent: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const loc = useLocation();
  const state = loc.state || {};
  const role = state?.role;

  const authStatus = useAuthGuard(role);

  const [info, setInfo] = useState<EventHelper.CleanEvent | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [accepted, setAccepted] = useState<Accepted[]>([]);
  const [attendanceByUserId, setAttendanceByUserId] = useState<AttendanceMap>({});
  const [loading, setLoading] = useState(true);

  // Geofence state
  const [geofences, setGeofences] = useState<GeofenceView[]>([]);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "delete">("add");
  const [showGeofenceModal, setShowGeofenceModal] = useState(false);

  // Helper: fetch attendance status for all accepted volunteers
  async function loadAcceptedAttendance(
    token: string,
    evId: string,
    acceptedList: Accepted[]
  ) {
    if (!acceptedList.length) {
      setAttendanceByUserId({});
      return;
    }

    const nextMap: AttendanceMap = {};

    await Promise.all(
      acceptedList.map(async (vol) => {
        try {
          const res = await fetch(
            `${API_URL}/v1/events/${evId}/attendance/status?userId=${encodeURIComponent(
              vol.id
            )}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (!res.ok) return;
          const status: AttendanceStatus = await res.json();
          nextMap[vol.id] = status;
        } catch (err) {
          console.warn("Failed to load attendance for user", vol.id, err);
        }
      })
    );

    setAttendanceByUserId(nextMap);
  }

  // Helper: fetch geofences for this event
  async function loadGeofences(evId: string) {
    try {
      const res = await EventService.fetchGeofences(evId);
      if (res.ok) {
        const data: GeofenceView[] = await res.json();
        setGeofences(data);
      }
    } catch (err) {
      console.warn("Failed to load geofences:", err);
    }
  }

  useEffect(() => {
    const token = AuthService.getToken();
    if (!token) {
      alert(AlertHelper.TOKEN_MISSING_ERROR);
      navigate("/User-login", { state: { role } });
      return;
    }
    if (!eventId) {
      alert(AlertHelper.EVENT_ID_MISSING_ERROR);
      navigate("/Homepage-Organizer");
      return;
    }

    (async () => {
      try {
        setLoading(true);
        // 1) Load all my events (withCounts) and find this one for quick info
        const evRes = await EventService.fetchMyEvents();
        const evRows = evRes.ok ? await evRes.json() : [];
        const cleaned = EventHelper.cleanEvents(evRows, false);
        const found = cleaned.find((e: any) => e.id === eventId) || null;
        setInfo(found);

        // 2) Load applicants + accepted lists
        const [appsRes, accRes] = await EventService.fetchApplicants(eventId);

        const apps: Applicant[] = appsRes.ok ? await appsRes.json() : [];
        const acc: Accepted[] = accRes.ok ? await accRes.json() : [];

        setApplicants(apps);
        setAccepted(acc);

        // 3) Load attendance status for each accepted volunteer
        await loadAcceptedAttendance(token, eventId, acc);

        // 4) Load geofences
        await loadGeofences(eventId);
      } catch (e) {
        console.error(e);
        alert(AlertHelper.EVENT_FETCH_ERROR);
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId, navigate, role]);

  //protected route: user needs to log in with valid access token to access this path
  if (authStatus !== "authorized") {
    return null;
  }

  const accept = async (userId: string) => {
    if(!eventId) return;
    const token = AuthService.getToken();
    const res = await EventService.acceptApplicant(eventId, userId);
    if (res.status === 409) {
      alert(AlertHelper.CONFLICTING_EVENT_ERROR);
      return;
    }
    if (!res.ok) {
      alert(await res.text());
      return;
    }

    // Move user from applicants -> accepted locally
    setApplicants(a => a.filter(x => x.id !== userId));

    // force-refresh the Accepted panel ---

    const accRes = await EventService.fetchAcceptedApplicants(eventId);
    if (accRes.ok) {
      const acc: Accepted[] = await accRes.json();
      setAccepted(acc);
      await loadAcceptedAttendance(token!, eventId, acc);
    }
  };

  const reject = async (userId: string) => {
    if(!eventId) return;
    const res = await EventService.rejectApplicant(eventId, userId);
    if (!res.ok) {
      alert(await res.text());
      return;
    }
    setApplicants((a) => a.filter((x) => x.id !== userId));
  };

  // Geofence modal handlers
  const openAddGeofence = () => {
    setModalMode("add");
    setShowGeofenceModal(true);
  };

  const openEditGeofences = () => {
    setModalMode("edit");
    setShowGeofenceModal(true);
  };

  const openDeleteGeofences = () => {
    setModalMode("delete");
    setShowGeofenceModal(true);
  };

  const handleGeofencesChanged = () => {
    if (eventId) {
      loadGeofences(eventId);
    }
  };

  if (loading)
    return (
      <main className="myreg-container">
        <p>Loading…</p>
      </main>
    );

  return (
    <main className="myreg-container">
      <div className="myreg-glass">
        <header className="myreg-header">
          <h2 className="myreg-title">Manage Event</h2>
          <div className="myreg-actions">
            <button className="option-btn" onClick={() => navigate(-1)}>
              Back
            </button>
          </div>
        </header>

        {info && <EventCard ev={info} />}

        {/* Geofence action buttons */}
        <div className="geofence-actions">
          <button className="option-btn" onClick={openAddGeofence}>
            Add Geofence
          </button>
          {geofences.length > 0 && (
            <>
              <button className="option-btn" onClick={openEditGeofences}>
                Edit Geofences ({geofences.length})
              </button>
              <button className="cancel-btn" onClick={openDeleteGeofences}>
                Delete Geofences
              </button>
            </>
          )}
        </div>

        <section className="applicants-section">
          {/* Applicants box */}
          <div className="myreg-glass applicants-box">
            <h3 className="section-subtitle">
              Applicants ({applicants.length})
            </h3>

            {applicants.length === 0 ? (
              <p className="empty-text">No applicants yet.</p>
            ) : (
              applicants.map((a) => (
                <div key={a.id} className="myreg-card applicant-card">
                  <div className="user-line">
                    <strong>{a.username}</strong>
                    <span className="applicant-email">{a.email}</span>
                  </div>
                  <small>
                    Applied at: {new Date(a.applied_at).toLocaleString()}
                  </small>
                  <div className="applicant-actions">
                    <button
                      className="option-btn"
                      onClick={() => accept(a.id)}
                    >
                      Accept
                    </button>
                    <button
                      className="cancel-btn"
                      onClick={() => reject(a.id)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Accepted box (with attendance info) */}
          <div className="myreg-glass accepted-box">
            <h3 className="section-subtitle">
              Accepted ({accepted.length})
            </h3>

            {accepted.length === 0 ? (
              <p className="empty-text">No accepted volunteers yet.</p>
            ) : (
              accepted.map((a) => {
                const status = attendanceByUserId[a.id];
                const isSignedIn = status?.status.isSignedIn ?? false;
                const minutes = status?.status.totalMinutes ?? 0;

                return (
                  <div key={a.id} className="myreg-card applicant-card">
                    <div className="user-line">
                      <strong>{a.username}</strong>
                      <span className="applicant-email">{a.email}</span>
                    </div>
                    <div className="accepted-at-attendance-status">
                    <small>
                      Accepted at:{" "}
                      {a.decided_at
                        ? new Date(a.decided_at).toLocaleString([], { year: "numeric", month: "short", day: "numeric",
                                                                      hour: "2-digit", minute: "2-digit", hour12: true,})
                        : "-"}
                    </small>
                    
                    <small className="status-line">
                      Attendance:{" "}
                      {status
                        ? isSignedIn
                          ? "Currently signed in"
                          : "Not signed in"
                        : "No status yet"}
                      {status && ` · ${formatMinutes(minutes)} tracked`}
                    </small>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Geofence Modal */}
      {eventId && (
        <GeofenceModal
          eventId={eventId}
          mode={modalMode}
          isOpen={showGeofenceModal}
          onClose={() => setShowGeofenceModal(false)}
          onGeofencesChanged={handleGeofencesChanged}
        />
      )}
    </main>
  );
};

export default ManageEvent;
