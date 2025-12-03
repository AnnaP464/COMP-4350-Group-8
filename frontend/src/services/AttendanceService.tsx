// src/services/AttendanceService.tsx
import apiFetch from "../api/ApiFetch";
import { cleanEvents, type CleanEvent } from "../helpers/EventHelper";

/* ---------- Shared types ---------- */

export type RecentActivityItem = {
  id: string;
  title: string;
  date: string;
  hours: number;
  where: string;
};

/* ---------- Volunteer stats ---------- */

export type VolunteerStats = {
  totalHours: number;           // summed hours across completed accepted events
  jobsCompleted: number;        // number of completed events with > 0 minutes
  upcomingJobs: number;         // accepted events in the future
  recentActivity: RecentActivityItem[]; // last few completed events
};

type ApplicationStatus = "applied" | "accepted" | "rejected" | "withdrawn";

type ApplicationRow = {
  event_id?: string;
  eventId?: string;
  status: ApplicationStatus;
};

type AttendanceStatusView = {
  status: {
    isSignedIn: boolean;
    totalMinutes: number;
  };
  rules: {
    canSignIn: boolean;
    canSignOut: boolean;
    reason?: string;
  };
};

/**
 * Volunteer view:
 * Aggregates stats from:
 *  - /v1/events
 *  - /v1/events/me/applications
 *  - /v1/events/:id/attendance/status
 */
export async function fetchVolunteerStats(): Promise<VolunteerStats> {
  try {
    // 1) All events
    const eventsRes = await apiFetch("/v1/events", {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!eventsRes.ok) {
      throw new Error("Failed to fetch events");
    }

    const rawEvents = await eventsRes.json();
    const events = cleanEvents(rawEvents, false) as CleanEvent[];

    // 2) My applications
    const appsRes = await apiFetch("/v1/events/me/applications", {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!appsRes.ok) {
      throw new Error("Failed to fetch applications");
    }

    const apps: ApplicationRow[] = await appsRes.json();
    const statusMap: Record<string, ApplicationStatus> = {};
    for (const row of apps) {
      const id = row.eventId ?? row.event_id;
      if (id) statusMap[id] = row.status;
    }

    const acceptedEvents = events.filter(
      (ev) => statusMap[ev.id] === "accepted"
    );

    // 3) Attendance status for each accepted event
    const attendanceList: (AttendanceStatusView | null)[] = await Promise.all(
      acceptedEvents.map(async (ev) => {
        try {
          const res = await apiFetch(
            `/v1/events/${ev.id}/attendance/status`,
            {
              method: "GET",
              headers: { Accept: "application/json" },
            }
          );
          if (!res.ok) return null;
          return (await res.json()) as AttendanceStatusView;
        } catch {
          return null;
        }
      })
    );

    const now = Date.now();
    let totalMinutes = 0;
    let upcomingCount = 0;
    let completedCount = 0;
    const completedActivities: { ev: CleanEvent; minutes: number }[] = [];

    acceptedEvents.forEach((ev, idx) => {
      const attendance = attendanceList[idx];
      const minutes = attendance?.status.totalMinutes ?? 0;
      totalMinutes += minutes;

      const endTs = (ev as any).endTimestamp as number | undefined;
      const startTs = (ev as any).startTimestamp as number | undefined;

      if (typeof startTs === "number" && startTs > now) {
        // future event
        upcomingCount += 1;
      } else if (
        typeof endTs === "number" &&
        endTs <= now &&
        minutes > 0
      ) {
        // past event with tracked attendance
        completedCount += 1;
        completedActivities.push({ ev, minutes });
      }
    });

    // Sort completed by end time (most recent first)
    completedActivities.sort((a, b) => {
      const aEnd = (a.ev as any).endTimestamp ?? 0;
      const bEnd = (b.ev as any).endTimestamp ?? 0;
      return bEnd - aEnd;
    });

    const recentActivity: RecentActivityItem[] = completedActivities
      .slice(0, 3)
      .map(({ ev, minutes }) => {
        const endTs = (ev as any).endTimestamp as number | undefined;
        const date = endTs
          ? new Date(endTs).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "";

        return {
          id: ev.id,
          title: (ev as any).jobName ?? "Event",
          date,
          hours: +(minutes / 60).toFixed(1),
          where: (ev as any).location ?? "",
        };
      });

    const totalHours = +(totalMinutes / 60).toFixed(1);

    return {
      totalHours,
      jobsCompleted: completedCount,
      upcomingJobs: upcomingCount,
      recentActivity,
    };
  } catch (err) {
    console.error("fetchVolunteerStats error", err);
    // Fail soft
    return {
      totalHours: 0,
      jobsCompleted: 0,
      upcomingJobs: 0,
      recentActivity: [],
    };
  }
}

/* ---------- Organizer stats ---------- */

export type OrganizerStats = {
  eventsHosted: number;
  volunteersEngaged: number;      // distinct volunteers across events
  upcomingEvents: number;        // my future events
  totalHoursProvided: number;    // scheduled volunteer-hours (duration * #accepted)
  recentEvents: {
    id: string;
    title: string;
    date: string;
    where: string;
  }[];
};

/**
 * Organizer view:
 * Aggregates stats from:
 *  - /v1/events?mine=1
 *  - /v1/events/:eventId/accepted
 *
 * NOTE: totalHoursProvided is *scheduled* volunteer-hours
 *       (event duration * number of accepted volunteers),
 *       not based on actual clock-in data.
 */
export async function fetchOrganizerStats(): Promise<OrganizerStats> {
  try {
    // 1) My events as organizer
    const eventsRes = await apiFetch("/v1/events?mine=1", {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!eventsRes.ok) {
      throw new Error("Failed to fetch my events");
    }

    const rawEvents = await eventsRes.json();
    const events = cleanEvents(rawEvents, false) as CleanEvent[];

    const eventsHosted = events.length;

    const now = Date.now();
    let upcomingEvents = 0;

    const volunteerIds = new Set<string>();
    let totalVolunteerMinutes = 0;

    // 2) For each event, fetch accepted volunteers
    const acceptedLists = await Promise.all(
      events.map(async (ev) => {
        try {
          const res = await apiFetch(`/v1/events/${ev.id}/accepted`, {
            method: "GET",
            headers: { Accept: "application/json" },
          });
          if (!res.ok) return [];
          return (await res.json()) as { id: string }[];
        } catch {
          return [];
        }
      })
    );

    events.forEach((ev, idx) => {
      const accepted = acceptedLists[idx] ?? [];
      const startTs = (ev as any).startTimestamp as number | undefined;
      const endTs = (ev as any).endTimestamp as number | undefined;

      // count upcoming events
      if (typeof startTs === "number" && startTs > now) {
        upcomingEvents += 1;
      }

      // track distinct volunteers
      accepted.forEach((a) => volunteerIds.add(a.id));

      // scheduled volunteer-hours = duration * accepted count
      if (typeof startTs === "number" && typeof endTs === "number") {
        const durationMinutes = Math.max(
          0,
          Math.round((endTs - startTs) / 60000)
        );
        totalVolunteerMinutes += durationMinutes * accepted.length;
      }
    });

    const totalHoursProvided = +(totalVolunteerMinutes / 60).toFixed(1);
    const volunteersEngaged = volunteerIds.size;

    // 3) Recent events = latest 3 by end time
    const sortedEvents = [...events].sort((a, b) => {
      const aEnd = (a as any).endTimestamp ?? 0;
      const bEnd = (b as any).endTimestamp ?? 0;
      return bEnd - aEnd;
    });

    const recentEvents = sortedEvents.slice(0, 3).map((ev) => {
      const endTs = (ev as any).endTimestamp as number | undefined;
      const date = endTs
        ? new Date(endTs).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "";

      return {
        id: ev.id,
        title: (ev as any).jobName ?? "Event",
        date,
        where: (ev as any).location ?? "",
      };
    });

    return {
      eventsHosted,
      volunteersEngaged,
      upcomingEvents,
      totalHoursProvided,
      recentEvents,
    };
  } catch (err) {
    console.error("fetchOrganizerStats error", err);
    // Fail soft: keep UI working
    return {
      eventsHosted: 0,
      volunteersEngaged: 0,
      upcomingEvents: 0,
      totalHoursProvided: 0,
      recentEvents: [],
    };
  }
}
