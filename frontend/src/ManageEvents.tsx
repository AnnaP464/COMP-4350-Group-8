// src/ManageEvent.tsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Clock, MapPin } from "lucide-react";
import * as RoleHelper from "./helpers/RoleHelper";
import * as EventHelper from "./helpers/EventHelper";
import "./css/Homepage.css";
import "./css/EventList.css";
import "./css/ManageEvents.css";
import EventCard from "./components/EventCard";


const API_URL = "http://localhost:4000";

type Applicant = { id: string; username: string; email: string; applied_at: string };
type Accepted  = { id: string; username: string; email: string; registered_at: string; decided_at: string };

const ManageEvent: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const loc = useLocation();
  const state = (loc.state as RoleHelper.AuthChoiceState) || {};
  const role = state?.role;

  const [info, setInfo] = useState<EventHelper.CleanEvent | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [accepted, setAccepted] = useState<Accepted[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("Please log in.");
      navigate("/User-login", { state: { role } });
      return;
    }
    if (!eventId) {
      alert("Missing event id");
      navigate("/Homepage-Organizer");
      return;
    }

    (async () => {
      try {
        setLoading(true);
        // 1) Load all my events (withCounts) and find this one for quick info
        const evRes = await fetch(`${API_URL}/v1/events?mine=1`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const evRows = evRes.ok ? await evRes.json() : [];
        const cleaned = EventHelper.cleanEvents(evRows, false);
        const found = cleaned.find((e: any) => e.id === eventId) || null;
        setInfo(found);

        // 2) Load applicants + accepted lists
        const [appsRes, accRes] = await Promise.all([
          fetch(`${API_URL}/v1/events/${eventId}/applicants`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/v1/events/${eventId}/accepted`,   { headers: { Authorization: `Bearer ${token}` } }),
        ]);
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
        alert("Failed to load event data.");
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId, navigate]);

  const accept = async (userId: string) => {
    const token = localStorage.getItem("access_token");
    const res = await fetch(`${API_URL}/v1/events/${eventId}/applicants/${userId}/accept`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 409) {
      alert("User has a conflicting accepted event.");
      return;
    }
    if (!res.ok) {
      alert(await res.text());
      return;
    }
    // Move user from applicants -> accepted locally
    setApplicants(a => a.filter(x => x.id !== userId));
    
    // force-refresh the Accepted panel ---
    const accRes = await fetch(`${API_URL}/v1/events/${eventId}/accepted`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (accRes.ok) {
      const acc = await accRes.json();
      setAccepted(acc);              //update the panel immediately
    }
  };

  const reject = async (userId: string) => {
    const token = localStorage.getItem("access_token");
    const res = await fetch(`${API_URL}/v1/events/${eventId}/applicants/${userId}/reject`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` }
    });
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
