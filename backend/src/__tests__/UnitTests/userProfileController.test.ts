// tests/controllers/userProfileController.test.ts
// Unit tests for all userProfile controller functions

import {
  getMyProfile,
  putMyProfile,
  patchMyProfile,
  listMySocialLinks,
  upsertMySocialLink,
  deleteMySocialLink,
  getMyStats,
} from "../../controllers/userProfileController";
import * as userProfileDb from "../../db/userProfile";
import * as eventsService from "../../services/eventsService";

// Mock the db and service modules
jest.mock("../../db/userProfile");
jest.mock("../../services/eventsService");

const mockUserProfileDb = userProfileDb as jest.Mocked<typeof userProfileDb>;
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

describe("UserProfileController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getMyProfile", () => {
    test("returns 200 with profile when found", async () => {
      const req = mockReq();
      const res = mockRes();

      const mockProfile = {
        userId: "user-1",
        bio: "Test bio",
        avatarUrl: null,
        phone: "555-1234",
        city: "Winnipeg",
        country: "Canada",
        contactPref: "email" as const,
        updatedAt: "2025-01-01T00:00:00Z",
      };
      mockUserProfileDb.getUserProfileByUserId.mockResolvedValue(mockProfile);

      await getMyProfile(req, res, mockNext);

      expect(mockUserProfileDb.getUserProfileByUserId).toHaveBeenCalledWith("user-1");
      expect(res.json).toHaveBeenCalledWith(mockProfile);
    });

    test("returns 404 when profile not found", async () => {
      const req = mockReq();
      const res = mockRes();

      mockUserProfileDb.getUserProfileByUserId.mockResolvedValue(null);

      await getMyProfile(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Profile not found" });
    });

    test("returns 401 when user not authenticated", async () => {
      const req = mockReq({ user: undefined });
      const res = mockRes();

      await getMyProfile(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    test("calls next with error when db throws", async () => {
      const req = mockReq();
      const res = mockRes();
      const error = new Error("Database error");
      mockUserProfileDb.getUserProfileByUserId.mockRejectedValue(error);

      await getMyProfile(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("putMyProfile", () => {
    test("returns 200 with upserted profile", async () => {
      const req = mockReq({
        body: {
          bio: "New bio",
          city: "Toronto",
        },
      });
      const res = mockRes();

      const mockProfile = {
        userId: "user-1",
        bio: "New bio",
        avatarUrl: null,
        phone: null,
        city: "Toronto",
        country: null,
        contactPref: null,
        updatedAt: "2025-01-01T00:00:00Z",
      };
      mockUserProfileDb.upsertUserProfile.mockResolvedValue(mockProfile);

      await putMyProfile(req, res, mockNext);

      expect(mockUserProfileDb.upsertUserProfile).toHaveBeenCalledWith("user-1", {
        bio: "New bio",
        city: "Toronto",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockProfile);
    });

    test("handles empty body", async () => {
      const req = mockReq({ body: undefined });
      const res = mockRes();

      const mockProfile = {
        userId: "user-1",
        bio: null,
        avatarUrl: null,
        phone: null,
        city: null,
        country: null,
        contactPref: null,
        updatedAt: "2025-01-01T00:00:00Z",
      };
      mockUserProfileDb.upsertUserProfile.mockResolvedValue(mockProfile);

      await putMyProfile(req, res, mockNext);

      expect(mockUserProfileDb.upsertUserProfile).toHaveBeenCalledWith("user-1", {});
    });

    test("returns 401 when user not authenticated", async () => {
      const req = mockReq({ user: undefined });
      const res = mockRes();

      await putMyProfile(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    test("calls next with error when db throws", async () => {
      const req = mockReq({ body: { bio: "test" } });
      const res = mockRes();
      const error = new Error("Database error");
      mockUserProfileDb.upsertUserProfile.mockRejectedValue(error);

      await putMyProfile(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("patchMyProfile", () => {
    test("returns 200 with patched profile", async () => {
      const req = mockReq({
        body: { bio: "Updated bio" },
      });
      const res = mockRes();

      const mockProfile = {
        userId: "user-1",
        bio: "Updated bio",
        avatarUrl: null,
        phone: "555-1234",
        city: "Winnipeg",
        country: "Canada",
        contactPref: "email" as const,
        updatedAt: "2025-01-02T00:00:00Z",
      };
      mockUserProfileDb.patchUserProfile.mockResolvedValue(mockProfile);

      await patchMyProfile(req, res, mockNext);

      expect(mockUserProfileDb.patchUserProfile).toHaveBeenCalledWith("user-1", { bio: "Updated bio" });
      expect(res.json).toHaveBeenCalledWith(mockProfile);
    });

    test("handles empty body", async () => {
      const req = mockReq({ body: undefined });
      const res = mockRes();

      const mockProfile = {
        userId: "user-1",
        bio: null,
        avatarUrl: null,
        phone: null,
        city: null,
        country: null,
        contactPref: null,
        updatedAt: "2025-01-01T00:00:00Z",
      };
      mockUserProfileDb.patchUserProfile.mockResolvedValue(mockProfile);

      await patchMyProfile(req, res, mockNext);

      expect(mockUserProfileDb.patchUserProfile).toHaveBeenCalledWith("user-1", {});
    });

    test("returns 401 when user not authenticated", async () => {
      const req = mockReq({ user: undefined });
      const res = mockRes();

      await patchMyProfile(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    test("calls next with error when db throws", async () => {
      const req = mockReq({ body: { bio: "test" } });
      const res = mockRes();
      const error = new Error("Database error");
      mockUserProfileDb.patchUserProfile.mockRejectedValue(error);

      await patchMyProfile(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("listMySocialLinks", () => {
    test("returns 200 with social links", async () => {
      const req = mockReq();
      const res = mockRes();

      const mockLinks = [
        { id: "link-1", userId: "user-1", platform: "github", url: "https://github.com/test", handle: "test", createdAt: "2025-01-01T00:00:00Z" },
        { id: "link-2", userId: "user-1", platform: "linkedin", url: "https://linkedin.com/in/test", handle: null, createdAt: "2025-01-01T00:00:00Z" },
      ];
      mockUserProfileDb.getSocialLinksByUserId.mockResolvedValue(mockLinks);

      await listMySocialLinks(req, res, mockNext);

      expect(mockUserProfileDb.getSocialLinksByUserId).toHaveBeenCalledWith("user-1");
      expect(res.json).toHaveBeenCalledWith(mockLinks);
    });

    test("returns empty array when no links", async () => {
      const req = mockReq();
      const res = mockRes();

      mockUserProfileDb.getSocialLinksByUserId.mockResolvedValue([]);

      await listMySocialLinks(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    test("returns 401 when user not authenticated", async () => {
      const req = mockReq({ user: undefined });
      const res = mockRes();

      await listMySocialLinks(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    test("calls next with error when db throws", async () => {
      const req = mockReq();
      const res = mockRes();
      const error = new Error("Database error");
      mockUserProfileDb.getSocialLinksByUserId.mockRejectedValue(error);

      await listMySocialLinks(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("upsertMySocialLink", () => {
    test("returns 200 with upserted social link", async () => {
      const req = mockReq({
        params: { platform: "github" },
        body: { url: "https://github.com/testuser", handle: "testuser" },
      });
      const res = mockRes();

      const mockLink = {
        id: "link-1",
        userId: "user-1",
        platform: "github",
        url: "https://github.com/testuser",
        handle: "testuser",
        createdAt: "2025-01-01T00:00:00Z",
      };
      mockUserProfileDb.upsertSocialLink.mockResolvedValue(mockLink);

      await upsertMySocialLink(req, res, mockNext);

      expect(mockUserProfileDb.upsertSocialLink).toHaveBeenCalledWith("user-1", {
        platform: "github",
        url: "https://github.com/testuser",
        handle: "testuser",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockLink);
    });

    test("handles missing handle (defaults to null)", async () => {
      const req = mockReq({
        params: { platform: "website" },
        body: { url: "https://example.com" },
      });
      const res = mockRes();

      const mockLink = {
        id: "link-1",
        userId: "user-1",
        platform: "website",
        url: "https://example.com",
        handle: null,
        createdAt: "2025-01-01T00:00:00Z",
      };
      mockUserProfileDb.upsertSocialLink.mockResolvedValue(mockLink);

      await upsertMySocialLink(req, res, mockNext);

      expect(mockUserProfileDb.upsertSocialLink).toHaveBeenCalledWith("user-1", {
        platform: "website",
        url: "https://example.com",
        handle: null,
      });
    });

    test("returns 401 when user not authenticated", async () => {
      const req = mockReq({
        user: undefined,
        params: { platform: "github" },
        body: { url: "https://github.com/test" },
      });
      const res = mockRes();

      await upsertMySocialLink(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    test("calls next with error when db throws", async () => {
      const req = mockReq({
        params: { platform: "github" },
        body: { url: "https://github.com/test" },
      });
      const res = mockRes();
      const error = new Error("Database error");
      mockUserProfileDb.upsertSocialLink.mockRejectedValue(error);

      await upsertMySocialLink(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("deleteMySocialLink", () => {
    test("returns 204 when link deleted", async () => {
      const req = mockReq({
        params: { platform: "github" },
      });
      const res = mockRes();

      mockUserProfileDb.deleteSocialLink.mockResolvedValue({ deleted: true });

      await deleteMySocialLink(req, res, mockNext);

      expect(mockUserProfileDb.deleteSocialLink).toHaveBeenCalledWith("user-1", "github");
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    test("returns 404 when link not found", async () => {
      const req = mockReq({
        params: { platform: "nonexistent" },
      });
      const res = mockRes();

      mockUserProfileDb.deleteSocialLink.mockResolvedValue({ deleted: false });

      await deleteMySocialLink(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Social link not found" });
    });

    test("returns 401 when user not authenticated", async () => {
      const req = mockReq({
        user: undefined,
        params: { platform: "github" },
      });
      const res = mockRes();

      await deleteMySocialLink(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    test("calls next with error when db throws", async () => {
      const req = mockReq({
        params: { platform: "github" },
      });
      const res = mockRes();
      const error = new Error("Database error");
      mockUserProfileDb.deleteSocialLink.mockRejectedValue(error);

      await deleteMySocialLink(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
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

    test("returns 401 when user not authenticated", async () => {
      const req = mockReq({ user: undefined });
      const res = mockRes();

      await getMyStats(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    test("returns 401 when user.id is missing", async () => {
      const req = mockReq({ user: {} });
      const res = mockRes();

      await getMyStats(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    test("calls next with error when service throws", async () => {
      const req = mockReq();
      const res = mockRes();
      const error = new Error("Service error");
      mockEventsService.getVolunteerStatsService.mockRejectedValue(error);

      await getMyStats(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
