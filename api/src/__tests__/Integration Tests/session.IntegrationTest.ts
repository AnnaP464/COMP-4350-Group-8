import { sessions } from "../../db/Session";
import { query } from "../../db/connect";

describe("sessions repository (integration)", () => {
  afterEach(async () => {
    
    // clear test table between runs
    await query("DELETE FROM refresh_tokens");
  });

  test("create() inserts a refresh token record", async () => {
    const rec = {
      jti: "abc123",
      userId: "u1",
      expiresAt: new Date("2030-01-01T00:00:00Z"),
    };

    await sessions.create(rec);

    const { rows } = await query("SELECT * FROM refresh_tokens WHERE jti = $1", [rec.jti]);
    expect(rows).toHaveLength(1);
    expect(rows[0].user_id).toBe("u1");
  });

  test("findByJti() returns matching session", async () => {
    await query(
      `INSERT INTO refresh_tokens (jti, user_id, expires_at)
       VALUES ('find-me', 'u1', '2030-01-01T00:00:00Z')`
    );

    const found = await sessions.findByJti("find-me");
    expect(found).not.toBeNull();
    expect(found?.user_id).toBe("u1");
  });

  test("findByJti() returns null for missing session", async () => {
    const missing = await sessions.findByJti("not-found");
    expect(missing).toBeNull();
  });

  test("revoke() sets revoked_at for one token", async () => {
    await query(`
      INSERT INTO refresh_tokens (jti, user_id, expires_at)
      VALUES ('revoke-me', 'u2', '2030-01-01T00:00:00Z')
    `);

    await sessions.revoke("revoke-me");

    const { rows } = await query("SELECT revoked_at FROM refresh_tokens WHERE jti = 'revoke-me'");
    expect(rows[0].revoked_at).not.toBeNull();
  });

  test("revokeAllForUser() revokes all active tokens for a user", async () => {
    await query(`
      INSERT INTO refresh_tokens (jti, user_id, expires_at)
      VALUES 
      ('a', 'u3', '2030-01-01T00:00:00Z'),
      ('b', 'u3', '2030-01-01T00:00:00Z')
    `);

    await sessions.revokeAllForUser("u3");

    const { rows } = await query("SELECT revoked_at FROM refresh_tokens WHERE user_id = 'u3'");
    expect(rows.every(r => r.revoked_at !== null)).toBe(true);
  });

});