import React, { useMemo, useState, useEffect } from "react";
import "./css/Homepage.css"; // re-use your existing styles
import "./css/AuthChoice.css";
import "./css/EventList.css";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import * as EventHelper from "./helpers/EventHelper";
import * as ErrorHelper from "./helpers/ErrorHelper";
import HomepageHeader from "./components/HomepageHeader";
import EventList from "./components/EventList";

const API_URL = "http://localhost:4000";

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

  //const [posts, setPosts] = useState<EventHelper.CleanEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  const locationState = useLocation();
  const state = locationState.state;
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
        const response = await fetch(`${API_URL}/v1/events?mine=1`, {
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

        
        const cleanData = EventHelper.cleanEvents(rows, false);
        setEvents(cleanData);
      } catch {
        console.log("The GET event call failed");
      } 
      finally {
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
    if (!jobName.trim()) return alert(ErrorHelper.JOB_NAME_ERROR);
    if (!startTime.trim()) return alert(ErrorHelper.START_TIME_ERROR);
    if (!endTime.trim()) return alert(ErrorHelper.END_TIME_ERROR);
    if (new Date(endTime) <= new Date(startTime)) 
      return alert(ErrorHelper.TIMING_ERROR);
    if (new Date() > new Date(startTime)) return alert(ErrorHelper.CAUSALITY_ERROR);
    if (!location.trim()) return alert(ErrorHelper.LOCATION_ERROR);
    if (!description.trim()) return alert(ErrorHelper.DESCRIPTION_ERROR);

    try { 
      const token = localStorage.getItem("access_token");
      if(!token){
        alert(ErrorHelper.SESSION_EXPIRE_ERROR);
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

      //band aid fix for our timezone, we are 5 hours behind UTC
      startDate.setMinutes(startDate.getMinutes() - startDate.getTimezoneOffset());
      endDate.setMinutes(endDate.getMinutes() - endDate.getTimezoneOffset());

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

      const response = await fetch(`${API_URL}/v1/events`, {
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
      
      try {
        await response.json();
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
      alert(ErrorHelper.SERVER_ERROR);
    }
  };


  //handles logging out
  const handleLogout = async (e: React.FormEvent) => {
    e.preventDefault();

    //clear local state
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    try {
      const response = await fetch(`${API_URL}/v1/auth/logout`, {
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
          await response.json();
        } catch (error){
          console.error("Unexpected JSON package", error);
        }
      }

    navigate("/", { replace: true });

    } catch (error) {
      console.error("Log-out Error:", error);
      alert(ErrorHelper.SERVER_ERROR);
    }
  };

  return (
    <div className="dashboard-container" style={{ alignItems: "stretch" }}>
      {/* Top bar */}
        <HomepageHeader
          title={`HiveHand - ${user.username}`}
          subtitle="Homepage"
          actions={
            <>
              <button
                className="option-btn"
                onClick={() => setShowCreate(true)}
                title="Create a job post"
              >
                Create Event
              </button>
              <button
                className="option-btn"
                onClick={() =>
                  navigate("/Homepage-Organizer/profile", { state: { role } })
                }
                title="Profile & settings"
              >
                Profile
              </button>

              <button className="cancel-btn" type="button" onClick={handleLogout}>
                Log-out
              </button>
            </>
          }
        />

        {/* Content area: Feed */}
        {/* <div className="myreg-container"
          style={{gridTemplateColumns: showProfile ? "1fr 320px" : "1fr"}}
        > */}
          {/* Feed */}
        <EventList
          title={`${user.username}'s job postings`}
          events={events}
          emptyMessage="No job postings posted yet."
          onCardClick={(ev) => navigate(`/ManageEvents/${ev.id}`, { state: { role } })}
        />

        {/* </div> */}


      {/* Create Event model */}
      {showCreate && (
        <div className="create-event-screen"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowCreate(false)}>
          <div className="create-event-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="create-event-title">
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
                //required
              />
              <input
                id="start-time-input"
                className="text-input"
                type="datetime-local"
                placeholder="Start time *"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                //required
              />
              <input
                id="end-time-input"
                className="text-input"
                type="datetime-local"
                placeholder="End time *"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                //required
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
