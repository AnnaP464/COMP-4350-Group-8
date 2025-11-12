//src/VolunteerProfile.tsx
import React, {useEffect, useState} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Clock,
  CheckCircle2,
  Award,
  Calendar,
  MapPin,
  TrendingUp,
  User,
} from "lucide-react";
import "./css/VolunteerProfile.css";
import ProfilePreviewDialog from "./components/ProfilePreview.tsx";
import {getAvatarInitials, formatMonthYear} from "./helpers/UserInfoHelper.tsx";
import * as RoleHelper from "./helpers/RoleHelper";
import ProfileTopBar from "./components/ProfileTopBar";
import ProfileBadges from "./components/ProfileBadges";
import ProfileRecentActivity from "./components/ProfileRecentActivity";


type Me = { id: string; username: string; email?: string; role: string, createdAt: string};

const VolunteerProfile: React.FC = () => {
  const navigate = useNavigate();

  const [hoursGoal, setHoursGoal] = useState<number | null>(null);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [goalInput, setGoalInput] = useState<string>("");

  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const state = location.state as RoleHelper.AuthChoiceState;
  const role = state?.role;

  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("Please sign in first.");
      navigate("/User-login", { replace: true, state: { role } });
      return;
    }

    const saved = localStorage.getItem("hoursGoal");
    if (saved) {
        const n = Number(saved);
        if (!Number.isNaN(n) && n > 0) 
            setHoursGoal(n);
    }

    (async () => {
      try {
        const res = await fetch("http://localhost:4000/v1/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          alert("Session expired. Please log in again.");
          navigate("/User-login", { replace: true, state: { role } });
          return;
        }
        const data = await res.json();
        setMe(data);
      } catch (e) {
        alert("Failed to load profile.");
        navigate("/Dashboard", { replace: true, state: { role } });
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

if (loading) return <main className="vp-container">Loading…</main>;
if (!me) return <main className="vp-container">Could not load profile.</main>;

  // ---------- PLACEHOLDERS (no fetching) ----------
  const user = {
    name: me.username ?? "Sudipta Sarker",
    role: me.role,
    city: "Winnipeg, MB",
    memberSince: formatMonthYear(me.createdAt),
    avatarInitials: getAvatarInitials(me.username),
  };

  const summary = {
    totalHours: 62,
    jobsCompleted: 17,
    upcomingJobs: 2,
    hoursGoal: 100, // for progress
  };

  const badges = [
    { id: 1, label: "Starter", desc: "Completed first 3 jobs" },
    { id: 2, label: "Tutor", desc: "10 middle school tutoring" },
    { id: 3, label: "Community Lead", desc: "50+ hours" },
  ];

  const recentActivity = [
    {
      id: "a1",
      title: "Food Drive",
      date: "Oct 26, 2025",
      hours: 3,
      where: "Downtown Centre",
    },
  ];

  const progressPct = hoursGoal
  ? Math.min(100, Math.round((summary.totalHours / hoursGoal) * 100))
  : 0;


  return (
    <main className="vp-container">
      {/* Header / Identity */}
      
        
        <ProfileTopBar
          name={me.username}
          role={user.role}
          city={user.city}
          memberSince={user.memberSince}
          avatarInitials={user.avatarInitials}
          buttons={[
            { label: "Back to dashboard", variant: "secondary", onClick: () => navigate("/Dashboard", { state: { role } }) },
            { label: "Edit Profile", onClick: () => setShowEditDialog(true) },
          ]}
        />
        

      {showEditDialog && (
        <ProfilePreviewDialog
          open={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          user={me}
          // onSave={null}
        />
      )}

      {/* Quick Stats */}
      <section className="vp-grid">
        <article className="stat card">
          <div className="stat-icon">
            <Clock aria-hidden />
          </div>
          <div className="stat-body">
            <p className="stat-label">Total Hours</p>
            <p className="stat-value">{summary.totalHours}h</p>
          </div>
        </article>

        <article className="stat card">
          <div className="stat-icon">
            <CheckCircle2 aria-hidden />
          </div>
          <div className="stat-body">
            <p className="stat-label">Jobs Completed</p>
            <p className="stat-value">{summary.jobsCompleted}</p>
          </div>
        </article>

        <article className="stat card">
          <div className="stat-icon">
            <TrendingUp aria-hidden />
          </div>
          <div className="stat-body">
            <p className="stat-label">Upcoming</p>
            <p className="stat-value">{summary.upcomingJobs}</p>
          </div>
        </article>
      </section>

      {/* ------ Progress to Goal ---------------- */}
      <section className="card">
        <header className="section-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
            <h2 style={{ margin: 0 }}>Hours Goal</h2>
            {hoursGoal ? (
                <span className="muted">{summary.totalHours} / {hoursGoal} h</span>
            ) : (
                <span className="muted">No goal set yet</span>
            )}
            </div>
            <button
            className="vp-btn secondary"
            type="button"
            onClick={() => {
                setGoalInput(hoursGoal ? String(hoursGoal) : "");
                setShowGoalDialog(true);
            }}
            title={hoursGoal ? "Change goal" : "Set goal"}
            >
            {hoursGoal ? "Set goal" : "Set goal"}
            </button>
        </header>

        {hoursGoal ? (
            <>
            <div
                className="progress-wrap"
                role="progressbar"
                aria-valuenow={progressPct}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                <div className="progress-bar" style={{ width: `${progressPct}%` }} />
            </div>
            <p className="muted">{progressPct}% complete</p>
            </>
        ) : (
            <p className="muted" style={{ marginTop: 8 }}>
            Set a goal to start tracking your progress.
            </p>
        )}
        </section>

        {/* Set Goal dialog (small window) */}
        {showGoalDialog && (
        <div
            className="create-event-screen"
            role="dialog"
            aria-modal="true"
            onClick={() => setShowGoalDialog(false)}
            style={{ display: "grid", placeItems: "center" }}
        >
            <div
            className="card"
            style={{ width: 360, padding: 16 }}
            onClick={(e) => e.stopPropagation()}
            >
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>{hoursGoal ? "Change Hours Goal" : "Set Hours Goal"}</h3>
              <form
                  onSubmit={(e) => {
                  e.preventDefault();
                  const n = Number(goalInput);
                  if (!Number.isFinite(n) || n <= 0) {
                      alert("Please enter a positive number of hours.");
                      return;
                  }
                  setHoursGoal(n);
                  localStorage.setItem("hoursGoal", String(n));
                  setShowGoalDialog(false);
                  }}
                  style={{ display: "grid", gap: 10 }}
              >
                  <input
                    className="text-input"
                    type="number"
                    min={1}
                    step={1}
                    placeholder="e.g., 100"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    autoFocus
                  />
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button
                      type="button"
                      className="guest-btn"
                      onClick={() => setShowGoalDialog(false)}
                  >
                      Cancel
                  </button>
                  <button type="submit" className="option-btn">
                      Save Goal
                  </button>
                  </div>
              </form>
            </div>
        </div>
        )}

      <div className="vp-columns">

        {/* Badges
        Call ProfileBadges component to display the badges */}
        <ProfileBadges badges={badges} title = "Your badges"/>


        {/* Recent Activity */}
        <ProfileRecentActivity activities={recentActivity} />

      </div>
      
    </main>
  );
};

export default VolunteerProfile;
