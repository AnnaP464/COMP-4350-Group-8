/*------------------------------------------
Lists all the events in the feed area
Uses EventCard.tsx to display each event
---------------------------------------------*/

import React from "react";
import EventCard from "./EventCard";
import "../css/Homepage.css";
import "../css/EventList.css";
import type { CleanEvent } from "../helpers/EventHelper";

type EventPost = CleanEvent;

interface EventListProps {
  title: string;
  events: EventPost[];
  emptyMessage: string;
  renderActions?: (ev: EventPost) => React.ReactNode;
  onCardClick?: (ev: EventPost) => void;
}

const EventList: React.FC<EventListProps> = ({
  title,
  events,
  emptyMessage,
  renderActions,
  onCardClick,
}) => {
  return (
    <div className="myreg-container">
      <main className="myreg-glass">
        <h3 style={{ marginTop: 0 }}>{title}</h3>

        {events.length === 0 ? (
          <div className="empty-postings-box">{emptyMessage}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {events.map((ev) => (
              <div key={ev.id}>
                <EventCard
                  ev={ev}
                  onClick={onCardClick ? () => onCardClick(ev) : undefined}
                />
                {renderActions && renderActions(ev)}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default EventList;
