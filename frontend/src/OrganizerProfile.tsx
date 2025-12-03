// -------------------------------------------------------------
// src/OrganizerProfile.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Award, Calendar, Clock, MapPin, TrendingUp } from "lucide-react";
import ProfileTopBar from "./components/ProfileTopBar";
import { getAvatarInitials, formatMonthYear } from "./helpers/UserInfoHelper.tsx";
import "./css/VolunteerProfile.css"; // reuse existing styling
import ProfilePreviewDialog from "./components/ProfilePreview"
import ProfileBadges from "./components/ProfileBadges";
import ProfileRecentActivity from "./components/ProfileRecentActivity";
import * as AlertHelper from "./helpers/AlertHelper";
import * as UserService from "./services/UserService";

type Me = { id: string; username: string; email?: string; role: string; createdAt: string };

const OrganizerProfile: React.FC = () => {
  const navigate = useNavigate();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // --- Organizer placeholders (swap in real data later) ---
  const [summary, setSummary] = useState({
    eventsHosted: 12,
    volunteersEngaged: 87,
    upcomingEvents: 3,
    totalHoursProvided: 240,
  });

  const badges = [
    { id: 1, label: "Community Builder", desc: "Hosted 5+ events" },
    { id: 2, label: "Coordinator", desc: "50+ volunteers engaged" },
  ];

  const recentEvents = [
    { id: "e1", title: "Warm Clothing Drive", date: "Oct 30, 2025", where: "Downtown Shelter" },
    { id: "e2", title: "Riverbank Cleanup", date: "Oct 22, 2025", where: "Red River Walk" },
  ];

  useEffect(() => {
    (async () => {
      try {
        const res = await UserService.authMe();
        if (!res.ok) {
          navigate("/User-login", { replace: true, state: { role: "Organizer" } });
          return;
        }
        const data = await res.json();
        setMe(data);
      } catch (e) {
        alert(AlertHelper.PROFILE_FETCH_ERROR);
        navigate("/Homepage-Organizer", { replace: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading) return <main className="vp-container">Loading…</main>;
  if (!me) return <main className="vp-container">Could not load profile.</main>;

  const uiUser = {
    name: me.username,
    role: me.role || "Organizer",
    city: "Winnipeg, MB",
    memberSince: formatMonthYear(me.createdAt),
    avatarInitials: getAvatarInitials(me.username),
  };

  return (
    <main className="vp-container">
      <ProfileTopBar
        name={uiUser.name}
        role={uiUser.role}
        city={uiUser.city}
        memberSince={uiUser.memberSince}
        avatarInitials={uiUser.avatarInitials}
        buttons={[
          {
            label: "Back to homepage",
            variant: "secondary",
            onClick: () => navigate("/Homepage-Organizer"),
          },
          {
            label: "Edit Profile",
            onClick: () => setShowEditDialog(true),
          },
        ]}
      />

      {showEditDialog && (
        <ProfilePreviewDialog
          open={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          user={me}
        />
      )}

      {/* Quick Stats */}
      <section className="vp-grid">
        <article className="stat card">
          <div className="stat-icon"><Clock aria-hidden /></div>
          <div className="stat-body">
            <p className="stat-label">Total Volunteer Hours</p>
            <p className="stat-value">{summary.totalHoursProvided}h</p>
          </div>
        </article>
        <article className="stat card">
          <div className="stat-icon"><TrendingUp aria-hidden /></div>
          <div className="stat-body">
            <p className="stat-label">Volunteers Engaged</p>
            <p className="stat-value">{summary.volunteersEngaged}</p>
          </div>
        </article>
        <article className="stat card">
          <div className="stat-icon"><Calendar aria-hidden /></div>
          <div className="stat-body">
            <p className="stat-label">Upcoming Events</p>
            <p className="stat-value">{summary.upcomingEvents}</p>
          </div>
        </article>
      </section>

      {/* Badges */}
      
      <ProfileBadges badges={badges} title="Organizer Achievements" />

      {/* Recent Events */}
      <ProfileRecentActivity activities={recentEvents} title="Recent Events" />

    </main>
  );
};

export default OrganizerProfile;

