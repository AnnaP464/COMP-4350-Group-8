import React, { useMemo, useState, useEffect } from "react";
import "./authChoice.css"; // re-use your existing styles
import { useNavigate } from "react-router-dom";

type PublicUser = { 
  email: string; 
  username: string; 
};

type EventPost = {
  id: string;
  jobName: string;
  minCommitment: string;
  location: string;
  description: string;
  createdAt: string;
};

const HomepageOrganizer: React.FC = () => 
{

  const [events, setEvents] = useState<EventPost[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  // Create Event form state
  const [jobName, setJobName] = useState("");
  const [minCommitment, setMinCommitment] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [user, setUser] = React.useState<PublicUser | null>(null);

  const [posts, setPosts] = useState<EventPost[]>([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // //get the user and the list of events it has
  // React.useEffect(() => 
  // {
  //   const raw = localStorage.getItem("user");
  //   if (raw) 
  //     setUser(JSON.parse(raw) as PublicUser);

  //   (async () => {
  //   const res = await fetch("http://localhost:4000/v1/org_events", {
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
  //     },
  //   });
  //   if (res.ok) setEvents(await res.json());
  // })();
  // }, []);


  useEffect(() => 
  {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const raw = localStorage.getItem("user");
    if (raw) 
      setUser(JSON.parse(raw) as PublicUser);

    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:4000/v1/org_events", {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });
        if (!res.ok) {
           return;
        }

        // server may return snake_case; map to your EventPost type
        const rows = await res.json();
        const normalized: EventPost[] = (Array.isArray(rows) ? rows : []).map((r: any) => ({
          id: r.id,
          jobName: r.jobName ?? r.job_name,
          minCommitment: r.minCommitment ?? r.min_commitment,
          location: r.location,
          description: r.description,
          createdAt: r.createdAt ?? r.created_at,
        }));
        setEvents(normalized);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  },[] );






  if (!user) 
    return <div>Loading…</div>;
    //user?.username || user?.email?.split("@")[0] || "Organizer";

  //handles creation of events
  const handleCreate = async (e: React.FormEvent) => 
  {
    e.preventDefault();

    // basic client-side validation
    if (!jobName.trim()) return alert("Job name is required");
    if (!minCommitment.trim()) return alert("Minimum time commitment is required");
    if (!location.trim()) return alert("Location is required");
    if (!description.trim()) return alert("Description is required");

    // prepare payload in the shape your API expects
    const payload = {
      jobName: jobName.trim(),
      minCommitment: minCommitment.trim(),
      location: location.trim(),
      description: description.trim(),
    };

    try {
      const res = await fetch("http://localhost:4000/v1/org_events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) { //auto-redirect if timed-out
        alert("Your session has expired. Please log in again.");
        navigate("/User-login"); 
        return;
      }

      if (!res.ok) {
        const errText = await res.text();
        alert(`Failed to create job: ${errText}`);
        return;
      }

      // Your API might return 201 + JSON of created event, or 204 with no body.
      let created: any = null;
      try {
        created = await res.json();
      } catch {
        // no JSON body (e.g., 204) — fallback to local echo so UI still updates
        created = { ...payload, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      }

      const toEventPost = (row: any): EventPost => ({
        id: row.id,
        jobName: row.jobName ?? row.job_name,
        minCommitment: row.minCommitment ?? row.min_commitment,
        location: row.location,
        description: row.description,
        createdAt: row.createdAt ?? row.created_at ?? new Date().toISOString(),
      });

      const newPost: EventPost = toEventPost(created);

      //update UI
      setEvents(prev => [newPost, ...prev]);
      setShowCreate(false);

      // reset form
      setJobName("");
      setMinCommitment("");
      setLocation("");
      setDescription("");
    } catch (err) {
      console.error("Create job error:", err);
      alert("Network error — could not reach the server.");
    }
  }; //end of event creation handler


  //handles logging out
  const handleLogout = async (e: React.FormEvent) => {
      e.preventDefault();

      //clear local state
      localStorage.removeItem("user");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");

      try {
        const response = await fetch("http://localhost:4000/v1/auth/logout", {
          method: "POST",
          headers: {"Content-Type": "application/json",}
        });
  
        if (!response.ok) {
          const err = await response.text();
          alert(`Log-out failed: ${err}`);
          return;
        }
  
        if(response.status !== 204){
          try{
            const data = await response.json();
          } catch (error){
            console.error("Unexpected JSON package", error);
          }
        }
  
      navigate("/", { replace: true });

        
      } catch (error) {
        console.error("Log-out Error:", error);
        alert("Network error — could not connect to server.");
      }
    }; //log out function ends


//     // create handler
// const handleCreate = async (form: { jobName: string; description: string; minCommitment: string; location: string; }) => 
//   {
//     const res = await fetch("http://localhost:4000/v1/events", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
//       },
//       body: JSON.stringify(form),
//     });
//     if (!res.ok)/* show error */ 
//       return; }
//     const created = await res.json();
//     setEvents(prev => [created, ...prev]); // optimistic update
//   };

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
              HiveHand - {user.username}
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

        {/* Content area: Feed +  Profile panel */}
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
              background: "#3e2b2bff",
              borderRadius: 12,
              padding: 16,
              minHeight: 260,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <h3 style={{ marginTop: 0 }}>{user.username}'s job postings</h3>

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
              <div style={{ display: "grid", gap: 12, textAlign:"left"}}>
                {events.map((ev) => (
                  <article
                    key={ev.id}
                    style={{
                      color: "#111",
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
                    <p style={{ margin: "6px 0 0 0", whiteSpace: "pre-wrap", wordBreak: "break-word",}}>
                      {ev.description}
                      <br></br>
                    {/* </p>
                    <p style={{ margin: "6px 0 0 0" }}> */}
                      <strong>Minimum commitment:</strong> {ev.minCommitment}
                    {/* </p>
                    <p style={{ margin: "6px 0" }}> */}
                      <br></br>
                      <strong>Location:</strong> {ev.location}
                    </p>
                    
                  </article>
                ))}
              </div>
            )}
          </main>

          {/* Profile side panel */}
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
              <div style={{ display: "grid", gap: 8, marginBottom: 12, color: "black"}}>
                <div>
                  <div style={{ fontSize: 12, color: "#666" }}>Organizer</div>
                  <div>{user.username}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#666" }}>Email</div>
                  <div>{user.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    Jobs posted
                  </div>
                  <div>{events.length}</div>
                </div>
                {/* <div>
                  <div style={{ fontSize: 12, color: "#666" }}>Role</div>
                  <div>{user?.role || "Organizer"}</div>
                </div> */}
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
              <br></br>
              <button className="option-btn" type="button" onClick={handleLogout}>
                Log-out
              </button>
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
              background: "#819a91ff",
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
