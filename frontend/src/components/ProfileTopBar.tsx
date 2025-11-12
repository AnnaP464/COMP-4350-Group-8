/** ------------------------------------------------------- 
 Reusable top bar/header for Volunteer & Organizer profiles 
 -----------------------------------------------------------* */

import React from "react";
import { Calendar, MapPin, User } from "lucide-react";
import "../css/VolunteerProfile.css"
export type TopBarButton = {
  label: string;
  variant?: "primary" | "secondary";
  onClick: () => void;
};

export type ProfileTopBarProps = {
  name: string;
  role: string;
  city: string;
  memberSince: string;
  avatarInitials: string;
  buttons: TopBarButton[]; // e.g., [Back, Edit]
};

const ProfileTopBar: React.FC<ProfileTopBarProps> = ({
  name,
  role,
  city,
  memberSince,
  avatarInitials,
  buttons,
}) => {
  return (
    <section className="vp-hero card">
      <div className="vp-hero-left">
        <div className="vp-avatar" aria-hidden>
          {avatarInitials}
        </div>
        <div className="vp-id">
          <h1 className="vp-name">
            <User size={18} aria-hidden /> {name}
          </h1>
          <p className="vp-meta">
            {role} | <MapPin size={14} aria-hidden /> {city} |{" "}
            <Calendar size={14} aria-hidden /> Member since {memberSince}
          </p>
        </div>
      </div>
      <div className="vp-hero-actions">
        {buttons.map((b, i) => (
          <button
            key={`${b.label}-${i}`}
            className={`vp-btn ${b.variant === "secondary" ? "secondary" : "primary"}`}
            type="button"
            onClick={b.onClick}
            title={b.label}
          >
            {b.label}
          </button>
        ))}
      </div>
    </section>
  );
};

export default ProfileTopBar;
