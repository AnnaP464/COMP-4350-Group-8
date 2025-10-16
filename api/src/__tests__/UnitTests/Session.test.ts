// tests/db/session.test.ts
import { sessions, setReplacedBy } from "../../db/Session";
import { query } from "../../db/connect";

jest.mock("../../db/connect", () => ({
  query: jest.fn(),
}));

describe("sessions repository", () => {
  beforeEach(() => jest.clearAllMocks());

  test("create() inserts record", async () => {
    const expiresAt = new Date("2030-01-01T00:00:00Z");

    await sessions.create({
      jti: "jti-123",
      userId: "u1",
      expiresAt,
    });

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO refresh_tokens"),
      ["jti-123", "u1", expiresAt.toISOString()]
    );
  });

  test("findByJti() queries with correct value", async () => {
    (query as jest.Mock).mockResolvedValueOnce({ rows: [{ jti: "abc" }] });
    const result = await sessions.findByJti("abc");
    expect(result).toEqual({ jti: "abc" });
    expect(query).toHaveBeenCalledWith(expect.stringContaining("SELECT"), ["abc"]);
  });

  test("revoke() updates revoked_at", async () => {
    await sessions.revoke("jti-1");
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE refresh_tokens SET revoked_at"),
      ["jti-1"]
    );
  });

  test("revokeAllForUser() revokes all user tokens", async () => {
    await sessions.revokeAllForUser("u1");
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE refresh_tokens SET revoked_at"),
      ["u1"]
    );
  });

  test("setReplacedBy() updates replaced_by and revoked_at", async () => {
    await setReplacedBy("old-jti", "new-jti");
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("SET replaced_by"),
      ["old-jti", "new-jti"]
    );
  });
});