import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./css/MyRegistrations.css";
import { Clock, MapPin } from "lucide-react";
import { cleanEvents } from "./helpers/EventHelper";

type EventPost = {
  id: string;
  jobName: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  createdAtDate: string;
  createdAtTime: string;
};

const MyRegistrations: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("Please log in to view your events.");
      navigate("/User-login?role=Volunteer", { replace: true });
      return;
    }

    (async () => {
      try {
        // If your backend uses a different path, change it here (see backend snippet below)
        const res = await fetch("http://localhost:4000/v1/events?registered=1", {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          alert("Session expired. Please log in again.");
          navigate("/User-login?role=Volunteer", { replace: true });
          return;
        }
        if (!res.ok) {
          const err = await res.text();
          throw new Error(err || "Failed to fetch registered events");
        }

        const raw = await res.json();
        const cleaned = cleanEvents(raw, false);
        setEvents(cleaned);
      } catch (e) {
        console.error("Failed to load registered events:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading) {
    return (
      <main className="myreg-container">
        <h2 className="myreg-title">My Events</h2>
        <p>Loading…</p>
      </main>
    );
  }

  return (
    <main className="myreg-container">
        <div className="myreg-glass">
        <header className="myreg-header">
            <h2 className="myreg-title">My Events</h2>
            <div className="myreg-actions">
            <button className="myreg-btn" onClick={() => navigate("/dashboard")}>
                Back to Dashboard
            </button>
            </div>
        </header>

        {events.length === 0 ? (
            <p className="myreg-empty">You haven’t registered for any events yet.</p>
        ) : (
            <div className="myreg-list">
            {events.map((e) => (
                <article
                key={e.id}
                className="myreg-card"
                onMouseEnter={(el) => {
                    el.currentTarget.style.transform = "translateY(-3px)";
                    el.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.12)";
                }}
                onMouseLeave={(el) => {
                    el.currentTarget.style.transform = "none";
                    el.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.08)";
                }}
                >
                <header className="myreg-card-head">
                    <h3 className="myreg-card-title">{e.jobName}</h3>
                    <small className="myreg-created">
                    {e.createdAtDate} {e.createdAtTime}
                    </small>
                </header>

                <p className="myreg-desc">{e.description}</p>

                <div className="myreg-times">
                    <div><Clock size={16} /> <strong>Starts:</strong> {e.startDate} {e.startTime}</div>
                    <div><Clock size={16} /> <strong>Ends:</strong> {e.endDate} {e.endTime}</div>
                    <div><MapPin size={16} /> <strong>Location:</strong> {e.location}</div>
                </div>
                </article>
            ))}
            </div>
        )}
        </div>    
    </main>
  );
};

export default MyRegistrations;
