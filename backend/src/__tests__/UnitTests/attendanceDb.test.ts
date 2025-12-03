// tests/db/attendanceDb.test.ts
// Unit tests for attendance database layer

import * as attendanceDb from "../../db/attendance";
import * as db from "../../db/connect";

// Mock the database connection
jest.mock("../../db/connect");

const mockQuery = db.query as jest.MockedFunction<typeof db.query>;

describe("AttendanceDb", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("insertAction", () => {
    test("inserts sign_in action and returns row", async () => {
      const mockRow = {
        id: "action-1",
        event_id: "evt-1",
        user_id: "user-1",
        action: "sign_in",
        at_time: "2025-01-15T10:00:00Z",
        accepted: true,
      };
      mockQuery.mockResolvedValue({ rows: [mockRow], rowCount: 1 } as any);

      const result = await attendanceDb.insertAction({
        eventId: "evt-1",
        userId: "user-1",
        action: "sign_in",
        accepted: true,
        accuracy_m: 10,
      });

      expect(result).toEqual(mockRow);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO event_attendance"),
        ["evt-1", "user-1", "sign_in", 10, true]
      );
    });

    test("inserts sign_out action with null accuracy", async () => {
      const mockRow = {
        id: "action-2",
        event_id: "evt-1",
        user_id: "user-1",
        action: "sign_out",
        at_time: "2025-01-15T12:00:00Z",
        accepted: true,
      };
      mockQuery.mockResolvedValue({ rows: [mockRow], rowCount: 1 } as any);

      const result = await attendanceDb.insertAction({
        eventId: "evt-1",
        userId: "user-1",
        action: "sign_out",
        accepted: true,
      });

      expect(result).toEqual(mockRow);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO event_attendance"),
        ["evt-1", "user-1", "sign_out", null, true]
      );
    });

    test("inserts rejected action", async () => {
      const mockRow = {
        id: "action-3",
        event_id: "evt-1",
        user_id: "user-1",
        action: "sign_in",
        at_time: "2025-01-15T10:00:00Z",
        accepted: false,
      };
      mockQuery.mockResolvedValue({ rows: [mockRow], rowCount: 1 } as any);

      const result = await attendanceDb.insertAction({
        eventId: "evt-1",
        userId: "user-1",
        action: "sign_in",
        accepted: false,
        accuracy_m: 100,
      });

      expect(result).toEqual(mockRow);
      expect(result.accepted).toBe(false);
    });
  });

  describe("getLastAcceptedAction", () => {
    test("returns last accepted action when exists", async () => {
      const mockRow = {
        id: "action-1",
        event_id: "evt-1",
        user_id: "user-1",
        action: "sign_in",
        at_time: "2025-01-15T10:00:00Z",
        accepted: true,
      };
      mockQuery.mockResolvedValue({ rows: [mockRow], rowCount: 1 } as any);

      const result = await attendanceDb.getLastAcceptedAction({
        eventId: "evt-1",
        userId: "user-1",
      });

      expect(result).toEqual(mockRow);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("accepted = true"),
        ["evt-1", "user-1"]
      );
    });

    test("returns null when no accepted actions", async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const result = await attendanceDb.getLastAcceptedAction({
        eventId: "evt-1",
        userId: "user-1",
      });

      expect(result).toBeNull();
    });
  });

  describe("listAcceptedActions", () => {
    test("returns all accepted actions in order", async () => {
      const mockRows = [
        { id: "action-1", action: "sign_in", at_time: "2025-01-15T10:00:00Z" },
        { id: "action-2", action: "sign_out", at_time: "2025-01-15T11:00:00Z" },
        { id: "action-3", action: "sign_in", at_time: "2025-01-15T11:30:00Z" },
      ];
      mockQuery.mockResolvedValue({ rows: mockRows, rowCount: 3 } as any);

      const result = await attendanceDb.listAcceptedActions({
        eventId: "evt-1",
        userId: "user-1",
      });

      expect(result).toEqual(mockRows);
      expect(result).toHaveLength(3);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("ORDER BY at_time ASC"),
        ["evt-1", "user-1"]
      );
    });

    test("returns empty array when no actions", async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const result = await attendanceDb.listAcceptedActions({
        eventId: "evt-1",
        userId: "user-1",
      });

      expect(result).toEqual([]);
    });
  });

  describe("listAllAcceptedActionsForUser", () => {
    test("returns actions across all events with event end times", async () => {
      const mockRows = [
        {
          id: "action-1",
          event_id: "evt-1",
          user_id: "user-1",
          action: "sign_in",
          at_time: "2025-01-15T10:00:00Z",
          accepted: true,
          eventEndTime: "2025-01-15T12:00:00Z",
        },
        {
          id: "action-2",
          event_id: "evt-1",
          user_id: "user-1",
          action: "sign_out",
          at_time: "2025-01-15T11:00:00Z",
          accepted: true,
          eventEndTime: "2025-01-15T12:00:00Z",
        },
        {
          id: "action-3",
          event_id: "evt-2",
          user_id: "user-1",
          action: "sign_in",
          at_time: "2025-01-16T09:00:00Z",
          accepted: true,
          eventEndTime: "2025-01-16T17:00:00Z",
        },
      ];
      mockQuery.mockResolvedValue({ rows: mockRows, rowCount: 3 } as any);

      const result = await attendanceDb.listAllAcceptedActionsForUser("user-1");

      expect(result).toEqual(mockRows);
      expect(result[0].eventEndTime).toBe("2025-01-15T12:00:00Z");
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("JOIN events e ON e.id = ea.event_id"),
        ["user-1"]
      );
    });

    test("returns empty array when user has no attendance", async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const result = await attendanceDb.listAllAcceptedActionsForUser("user-1");

      expect(result).toEqual([]);
    });
  });

  describe("countCompletedEventsForUser", () => {
    test("returns count of completed events", async () => {
      mockQuery.mockResolvedValue({ rows: [{ count: "5" }], rowCount: 1 } as any);

      const result = await attendanceDb.countCompletedEventsForUser("user-1");

      expect(result).toBe(5);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("e.end_time < NOW()"),
        ["user-1"]
      );
    });

    test("returns 0 when no completed events", async () => {
      mockQuery.mockResolvedValue({ rows: [{ count: "0" }], rowCount: 1 } as any);

      const result = await attendanceDb.countCompletedEventsForUser("user-1");

      expect(result).toBe(0);
    });

    test("returns 0 when rows empty", async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const result = await attendanceDb.countCompletedEventsForUser("user-1");

      expect(result).toBe(0);
    });
  });

  describe("countUpcomingEventsForUser", () => {
    test("returns count of upcoming events", async () => {
      mockQuery.mockResolvedValue({ rows: [{ count: "3" }], rowCount: 1 } as any);

      const result = await attendanceDb.countUpcomingEventsForUser("user-1");

      expect(result).toBe(3);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("e.start_time > NOW()"),
        ["user-1"]
      );
    });

    test("returns 0 when no upcoming events", async () => {
      mockQuery.mockResolvedValue({ rows: [{ count: "0" }], rowCount: 1 } as any);

      const result = await attendanceDb.countUpcomingEventsForUser("user-1");

      expect(result).toBe(0);
    });
  });

  describe("attendanceRepo export", () => {
    test("exports insertAction function", () => {
      expect(attendanceDb.attendanceRepo.insertAction).toBe(attendanceDb.insertAction);
    });

    test("exports getLastAcceptedAction function", () => {
      expect(attendanceDb.attendanceRepo.getLastAcceptedAction).toBe(attendanceDb.getLastAcceptedAction);
    });

    test("exports listAcceptedActions function", () => {
      expect(attendanceDb.attendanceRepo.listAcceptedActions).toBe(attendanceDb.listAcceptedActions);
    });
  });
});
