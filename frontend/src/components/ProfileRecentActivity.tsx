import React from "react";
import { Calendar, Clock, MapPin } from "lucide-react";

interface Activity {
  id: string | number;
  title: string;
  date: string;
  hours?: number;   // optional for events that don't track hours
  where: string;
}

interface ProfileActivityProps {
  title?: string;
  activities: Activity[];
}

const ProfileRecentActivity: React.FC<ProfileActivityProps> = ({ title = "Recent Activity", activities }) => {
  if (!activities || activities.length === 0) return null;

  return (
    <section className="card">
      <header className="section-head">
        <h2>{title}</h2>
      </header>
      <ol className="timeline">
        {activities.map((a) => (
          <li key={a.id} className="timeline-item">
            <div className="timeline-dot" aria-hidden />
            <div className="timeline-content">
              <h3 className="timeline-title">{a.title}</h3>
              <p className="timeline-meta">
                <Calendar size={14} aria-hidden /> {a.date}
                {a.hours !== undefined && (
                  <>
                    {" "}• <Clock size={14} aria-hidden /> {a.hours} h
                  </>
                )}
                {" "}• <MapPin size={14} aria-hidden /> {a.where}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
};

export default ProfileRecentActivity;
