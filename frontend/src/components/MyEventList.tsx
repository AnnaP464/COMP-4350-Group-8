/*--------------------------------------------------------------------
Volunteer's Events Lists

Receives list of events and prints them with status of application

Called by:
    1. MyApplications.tsx
          - MyApplications.tsx passes the applied/rejected list

    2. MyRegisterEvents.tsx
          - MyRegistered.tsx passes the accepted list
          
-------------------------------------------------------------------*/

import React, { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Clock, MapPin } from "lucide-react";
import "../css/EventList.css";
import * as RoleHelper from "../helpers/RoleHelper";

const API_URL = "http://localhost:4000";

export type EventPost = {
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

export type AppStatus = "applied" | "accepted" | "rejected" | "withdrawn";

export type EventWithStatus = EventPost & { status: AppStatus };

interface MyEventListProps {
  /** Page title */
  title: string;
  /** Events to render, each with a status */
  items?: EventWithStatus[];
  /** Display mode: accepted (registered) or applications (applied/rejected) */
  mode: "accepted" | "applications";
}

/**
 * A single page that renders a list of events (with status) passed via location.state or props.
 * - If items are not provided via props, reads them from location.state.items
 * - No fetch here (Dashboard already fetched and filtered)
 */
const MyEventList: React.FC<MyEventListProps> = ({
  title,
  items,
  mode,
}) => {
  const navigate = useNavigate();
  const loc = useLocation();
  const state = loc.state as (RoleHelper.AuthChoiceState & { items?: EventWithStatus[] }) | undefined;
  const role = state?.role;

  // Prefer explicit props, else read from navigation state
  const initial = useMemo<EventWithStatus[]>(
    () => (items ?? state?.items ?? []),
    [items, state]
  );
  const [list, setList] = useState<EventWithStatus[]>(initial);

  const handleWithdraw = async (eventId: string) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("Your session has expired. Please log in again.");
        navigate("/User-login", { state: { role } });
        return;
      }

      const res = await fetch(`${API_URL}/v1/events/withdraw`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ eventId }),
      });

      if (!res.ok) {
        const err = await res.text();
        alert(`Withdraw failed: ${err}`);
        return;
      }

      // Optimistic update: remove/mark withdrawn locally
      setList((prev) => prev.filter((e) => e.id !== eventId));
      alert("Withdrawn successfully.");
    } catch (e) {
      console.error("Withdraw error:", e);
      alert("Network error — could not connect to server.");
    }
  };

  return (
    <main className="myreg-container">
      <div className="myreg-glass">
        <header className="myreg-header">
          <h2 className="myreg-title">{title}</h2>
          <div className="myreg-actions">
            <button
              className="option-btn"
              onClick={() => navigate("/Dashboard", { state: { role } })}
            >
              Back to Dashboard
            </button>
          </div>
        </header>

        {list.length === 0 ? (
          <p className="myreg-empty">
            {mode === "accepted"
              ? "You haven’t registered for any events yet."
              : "No applications to show."}
          </p>
        ) : (
            <div className="myreg-list"> {list.map((e) => (
            
                <article
                    key={e.id}
                    className="myreg-card"
                >
                    <header className="myreg-card-head">
                    <h3 className="myreg-card-title">{e.jobName}</h3>
                    <small className="myreg-created">
                        {e.createdAtDate} {e.createdAtTime}
                    </small>
                    </header>

                    <p className="myreg-desc">{e.description}</p>

                    <div className="job-time-location">
                        <div> <span className="icon"><Clock  /></span> <strong>Starts at:</strong> {e.startDate} {e.startTime}   </div>
                        <div> <span className="icon"><Clock  /></span> <strong>Ends at:</strong> {e.endDate}  {e.endTime}      </div>
                        <div> <span className="icon"><MapPin /></span> <strong style={{ wordBreak: "break-word" }}>Location:</strong> {e.location} </div>
                    </div>

                    {/* status badge */}
                    <div className="status-row">
                        <span className="status-line">
                            Status: <strong>{e.status}</strong>
                        </span>

                        {e.status !== "rejected" && (
                        <button
                            onClick={() => handleWithdraw(e.id)}
                            className="cancel-btn"
                            type="button"
                        >
                            Withdraw
                        </button>
                    )}
                    </div>
                    
                </article>
                
            ))}
            </div>
        )}
      </div>
    </main>
  );

};

export default MyEventList;
