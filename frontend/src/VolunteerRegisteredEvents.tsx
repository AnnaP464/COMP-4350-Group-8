import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./css/MyRegistrations.css";
import { Clock, MapPin } from "lucide-react";
import * as EventHelper from "./helpers/EventHelper";
import * as RoleHelper from "./helpers/RoleHelper";

const API_URL = "http://localhost:4000";

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
  const [refreshKey, setRefreshKey] = useState(0);

  const location = useLocation();
  const state = location.state;
  const role = state?.role;

  const handleDeregistration = async (eventId: string) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("Your session has expired. Please log in again.");
        navigate("/" + RoleHelper.LOG_IN, { state: { role } });
        return;
      }

      //verify token before sending request off
      //get token by user id

      const response = await fetch(`${API_URL}/v1/events/deregister`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          eventId: eventId
        })
      });

      if (!response.ok) {
        const err = await response.text();
        alert(`Deregistration failed: ${err}`);
        return;
      }

      if (response.status !== 201) {
        try {
          await response.json();
        } catch (error) {
          console.error("Unexpected JSON package", error);
        }
      }

      setRefreshKey(k => k + 1);

      alert("User has been successfully deregistered for the event");

    } catch (error) {
      console.error("Deregistration Error:", error);
      alert("Network error — could not connect to server.");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("Please log in to view your events.");
      navigate("/" + RoleHelper.LOG_IN, { replace: true, state : { role } });
      return;
    }

    (async () => {
      try {
        // If your backend uses a different path, change it here (see backend snippet below)
        const res = await fetch(`${API_URL}/v1/events?registered=1`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          alert("Session expired. Please log in again.");
          navigate("/" + RoleHelper.LOG_IN, { replace: true, state : { role } });
          return;
        }
        if (!res.ok) {
          const err = await res.text();
          throw new Error(err || "Failed to fetch registered events");
        }

        const raw = await res.json();
        const cleaned = EventHelper.cleanEvents(raw, false);
        setEvents(cleaned);
      } catch (e) {
        console.error("Failed to load registered events:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate, refreshKey]);

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
            <button 
              className="myreg-btn" 
              onClick={() => navigate("/Dashboard", { state: { role } })}
              style= {{backgroundColor:"green"}}
            >
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

                <button
                  onClick={() => handleDeregistration(e.id)}
                  className="option-btn"
                  type="button"
                  style={{ marginTop:12 }}
                >
                Deregister
                </button>
                </article>
            ))}
            </div>
        )}
        </div>    
    </main>
  );
};

export default MyRegistrations;
