import React from "react";
import { Clock, MapPin } from "lucide-react";
// import "../css/Homepage.css"; 
// import "../css/EventList.css";  // for .myreg-* styles
import "../css/EventCard.css";


interface EventPost {
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
}

interface EventCardProps {
  ev: EventPost;
  onClick?: () => void; // optional click handler (e.g. navigate)

  /** 
   * Visual style of the card:
   * - "feed"     → green gradient card used on Dashboard/Homepage
   * - "myEvents" → dark glass card matching MyEventList
   */
  variant?: "feed" | "myEvents";

  footer?: React.ReactNode;

  clockMode?: "none" | "my-events";    // tells card to show clock button
  clockState?: AttendanceState;
  onClockIn?: () => void;
  onClockOut?: () => void;
}

const EventCard: React.FC<EventCardProps> = ({
  ev,
  onClick,
  variant = "feed",
  footer,
  clockMode,
  clockState,
  onClockIn,
  onClockOut,
}) => {
  const isMyEvents = variant === "myEvents";

  const rootClass = isMyEvents ? "myreg-card" : "event-info-box";
  const headerClass = isMyEvents ? "myreg-card-head" : "event-header";
  const timesClass = isMyEvents ? "job-time-location" : "job-start-end-times";

  return (
    <article
      className={rootClass}
      role={onClick ? "button" : "article"}
      tabIndex={onClick ? 0 : -1}
      onClick={onClick}
      // for feed cards we keep the original relative positioning; for
      // myEvents we let the CSS from EventList.css handle visuals
      style={isMyEvents ? undefined : { position: "relative" }}
    >
      <header className={headerClass}>
        <h3
          className={isMyEvents ? "myreg-card-title" : undefined}
          style={
            isMyEvents
              ? undefined
              : {
                  margin: 0,
                  color: "#2c3e50",
                  wordBreak: "break-word",
                }
          }
        >
          {ev.jobName}
        </h3>
        <small
          className={isMyEvents ? "myreg-created" : undefined}
          style={isMyEvents ? undefined : { color: "#888" }}
        >
          {ev.createdAtDate} {ev.createdAtTime}
        </small>
      </header>

      <p
        className={isMyEvents ? "myreg-desc" : undefined}
        style={
          isMyEvents
            ? undefined
            : {
                margin: "8px 0 12px",
                color: "#444",
                lineHeight: 1.4,
                wordBreak: "break-word",
                whiteSpace: "pre-wrap",
                textAlign: "left",
              }
        }
      >
        {ev.description}
      </p>

      <div className={timesClass}>
        <div>
          <Clock size={16} /> <strong>Starts at:</strong> {ev.startDate}{" "}
          {ev.startTime}
        </div>
        <div>
          <Clock size={16} /> <strong>Ends at:</strong> {ev.endDate}{" "}
          {ev.endTime}
        </div>
        <div>
          <MapPin size={16} />{" "}
          <strong style={{ wordBreak: "break-word" }}>Location:</strong>{" "}
          {ev.location}
        </div>
      </div>

      {footer && (
        <div className={isMyEvents ? "status-row" : undefined}>{footer}</div>
      )}


      {clockMode === "my-events" && (
        <div className="clock-row">
          {clockState === "clocked-in" ? (
            <button className="option-btn" onClick={onClockOut}>
              Clock out
            </button>
          ) : (
            <button
              className="option-btn"
              onClick={onClockIn}
              disabled={clockState === "too-early" || clockState === "event-ended"}
            >
              {clockState === "not-in-fence" ? "Not in geofence" : "Clock in"}
            </button>
          )}
        </div>
      )}
    </article>
  );
};

export default EventCard;
