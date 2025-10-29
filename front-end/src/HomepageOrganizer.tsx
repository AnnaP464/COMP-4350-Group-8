import React, { useMemo, useState, useEffect } from "react";
import "./css/HomepageOrganizer.css"; // re-use your existing styles
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { Clock, MapPin, Calendar } from "lucide-react";
import * as EventHelper from "./helpers/EventHelper";
import * as RoleHelper from "./helpers/RoleHelper";

type PublicUser = { 
  email: string; 
  username: string; 
};

const HomepageOrganizer: React.FC = () => {
  const [events, setEvents] = useState<EventHelper.CleanEvent[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  // Create Event form state
  const [jobName, setJobName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  const [user, setUser] = React.useState<PublicUser | null>(null);

  const [posts, setPosts] = useState<EventHelper.CleanEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  const locationState = useLocation();
  const state = locationState.state as RoleHelper.AuthChoiceState;
  const role = state?.role;

  const navigate = useNavigate();

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if(raw)
      setUser(JSON.parse(raw) as PublicUser);

    const token = localStorage.getItem("access_token");
    //send user to organizer login
    if(!token){
      navigate("/User-login", { state: { role } });
      return;
    }

    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:4000/v1/events?mine=1", {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });
        if (!response.ok) {
           return;
        }

        const rows = await response.json();
        const cleanData = EventHelper.cleanEvents(rows);
        setEvents(cleanData);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  },[navigate, refreshKey] );

  if (!user) 
    return <div>Loading…</div>;

  //handles creation of events
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    // basic client-side validation
    if (!jobName.trim()) return alert("Job name is required");
    if (!startTime.trim()) return alert("Start time is required");
    if (!endTime.trim()) return alert("End time is required");
    if (new Date(endTime) <= new Date(startTime)) 
      return alert("End time must be after start time");
    if (!location.trim()) return alert("Location is required");
    if (!description.trim()) return alert("Description is required");

    try { 
      const token = localStorage.getItem("access_token");
      if(!token){
        alert("Your session has expired. Please log in again.");
        navigate("/User-login", { state: { role } });
        return;
      }

      // Convert local datetime-local values to ISO UTC strings
      const startDate = new Date(startTime)
      const endDate = new Date(endTime)
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        alert("Please choose valid start and end times.");
        return;
      }
      const startISO = startDate.toISOString();
      const endISO = endDate.toISOString();

      // prepare payload in the shape API expects
      const payload = {
        jobName: jobName.trim(),
        startTime: startISO,
        endTime: endISO,
        location: location.trim(),
        description: description.trim(),
      };

      const response = await fetch("http://localhost:4000/v1/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
    
      if (response.status === 401) { //auto-redirect if timed-out
        alert("Your session has expired. Please log in again.");
        console.log("401");
        navigate("/User-login", { state: { role } }); 
        return;
      }
      
      if (!response.ok) {
        const errText = await response.text();
        alert(`Failed to create job: ${errText}`);
        return;
      }
      
      // Your API might return 201 + JSON of created event, or 204 with no body.
      let created: any = null;
      try {
        created = await response.json();
      } catch (error) {
        alert("Unexpected Error: " +  error);
      }

      setRefreshKey(k => k + 1);
      setShowCreate(false);

      // reset form
      setJobName("");
      setStartTime("");
      setEndTime("");
      setLocation("");
      setDescription("");
    } 
    catch (err) {
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
            
            {/* display the list of events created by me */}
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
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {events.map((ev) => (
                <article
                  key={ev.id}
                  style={{
                    background: "white",
                    borderRadius: 16,
                    padding: 20,
                    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.08)",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "0 4px 10px rgba(10, 10, 10, 0.08)";
                  }}
                >
                  <header
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <h3 style={{ margin: 0, color: "#2c3e50", wordBreak:"break-word"}}>{ev.jobName}</h3>
                    <small style={{ color: "#888" }}>
                      {ev.createdAtDate} {ev.createdAtTime}
                    </small>
                  </header>

                  <p style={{ margin: "8px 0 12px", color: "#444", lineHeight: 1.4, wordBreak:"break-word", whiteSpace:"pre-wrap", textAlign:"left"}}>
                    {ev.description}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "12px 20px",
                      color: "#555",
                      fontSize: "0.95rem",
                    }}
                  >

                    <div> <Clock size={16}/>  <strong>Starts at:</strong> {ev.startDate}  {ev.startTime} </div>
                    <div> <Clock size={16}/>  <strong>Ends at:</strong> {ev.endDate}  {ev.endTime} </div>
                    <div> <MapPin size={16}/> <strong style={{wordBreak:"break-word"}}>Location:</strong> {ev.location} </div>

                  </div>
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

      {/* Create Event model */}
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
                required
              />
              <input
                className="text-input"
                type="datetime-local"
                placeholder="Start time*"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
              <input
                className="text-input"
                type="datetime-local"
                placeholder="End time*"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
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
