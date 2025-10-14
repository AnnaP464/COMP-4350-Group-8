import React, { useMemo, useState } from "react";
import "./authChoice.css"; // re-use your existing styles

type EventPost = {
  id: string;
  jobName: string;
  minCommitment: string;
  location: string;
  description: string;
  createdAt: string;
};

type UserInfo = {
  email?: string;
  username?: string;
  role?: string;
};

const HomepageOrganizer: React.FC = () => {
  // Try to read the user from localStorage if your login later stores it.
  const user: UserInfo | null = useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const [events, setEvents] = useState<EventPost[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  // Create Event form state
  const [jobName, setJobName] = useState("");
  const [minCommitment, setMinCommitment] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  const organizerName =
    user?.username || user?.email?.split("@")[0] || "Organizer";

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobName.trim()) return alert("Job name is required");
    if (!minCommitment.trim()) return alert("Minimum time commitment is required");
    if (!location.trim()) return alert("Location is required");
    if (!description.trim()) return alert("Description is required");

    const newPost: EventPost = {
      id: crypto.randomUUID(),
      jobName: jobName.trim(),
      minCommitment: minCommitment.trim(),
      location: location.trim(),
      description: description.trim(),
      createdAt: new Date().toISOString(),
    };
    setEvents((prev) => [newPost, ...prev]);
    setShowCreate(false);
    // reset form
    setJobName("");
    setMinCommitment("");
    setLocation("");
    setDescription("");
  };

  return (
    <div className="login-container" style={{ alignItems: "stretch" }}>
      {/* Top bar */}
      <div
        className="login-box"
        style={{
          width: "100%",
          maxWidth: 1200,
          padding: 0,
          background: "transparent",
          boxShadow: "none",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 12px",
            borderBottom: "1px solid #e5e5e5",
            background: "white",
            borderRadius: 12,
          }}
        >
          <div>
            <h2 className="title" style={{ margin: 0 }}>
              HiveHand - {organizerName}
            </h2>
            <p className="subtitle" style={{ marginTop: 4 }}>
              Homepage
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="option-btn"
              onClick={() => setShowCreate(true)}
              title="Create a job post"
            >
              Create Event
            </button>
            <button
              className="guest-btn"
              onClick={() => setShowProfile((s) => !s)}
              title="Profile & settings"
            >
              Profile
            </button>
          </div>
        </header>

        {/* Content area: Feed + optional Profile panel */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: showProfile ? "1fr 320px" : "1fr",
            gap: 16,
            marginTop: 16,
          }}
        >
          {/* Feed */}
          <main
            style={{
              background: "white",
              borderRadius: 12,
              padding: 16,
              minHeight: 260,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Your job postings</h3>

            {events.length === 0 ? (
              <div
                style={{
                  border: "1px dashed #cfcfcf",
                  borderRadius: 12,
                  padding: 20,
                  textAlign: "center",
                  color: "#777",
                }}
              >
                No job postings posted yet.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {events.map((ev) => (
                  <article
                    key={ev.id}
                    style={{
                      border: "1px solid #eee",
                      borderRadius: 12,
                      padding: 14,
                      background: "#fff",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        gap: 8,
                      }}
                    >
                      <h4 style={{ margin: 0 }}>{ev.jobName}</h4>
                      <small style={{ color: "#777" }}>
                        {new Date(ev.createdAt).toLocaleString()}
                      </small>
                    </div>
                    <p style={{ margin: "6px 0 0 0" }}>
                      <strong>Minimum commitment:</strong> {ev.minCommitment}
                    </p>
                    <p style={{ margin: "6px 0" }}>
                      <strong>Location:</strong> {ev.location}
                    </p>
                    <p style={{ margin: "6px 0 0 0", whiteSpace: "pre-wrap" }}>
                      {ev.description}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </main>

          {/* Profile side panel (toggles) */}
          {showProfile && (
            <aside
              style={{
                background: "white",
                borderRadius: 12,
                padding: 16,
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                height: "fit-content",
              }}
            >
              <h3 style={{ marginTop: 0 }}>Profile</h3>
              <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#666" }}>Name</div>
                  <div>{organizerName}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#666" }}>Email</div>
                  <div>{user?.email || "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    Jobs posted
                  </div>
                  <div>{events.length}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#666" }}>Role</div>
                  <div>{user?.role || "Organizer"}</div>
                </div>
              </div>

              <hr style={{ margin: "12px 0" }} />

              <h4 style={{ marginTop: 0 }}>Change password</h4>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  alert("Password change not wired yet (stub).");
                }}
                style={{ display: "grid", gap: 8 }}
              >
                <input
                  className="text-input"
                  type="password"
                  placeholder="Current password"
                />
                <input
                  className="text-input"
                  type="password"
                  placeholder="New password"
                />
                <input
                  className="text-input"
                  type="password"
                  placeholder="Confirm new password"
                />
                <button className="option-btn" type="submit">
                  Update Password
                </button>
              </form>
            </aside>
          )}
        </div>
      </div>

      {/* Create Event modal */}
      {showCreate && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setShowCreate(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.3)",
            display: "grid",
            placeItems: "center",
            padding: 16,
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 560,
              background: "white",
              borderRadius: 12,
              padding: 16,
              boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <h3 style={{ margin: 0 }}>Create a job post</h3>
              <button className="guest-btn" onClick={() => setShowCreate(false)}>
                Close
              </button>
            </div>
            <form
              onSubmit={handleCreate}
              style={{ display: "grid", gap: 10, marginTop: 8 }}
            >
              <input
                className="text-input"
                type="text"
                placeholder="Job name *"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
              />
              <input
                className="text-input"
                type="text"
                placeholder="Minimum time commitment (e.g., 3 hrs/week) *"
                value={minCommitment}
                onChange={(e) => setMinCommitment(e.target.value)}
              />
              <input
                className="text-input"
                type="text"
                placeholder="Location *"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <textarea
                className="text-input"
                placeholder="Job description *"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
              />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="guest-btn"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="option-btn">
                  Post Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomepageOrganizer;
