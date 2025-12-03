// tests/controllers/userProfileStatsController.test.ts
// Unit tests for getMyStats controller function

import { getMyStats } from "../../controllers/userProfileController";
import * as eventsService from "../../services/eventsService";

// Mock the service module
jest.mock("../../services/eventsService");

const mockEventsService = eventsService as jest.Mocked<typeof eventsService>;

function mockReq(overrides: any = {}) {
  return {
    params: {},
    body: {},
    query: {},
    user: { id: "user-1" },
    ...overrides,
  } as any;
}

function mockRes() {
  const res: any = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.send = jest.fn(() => res);
  return res;
}

const mockNext = jest.fn();

describe("UserProfileStatsController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getMyStats", () => {
    test("returns 200 with volunteer stats", async () => {
      const req = mockReq();
      const res = mockRes();

      const mockStats = {
        totalMinutes: 180,
        totalHours: 3,
        jobsCompleted: 2,
        upcomingJobs: 1,
      };
      mockEventsService.getVolunteerStatsService.mockResolvedValue(mockStats);

      await getMyStats(req, res, mockNext);

      expect(mockEventsService.getVolunteerStatsService).toHaveBeenCalledWith("user-1");
      expect(res.json).toHaveBeenCalledWith(mockStats);
    });

    test("returns 401 when user is not authenticated", async () => {
      const req = mockReq({ user: undefined });
      const res = mockRes();

      await getMyStats(req, res, mockNext);

      expect(mockEventsService.getVolunteerStatsService).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    test("returns 401 when user.id is missing", async () => {
      const req = mockReq({ user: {} });
      const res = mockRes();

      await getMyStats(req, res, mockNext);

      expect(mockEventsService.getVolunteerStatsService).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    test("returns stats with zero values for new volunteer", async () => {
      const req = mockReq({ user: { id: "new-volunteer" } });
      const res = mockRes();

      const mockStats = {
        totalMinutes: 0,
        totalHours: 0,
        jobsCompleted: 0,
        upcomingJobs: 0,
      };
      mockEventsService.getVolunteerStatsService.mockResolvedValue(mockStats);

      await getMyStats(req, res, mockNext);

      expect(mockEventsService.getVolunteerStatsService).toHaveBeenCalledWith("new-volunteer");
      expect(res.json).toHaveBeenCalledWith(mockStats);
    });

    test("calls next with error when service throws", async () => {
      const req = mockReq();
      const res = mockRes();
      const error = new Error("Database error");
      mockEventsService.getVolunteerStatsService.mockRejectedValue(error);

      await getMyStats(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    test("handles user id from req.user.id directly (alternate shape)", async () => {
      // Test the (req as any).user?.id path
      const req = {
        params: {},
        body: {},
        query: {},
        user: { id: "alt-user-id" },
      } as any;
      const res = mockRes();

      const mockStats = {
        totalMinutes: 60,
        totalHours: 1,
        jobsCompleted: 1,
        upcomingJobs: 0,
      };
      mockEventsService.getVolunteerStatsService.mockResolvedValue(mockStats);

      await getMyStats(req, res, mockNext);

      expect(mockEventsService.getVolunteerStatsService).toHaveBeenCalledWith("alt-user-id");
      expect(res.json).toHaveBeenCalledWith(mockStats);
    });
  });
});
