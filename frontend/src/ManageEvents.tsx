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

type Applicant = { id: string; username: string; email: string; applied_at: string };
type Accepted  = { id: string; username: string; email: string; registered_at: string; decided_at: string };

const ManageEvent: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const loc = useLocation();
  const state = loc.state || {};
  const role = state?.role;

  const [info, setInfo] = useState<EventHelper.CleanEvent | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [accepted, setAccepted] = useState<Accepted[]>([]);
  const [loading, setLoading] = useState(true);

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
        const evRes = await EventService.fetchMyEvents(token);
        const evRows = evRes.ok ? await evRes.json() : [];
        const cleaned = EventHelper.cleanEvents(evRows, false);
        const found = cleaned.find((e: any) => e.id === eventId) || null;
        setInfo(found);

        // 2) Load applicants + accepted lists
        const [appsRes, accRes] = await EventService.fetchApplicants(token, eventId);
        if (appsRes.status === 401 || accRes.status === 401) {
          alert("Session expired.");
          navigate("/User-login", { state: { role } });
          return;
        }
        const apps = appsRes.ok ? await appsRes.json() : [];
        const acc  = accRes.ok ? await accRes.json() : [];
        setApplicants(apps);
        setAccepted(acc);
      } catch (e) {
        console.error(e);
        alert(AlertHelper.EVENT_FETCH_ERROR);
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId, navigate]);

  const accept = async (userId: string) => {
    if(!eventId) return;
    const token = AuthService.getToken();
    const res = await EventService.acceptApplicant(token, eventId, userId);
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
    
    const accRes = await EventService.fetchAcceptedApplicants(token, eventId);
    if (accRes.ok) {
      const acc = await accRes.json();
      setAccepted(acc);              //update the panel immediately
    }
  };

  const reject = async (userId: string) => {
    if(!eventId) return;
    const token = AuthService.getToken();
    const res = await EventService.rejectApplicant(token, eventId, userId);
    if (!res.ok) {
      alert(await res.text());
      return;
    }
    setApplicants(a => a.filter(x => x.id !== userId));
  };

  if (loading) 
    return <main className="myreg-container"><p>Loading…</p></main>;

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

              {/* Accepted box */}
              <div className="myreg-glass accepted-box">
                <h3 className="section-subtitle">
                    Accepted ({accepted.length})
                </h3>

                {accepted.length === 0 ? (
                    <p className="empty-text">No accepted volunteers yet.</p>
                ) : (
                    accepted.map((a) => (
                    <div key={a.id} className="myreg-card applicant-card">
                        <div className="user-line">
                        <strong>{a.username}</strong>
                        <span className="applicant-email">{a.email}</span>
                        </div>
                        <small>
                        Accepted at:{" "}
                        {a.decided_at
                            ? new Date(a.decided_at).toLocaleString()
                            : "-"}
                        </small>
                    </div>
                    ))
                )}
              </div>
          </section>
        </div>
    </main>
    );


};

export default ManageEvent;
