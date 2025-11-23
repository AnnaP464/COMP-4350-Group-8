import React from "react";
import { Award } from "lucide-react";

interface Badge {
  id: number | string;
  label: string;
  desc?: string;
}

interface ProfileBadgesProps {
  badges: Badge[];
  title?: string; // Optional, defaults to "Badges"
}

const ProfileBadges: React.FC<ProfileBadgesProps> = ({ badges, title = "Badges" }) => {
  if (!badges || badges.length === 0) return null;

  return (
    <section className="card">
      <header className="section-head">
        <h2>
          <Award size={18} aria-hidden /> {title}
        </h2>
      </header>
      <ul className="badge-list">
        {badges.map((b) => (
          <li key={b.id} className="badge chip" title={b.desc}>
            {b.label}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default ProfileBadges;
