// tests/db/userProfileDb.test.ts
// Unit tests for userProfile database layer

import * as userProfileDb from "../../db/userProfile";
import * as db from "../../db/connect";

// Mock the database connection
jest.mock("../../db/connect");

const mockQuery = db.query as jest.MockedFunction<typeof db.query>;

describe("UserProfileDb", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getUserProfileByUserId", () => {
    test("returns profile when found", async () => {
      const mockProfile = {
        userId: "user-1",
        bio: "Test bio",
        avatarUrl: "https://example.com/avatar.jpg",
        phone: "555-1234",
        city: "Winnipeg",
        country: "Canada",
        contactPref: "email",
        updatedAt: "2025-01-01T00:00:00Z",
      };
      mockQuery.mockResolvedValue({ rows: [mockProfile], rowCount: 1 } as any);

      const result = await userProfileDb.getUserProfileByUserId("user-1");

      expect(result).toEqual(mockProfile);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("WHERE user_id = $1"),
        ["user-1"]
      );
    });

    test("returns null when profile not found", async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const result = await userProfileDb.getUserProfileByUserId("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("upsertUserProfile", () => {
    test("inserts new profile with all fields", async () => {
      const mockProfile = {
        userId: "user-1",
        bio: "New bio",
        avatarUrl: "https://example.com/new.jpg",
        phone: "555-5678",
        city: "Toronto",
        country: "Canada",
        contactPref: "phone",
        updatedAt: "2025-01-01T00:00:00Z",
      };
      mockQuery.mockResolvedValue({ rows: [mockProfile], rowCount: 1 } as any);

      const result = await userProfileDb.upsertUserProfile("user-1", {
        bio: "New bio",
        avatarUrl: "https://example.com/new.jpg",
        phone: "555-5678",
        city: "Toronto",
        country: "Canada",
        contactPref: "phone",
      });

      expect(result).toEqual(mockProfile);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("ON CONFLICT (user_id) DO UPDATE"),
        ["user-1", "New bio", "https://example.com/new.jpg", "555-5678", "Toronto", "Canada", "phone"]
      );
    });

    test("handles partial fields with nulls", async () => {
      const mockProfile = {
        userId: "user-1",
        bio: "Just bio",
        avatarUrl: null,
        phone: null,
        city: null,
        country: null,
        contactPref: null,
        updatedAt: "2025-01-01T00:00:00Z",
      };
      mockQuery.mockResolvedValue({ rows: [mockProfile], rowCount: 1 } as any);

      const result = await userProfileDb.upsertUserProfile("user-1", {
        bio: "Just bio",
      });

      expect(result).toEqual(mockProfile);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO user_profiles"),
        ["user-1", "Just bio", null, null, null, null, null]
      );
    });

    test("handles empty update object", async () => {
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
      mockQuery.mockResolvedValue({ rows: [mockProfile], rowCount: 1 } as any);

      const result = await userProfileDb.upsertUserProfile("user-1", {});

      expect(result).toEqual(mockProfile);
    });
  });

  describe("patchUserProfile", () => {
    test("updates only provided fields", async () => {
      const mockProfile = {
        userId: "user-1",
        bio: "Updated bio",
        avatarUrl: "https://example.com/old.jpg",
        phone: "555-1234",
        city: "Winnipeg",
        country: "Canada",
        contactPref: "email",
        updatedAt: "2025-01-02T00:00:00Z",
      };
      mockQuery.mockResolvedValue({ rows: [mockProfile], rowCount: 1 } as any);

      const result = await userProfileDb.patchUserProfile("user-1", {
        bio: "Updated bio",
      });

      expect(result).toEqual(mockProfile);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE user_profiles"),
        expect.arrayContaining(["user-1", "Updated bio"])
      );
    });

    test("updates multiple fields", async () => {
      const mockProfile = {
        userId: "user-1",
        bio: "New bio",
        avatarUrl: null,
        phone: "555-9999",
        city: "Vancouver",
        country: "Canada",
        contactPref: "phone",
        updatedAt: "2025-01-02T00:00:00Z",
      };
      mockQuery.mockResolvedValue({ rows: [mockProfile], rowCount: 1 } as any);

      const result = await userProfileDb.patchUserProfile("user-1", {
        bio: "New bio",
        phone: "555-9999",
        city: "Vancouver",
        contactPref: "phone",
      });

      expect(result).toEqual(mockProfile);
    });

    test("returns current profile when no fields provided", async () => {
      const mockProfile = {
        userId: "user-1",
        bio: "Existing bio",
        avatarUrl: null,
        phone: null,
        city: null,
        country: null,
        contactPref: null,
        updatedAt: "2025-01-01T00:00:00Z",
      };
      mockQuery.mockResolvedValue({ rows: [mockProfile], rowCount: 1 } as any);

      const result = await userProfileDb.patchUserProfile("user-1", {});

      expect(result).toEqual(mockProfile);
    });

    test("creates profile via upsert when patch finds no existing row", async () => {
      const newProfile = {
        userId: "new-user",
        bio: "New user bio",
        avatarUrl: null,
        phone: null,
        city: null,
        country: null,
        contactPref: null,
        updatedAt: "2025-01-01T00:00:00Z",
      };
      // First call (UPDATE) returns nothing
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
      // Second call (INSERT via upsert) returns new profile
      mockQuery.mockResolvedValueOnce({ rows: [newProfile], rowCount: 1 } as any);

      const result = await userProfileDb.patchUserProfile("new-user", {
        bio: "New user bio",
      });

      expect(result).toEqual(newProfile);
    });
  });

  describe("getSocialLinksByUserId", () => {
    test("returns social links for user", async () => {
      const mockLinks = [
        { id: "link-1", userId: "user-1", platform: "github", url: "https://github.com/test", handle: "test" },
        { id: "link-2", userId: "user-1", platform: "linkedin", url: "https://linkedin.com/in/test", handle: null },
      ];
      mockQuery.mockResolvedValue({ rows: mockLinks, rowCount: 2 } as any);

      const result = await userProfileDb.getSocialLinksByUserId("user-1");

      expect(result).toEqual(mockLinks);
      expect(result).toHaveLength(2);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("WHERE user_id = $1"),
        ["user-1"]
      );
    });

    test("returns empty array when no social links", async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const result = await userProfileDb.getSocialLinksByUserId("user-1");

      expect(result).toEqual([]);
    });
  });

  describe("upsertSocialLink", () => {
    test("inserts new social link", async () => {
      const mockLink = {
        id: "link-1",
        userId: "user-1",
        platform: "github",
        handle: "testuser",
        url: "https://github.com/testuser",
        createdAt: "2025-01-01T00:00:00Z",
      };
      mockQuery.mockResolvedValue({ rows: [mockLink], rowCount: 1 } as any);

      const result = await userProfileDb.upsertSocialLink("user-1", {
        platform: "github",
        url: "https://github.com/testuser",
        handle: "testuser",
      });

      expect(result).toEqual(mockLink);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("ON CONFLICT (user_id, platform)"),
        ["user-1", "github", "testuser", "https://github.com/testuser"]
      );
    });

    test("updates existing social link on conflict", async () => {
      const mockLink = {
        id: "link-1",
        userId: "user-1",
        platform: "github",
        handle: "newhandle",
        url: "https://github.com/newhandle",
        createdAt: "2025-01-01T00:00:00Z",
      };
      mockQuery.mockResolvedValue({ rows: [mockLink], rowCount: 1 } as any);

      const result = await userProfileDb.upsertSocialLink("user-1", {
        platform: "github",
        url: "https://github.com/newhandle",
        handle: "newhandle",
      });

      expect(result).toEqual(mockLink);
    });

    test("handles null handle", async () => {
      const mockLink = {
        id: "link-1",
        userId: "user-1",
        platform: "website",
        handle: null,
        url: "https://example.com",
        createdAt: "2025-01-01T00:00:00Z",
      };
      mockQuery.mockResolvedValue({ rows: [mockLink], rowCount: 1 } as any);

      const result = await userProfileDb.upsertSocialLink("user-1", {
        platform: "website",
        url: "https://example.com",
      });

      expect(result).toEqual(mockLink);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO social_links"),
        ["user-1", "website", null, "https://example.com"]
      );
    });
  });

  describe("deleteSocialLink", () => {
    test("returns deleted: true when link exists", async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 } as any);

      const result = await userProfileDb.deleteSocialLink("user-1", "github");

      expect(result).toEqual({ deleted: true });
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM social_links"),
        ["user-1", "github"]
      );
    });

    test("returns deleted: false when link does not exist", async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const result = await userProfileDb.deleteSocialLink("user-1", "nonexistent");

      expect(result).toEqual({ deleted: false });
    });

    test("handles null rowCount", async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: null } as any);

      const result = await userProfileDb.deleteSocialLink("user-1", "github");

      expect(result).toEqual({ deleted: false });
    });
  });
});
