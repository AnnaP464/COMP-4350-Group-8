// tests/db/eventsDb.test.ts
// Unit tests for events database layer

import * as eventsDb from "../../db/events";
import * as db from "../../db/connect";

// Mock the database connection
jest.mock("../../db/connect");

const mockQuery = db.query as jest.MockedFunction<typeof db.query>;

describe("EventsDb", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createEvent", () => {
    test("inserts event and returns created row", async () => {
      const mockEvent = {
        id: "evt-1",
        organizerId: "org-1",
        jobName: "Test Event",
        description: "Test description",
        startTime: "2025-01-15T10:00:00Z",
        endTime: "2025-01-15T12:00:00Z",
        location: "Test Location",
        createdAt: "2025-01-01T00:00:00Z",
      };
      mockQuery.mockResolvedValue({ rows: [mockEvent], rowCount: 1 } as any);

      const result = await eventsDb.createEvent({
        organizerId: "org-1",
        jobName: "Test Event",
        description: "Test description",
        startTime: "2025-01-15T10:00:00Z",
        endTime: "2025-01-15T12:00:00Z",
        location: "Test Location",
      });

      expect(result).toEqual(mockEvent);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO events"),
        ["org-1", "Test Event", "Test description", "2025-01-15T10:00:00Z", "2025-01-15T12:00:00Z", "Test Location"]
      );
    });
  });

  describe("listByOrganizer", () => {
    test("returns events for organizer", async () => {
      const mockEvents = [
        { id: "evt-1", organizerId: "org-1", jobName: "Event 1" },
        { id: "evt-2", organizerId: "org-1", jobName: "Event 2" },
      ];
      mockQuery.mockResolvedValue({ rows: mockEvents, rowCount: 2 } as any);

      const result = await eventsDb.listByOrganizer("org-1");

      expect(result).toEqual(mockEvents);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("WHERE organizer_id = $1"),
        ["org-1"]
      );
    });

    test("returns empty array when no events", async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const result = await eventsDb.listByOrganizer("org-1");

      expect(result).toEqual([]);
    });
  });

  describe("listAll", () => {
    test("returns all events", async () => {
      const mockEvents = [
        { id: "evt-1", jobName: "Event 1" },
        { id: "evt-2", jobName: "Event 2" },
      ];
      mockQuery.mockResolvedValue({ rows: mockEvents, rowCount: 2 } as any);

      const result = await eventsDb.listAll();

      expect(result).toEqual(mockEvents);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("FROM events")
      );
    });
  });

  describe("getEventById", () => {
    test("returns event when found", async () => {
      const mockEvent = { id: "evt-1", jobName: "Test Event" };
      mockQuery.mockResolvedValue({ rows: [mockEvent], rowCount: 1 } as any);

      const result = await eventsDb.getEventById("evt-1");

      expect(result).toEqual(mockEvent);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("WHERE id = $1"),
        ["evt-1"]
      );
    });

    test("returns null when event not found", async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const result = await eventsDb.getEventById("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("userHasAcceptedCollision", () => {
    test("returns true when collision exists", async () => {
      mockQuery.mockResolvedValue({ rows: [{ exists: true }], rowCount: 1 } as any);

      const result = await eventsDb.userHasAcceptedCollision("user-1", "evt-1");

      expect(result).toBe(true);
    });

    test("returns false when no collision", async () => {
      mockQuery.mockResolvedValue({ rows: [{ exists: false }], rowCount: 1 } as any);

      const result = await eventsDb.userHasAcceptedCollision("user-1", "evt-1");

      expect(result).toBe(false);
    });

    test("returns false when rows empty", async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const result = await eventsDb.userHasAcceptedCollision("user-1", "evt-1");

      expect(result).toBe(false);
    });
  });

  describe("registerUserForEvent", () => {
    test("returns event_not_found when event does not exist", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const result = await eventsDb.registerUserForEvent("user-1", "nonexistent");

      expect(result).toEqual({ outcome: "event_not_found", row: null });
    });

    test("returns inserted when registration succeeds", async () => {
      const mockRow = {
        outcome: "inserted",
        userID: "user-1",
        eventID: "evt-1",
        status: "applied",
        appliedAt: "2025-01-01T00:00:00Z",
      };
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "evt-1" }], rowCount: 1 } as any) // event exists
        .mockResolvedValueOnce({ rows: [mockRow], rowCount: 1 } as any); // insert

      const result = await eventsDb.registerUserForEvent("user-1", "evt-1");

      expect(result.outcome).toBe("inserted");
      expect(result.row).toEqual(mockRow);
    });

    test("returns already_applied when user already applied", async () => {
      const mockRow = {
        outcome: "already_applied",
        userID: "user-1",
        eventID: "evt-1",
        status: "applied",
      };
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "evt-1" }], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [mockRow], rowCount: 1 } as any);

      const result = await eventsDb.registerUserForEvent("user-1", "evt-1");

      expect(result.outcome).toBe("already_applied");
    });
  });

  describe("acceptApplicant", () => {
    test("updates status and returns row", async () => {
      const mockRow = { user_id: "user-1", event_id: "evt-1", status: "accepted" };
      mockQuery.mockResolvedValue({ rows: [mockRow], rowCount: 1 } as any);

      const result = await eventsDb.acceptApplicant("org-1", "user-1", "evt-1");

      expect(result).toEqual(mockRow);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("SET status='accepted'"),
        ["org-1", "user-1", "evt-1"]
      );
    });

    test("returns null when no matching application", async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const result = await eventsDb.acceptApplicant("org-1", "user-1", "evt-1");

      expect(result).toBeNull();
    });
  });

  describe("rejectApplicant", () => {
    test("updates status and returns row", async () => {
      const mockRow = { user_id: "user-1", event_id: "evt-1", status: "rejected" };
      mockQuery.mockResolvedValue({ rows: [mockRow], rowCount: 1 } as any);

      const result = await eventsDb.rejectApplicant("org-1", "user-1", "evt-1");

      expect(result).toEqual(mockRow);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("SET status='rejected'"),
        ["org-1", "user-1", "evt-1"]
      );
    });
  });

  describe("listApplicants", () => {
    test("returns applicants for event", async () => {
      const mockApplicants = [
        { id: "user-1", username: "john", email: "john@test.com" },
        { id: "user-2", username: "jane", email: "jane@test.com" },
      ];
      mockQuery.mockResolvedValue({ rows: mockApplicants, rowCount: 2 } as any);

      const result = await eventsDb.listApplicants("evt-1");

      expect(result).toEqual(mockApplicants);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("status='applied'"),
        ["evt-1"]
      );
    });
  });

  describe("listAccepted", () => {
    test("returns accepted volunteers for event", async () => {
      const mockAccepted = [
        { id: "user-1", username: "john", email: "john@test.com" },
      ];
      mockQuery.mockResolvedValue({ rows: mockAccepted, rowCount: 1 } as any);

      const result = await eventsDb.listAccepted("evt-1");

      expect(result).toEqual(mockAccepted);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("status='accepted'"),
        ["evt-1"]
      );
    });
  });

  describe("listMyApplications", () => {
    test("returns applications for user", async () => {
      const mockApplications = [
        { event_id: "evt-1", job_name: "Event 1", status: "applied" },
        { event_id: "evt-2", job_name: "Event 2", status: "accepted" },
      ];
      mockQuery.mockResolvedValue({ rows: mockApplications, rowCount: 2 } as any);

      const result = await eventsDb.listMyApplications("user-1");

      expect(result).toEqual(mockApplications);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("WHERE ru.user_id=$1"),
        ["user-1"]
      );
    });
  });

  describe("deregisterUserForEvent", () => {
    test("deletes registration and returns row", async () => {
      const mockRow = { userID: "user-1", eventID: "evt-1" };
      mockQuery.mockResolvedValue({ rows: [mockRow], rowCount: 1 } as any);

      const result = await eventsDb.deregisterUserForEvent("user-1", "evt-1");

      expect(result).toEqual(mockRow);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("DELETE"),
        ["user-1", "evt-1"]
      );
    });
  });

  describe("listRegisteredEventsByUser", () => {
    test("returns accepted events for user", async () => {
      const mockEvents = [
        { id: "evt-1", jobName: "Event 1" },
        { id: "evt-2", jobName: "Event 2" },
      ];
      mockQuery.mockResolvedValue({ rows: mockEvents, rowCount: 2 } as any);

      const result = await eventsDb.listRegisteredEventsByUser("user-1");

      expect(result).toEqual(mockEvents);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("status = 'accepted'"),
        ["user-1"]
      );
    });
  });
});
