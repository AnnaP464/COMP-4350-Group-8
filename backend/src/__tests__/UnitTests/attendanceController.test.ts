// tests/controllers/attendanceController.test.ts
// Unit tests for attendance-related controller functions

import {
  getAttendanceStatus,
  signInAttendance,
  signOutAttendance,
} from "../../controllers/eventsController";
import * as eventService from "../../services/eventsService";

// Mock the service module
jest.mock("../../services/eventsService");

const mockEventService = eventService as jest.Mocked<typeof eventService>;

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

describe("AttendanceController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAttendanceStatus", () => {
    test("returns 200 with attendance status", async () => {
      const req = mockReq({
        params: { eventId: "evt-1" },
      });
      const res = mockRes();

      const mockStatus = {
        status: { isSignedIn: false, totalMinutes: 30 },
        rules: { canSignIn: true, canSignOut: false },
      };
      mockEventService.getAttendanceStatusService.mockResolvedValue(mockStatus);

      await getAttendanceStatus(req, res, mockNext);

      expect(mockEventService.getAttendanceStatusService).toHaveBeenCalledWith("evt-1", "user-1");
      expect(res.json).toHaveBeenCalledWith(mockStatus);
    });

    test("uses userId query param when provided", async () => {
      const req = mockReq({
        params: { eventId: "evt-1" },
        query: { userId: "other-user" },
      });
      const res = mockRes();

      const mockStatus = {
        status: { isSignedIn: true, totalMinutes: 60 },
        rules: { canSignIn: false, canSignOut: true },
      };
      mockEventService.getAttendanceStatusService.mockResolvedValue(mockStatus);

      await getAttendanceStatus(req, res, mockNext);

      expect(mockEventService.getAttendanceStatusService).toHaveBeenCalledWith("evt-1", "other-user");
      expect(res.json).toHaveBeenCalledWith(mockStatus);
    });

    test("calls next with error when service throws", async () => {
      const req = mockReq({
        params: { eventId: "evt-1" },
      });
      const res = mockRes();
      const error = new Error("Service error");
      mockEventService.getAttendanceStatusService.mockRejectedValue(error);

      await getAttendanceStatus(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("signInAttendance", () => {
    test("returns 200 with status on successful sign-in", async () => {
      const req = mockReq({
        params: { eventId: "evt-1" },
        body: { lon: -97.0, lat: 49.0, accuracy_m: 10 },
      });
      const res = mockRes();

      const mockResult = {
        outcome: "ok" as const,
        status: {
          status: { isSignedIn: true, totalMinutes: 0 },
          rules: { canSignIn: false, canSignOut: true },
        },
      };
      mockEventService.signInAttendanceService.mockResolvedValue(mockResult);

      await signInAttendance(req, res, mockNext);

      expect(mockEventService.signInAttendanceService).toHaveBeenCalledWith(
        "evt-1",
        "user-1",
        { lon: -97.0, lat: 49.0, accuracy_m: 10 }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult.status);
    });

    test("returns 403 when sign-in is forbidden (outside geofence)", async () => {
      const req = mockReq({
        params: { eventId: "evt-1" },
        body: { lon: -97.0, lat: 49.0 },
      });
      const res = mockRes();

      const mockResult = {
        outcome: "forbidden" as const,
        message: "You're not at the event location yet. Please move closer to clock in.",
        status: {
          status: { isSignedIn: false, totalMinutes: 0 },
          rules: { canSignIn: true, canSignOut: false },
        },
      };
      mockEventService.signInAttendanceService.mockResolvedValue(mockResult);

      await signInAttendance(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "You're not at the event location yet. Please move closer to clock in.",
        status: mockResult.status,
      });
    });

    test("returns 403 when sign-in is forbidden (outside time window)", async () => {
      const req = mockReq({
        params: { eventId: "evt-1" },
        body: { lon: -97.0, lat: 49.0 },
      });
      const res = mockRes();

      const mockResult = {
        outcome: "forbidden" as const,
        message: "You can only sign in within 5 minutes before the event starts.",
        status: {
          status: { isSignedIn: false, totalMinutes: 0 },
          rules: { canSignIn: false, canSignOut: false, reason: "You can only sign in within 5 minutes before the event starts." },
        },
      };
      mockEventService.signInAttendanceService.mockResolvedValue(mockResult);

      await signInAttendance(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: mockResult.message,
        status: mockResult.status,
      });
    });

    test("handles missing accuracy_m gracefully", async () => {
      const req = mockReq({
        params: { eventId: "evt-1" },
        body: { lon: -97.0, lat: 49.0 },
      });
      const res = mockRes();

      const mockResult = {
        outcome: "ok" as const,
        status: {
          status: { isSignedIn: true, totalMinutes: 0 },
          rules: { canSignIn: false, canSignOut: true },
        },
      };
      mockEventService.signInAttendanceService.mockResolvedValue(mockResult);

      await signInAttendance(req, res, mockNext);

      expect(mockEventService.signInAttendanceService).toHaveBeenCalledWith(
        "evt-1",
        "user-1",
        { lon: -97.0, lat: 49.0, accuracy_m: null }
      );
    });

    test("calls next with error when service throws", async () => {
      const req = mockReq({
        params: { eventId: "evt-1" },
        body: { lon: -97.0, lat: 49.0 },
      });
      const res = mockRes();
      const error = new Error("Service error");
      mockEventService.signInAttendanceService.mockRejectedValue(error);

      await signInAttendance(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("signOutAttendance", () => {
    test("returns 200 with status on successful sign-out", async () => {
      const req = mockReq({
        params: { eventId: "evt-1" },
        body: {},
      });
      const res = mockRes();

      const mockResult = {
        outcome: "ok" as const,
        status: {
          status: { isSignedIn: false, totalMinutes: 60 },
          rules: { canSignIn: true, canSignOut: false },
        },
      };
      mockEventService.signOutAttendanceService.mockResolvedValue(mockResult);

      await signOutAttendance(req, res, mockNext);

      expect(mockEventService.signOutAttendanceService).toHaveBeenCalledWith(
        "evt-1",
        "user-1",
        { accuracy_m: null }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult.status);
    });

    test("returns 200 idempotently when already signed out", async () => {
      const req = mockReq({
        params: { eventId: "evt-1" },
        body: {},
      });
      const res = mockRes();

      const mockResult = {
        outcome: "ok" as const,
        status: {
          status: { isSignedIn: false, totalMinutes: 30 },
          rules: { canSignIn: true, canSignOut: false },
        },
      };
      mockEventService.signOutAttendanceService.mockResolvedValue(mockResult);

      await signOutAttendance(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("returns 403 when sign-out is forbidden", async () => {
      const req = mockReq({
        params: { eventId: "evt-1" },
        body: {},
      });
      const res = mockRes();

      const mockResult = {
        outcome: "forbidden" as const,
        message: "You are not currently signed in to this event.",
        status: {
          status: { isSignedIn: false, totalMinutes: 0 },
          rules: { canSignIn: false, canSignOut: false },
        },
      };
      mockEventService.signOutAttendanceService.mockResolvedValue(mockResult);

      await signOutAttendance(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: mockResult.message,
        status: mockResult.status,
      });
    });

    test("calls next with error when service throws", async () => {
      const req = mockReq({
        params: { eventId: "evt-1" },
        body: {},
      });
      const res = mockRes();
      const error = new Error("Service error");
      mockEventService.signOutAttendanceService.mockRejectedValue(error);

      await signOutAttendance(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
