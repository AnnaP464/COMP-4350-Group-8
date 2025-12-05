// src/OrganizerProfile.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, TrendingUp } from "lucide-react";
import ProfileTopBar from "./components/ProfileTopBar";
import { getAvatarInitials, formatMonthYear } from "./helpers/UserInfoHelper.tsx";
import "./css/VolunteerProfile.css"; // reuse existing styling
import ProfilePreviewDialog from "./components/ProfilePreview";
import ProfileBadges from "./components/ProfileBadges";
import ProfileRecentActivity from "./components/ProfileRecentActivity";
import * as AlertHelper from "./helpers/AlertHelper";
import * as UserService from "./services/UserService";
import {
  fetchOrganizerStats,
  type OrganizerStats,
} from "./services/AttendanceService";

type Me = {
  id: string;
  username: string;
  email?: string;
  role: string;
  createdAt: string;
};

const OrganizerProfile: React.FC = () => {
  const navigate = useNavigate();
  const [me, setMe] = useState<Me | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const [orgStats, setOrgStats] = useState<OrganizerStats | null>(null);

  const badges = [
    { id: 1, label: "Community Builder", desc: "Hosted 5+ events" },
    { id: 2, label: "Coordinator", desc: "50+ volunteers engaged" },
  ];

  useEffect(() => {
    (async () => {
      try {
        // Fetch identity, profile, + organizer stats in parallel
        const [meRes, profileRes, stats] = await Promise.all([
          UserService.authMe(),
          UserService.fetchProfile(),
          fetchOrganizerStats(),
        ]);

        if (!meRes.ok) {
          navigate("/User-login", {
            replace: true,
            state: { role: "Organizer" },
          });
          return;
        }

        const data = await meRes.json();
        setMe(data);
        setOrgStats(stats);

        // Set avatar URL if profile fetch succeeded
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setAvatarUrl(profileData.avatarUrl || undefined);
        }
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

  const summary = {
    eventsHosted: orgStats?.eventsHosted ?? 0,           // not displayed yet, but ready
    volunteersEngaged: orgStats?.volunteersEngaged ?? 0,
    upcomingEvents: orgStats?.upcomingEvents ?? 0,
    totalHoursProvided: orgStats?.totalHoursProvided ?? 0,
  };

  const recentEvents =
    orgStats?.recentEvents ?? [];

  return (
    <main className="vp-container">
      <ProfileTopBar
        name={uiUser.name}
        role={uiUser.role}
        city={uiUser.city}
        memberSince={uiUser.memberSince}
        avatarInitials={uiUser.avatarInitials}
        avatarUrl={avatarUrl}
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
          <div className="stat-icon">
            <Clock aria-hidden />
          </div>
          <div className="stat-body">
            <p className="stat-label">Total Volunteer Hours</p>
            <p className="stat-value">{summary.totalHoursProvided}h</p>
          </div>
        </article>

        <article className="stat card">
          <div className="stat-icon">
            <TrendingUp aria-hidden />
          </div>
          <div className="stat-body">
            <p className="stat-label">Volunteers Engaged</p>
            <p className="stat-value">{summary.volunteersEngaged}</p>
          </div>
        </article>

        <article className="stat card">
          <div className="stat-icon">
            <Calendar aria-hidden />
          </div>
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
