import React from "react";
import { Clock, MapPin } from "lucide-react";
import "../css/Homepage.css";

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
}

const EventCard: React.FC<EventCardProps> = ({ ev, onClick }) => {
  return (
    <article
      className="event-info-box"
      key={ev.id}
      role={onClick ? "button" : "article"}
      tabIndex={onClick ? 0 : -1}
      onClick={onClick}
      style={{ position: "relative" }}
    >
      <header className="event-header">
        <h3
          style={{
            margin: 0,
            color: "#2c3e50",
            wordBreak: "break-word",
          }}
        >
          {ev.jobName}
        </h3>
        <small style={{ color: "#888" }}>
          {ev.createdAtDate} {ev.createdAtTime}
        </small>
      </header>

      <p
        style={{
          margin: "8px 0 12px",
          color: "#444",
          lineHeight: 1.4,
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
          textAlign: "left",
        }}
      >
        {ev.description}
      </p>

      <div className="job-start-end-times">
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
    </article>
  );
};

export default EventCard;
