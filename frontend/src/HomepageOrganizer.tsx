import React, { useState, useEffect } from "react";
import "./css/Homepage.css"; // re-use your existing styles
import "./css/AuthChoice.css";
import "./css/EventList.css";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import * as EventHelper from "./helpers/EventHelper";
import * as AlertHelper from "./helpers/AlertHelper";
import HomepageHeader from "./components/HomepageHeader";
import EventList from "./components/EventList";
import * as EventService from "./services/EventService";
import * as AuthService from "./services/AuthService";
import * as UserService from "./services/UserService";

type PublicUser = { 
  email: string; 
  username: string; 
};

type EventDraft = {
  jobName: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
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
    const raw = AuthService.getUser();
    if(raw)
      setUser(JSON.parse(raw) as PublicUser);

    const token = AuthService.getToken();
    //send user to organizer login
    if(!token){
      navigate("/User-login", { state: { role } });
      return;
    }

    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await EventService.fetchMyEvents(token);
        
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
    const draft = { jobName, startTime, endTime, location, description };
    const error = validateEvent(draft);
    if (error) {
      alert(error);
      return;
    }

    try { 
      const token = AuthService.getToken();
      if(!token){
        alert(AlertHelper.SESSION_EXPIRE_ERROR);
        navigate("/User-login", { state: { role } });
        return;
      }

      // Convert local datetime-local values to ISO UTC strings
      const startDate = new Date(startTime)
      const endDate = new Date(endTime)
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        alert(AlertHelper.TIME_FORMATTING_ERROR);
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

      const response = await EventService.createEvent(token, payload);
    
      if (response.status === 401) { //auto-redirect if timed-out
        alert(AlertHelper.SESSION_EXPIRE_ERROR);
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

      alert(AlertHelper.APPLICATION_PROCESSING);

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
      alert(AlertHelper.SERVER_ERROR);
    }
  };

  const validateEvent = (draft: EventDraft): string | null => {
    if (!draft.jobName.trim()) return AlertHelper.JOB_NAME_ERROR;
    if (!draft.startTime.trim()) return AlertHelper.START_TIME_ERROR;
    if (!draft.endTime.trim()) return AlertHelper.END_TIME_ERROR;
  
    const start = new Date(draft.startTime);
    const end = new Date(draft.endTime);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      if (end <= start) return AlertHelper.TIMING_ERROR;
      if (new Date() > start) return AlertHelper.CAUSALITY_ERROR;
    }
  
    if (!draft.location.trim()) return AlertHelper.LOCATION_ERROR;
    if (!draft.description.trim()) return AlertHelper.DESCRIPTION_ERROR;
  
    return null;
  };


  //handles logging out
  const handleLogout = async (e: React.FormEvent) => {
    e.preventDefault();

    //clear local state
    AuthService.logout();

    try {
      const response = await UserService.logout();

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
      alert(AlertHelper.SERVER_ERROR);
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
