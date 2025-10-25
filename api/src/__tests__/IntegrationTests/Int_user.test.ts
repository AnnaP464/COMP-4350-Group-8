import { users } from "../../db/user";
import { query } from "../../db/connect";

describe("users repository (integration)", () => {
  afterEach(async () => {
    // optional if your global setup already clears it
    await query("DELETE FROM users");
  });

  test("create() inserts and returns a user", async () => {
    const created = await users.create({
      email: "real@example.com",
      username: "realuser",
      password_hash: "hashedpw",
    });

    expect(created.email).toBe("real@example.com");
    expect(created.username).toBe("realuser");

    const { rows } = await query("SELECT * FROM users WHERE email = $1", ["real@example.com"]);
    expect(rows).toHaveLength(1);
  });

  test("findByEmail() returns correct user", async () => {
    await users.create({
      email: "alex@example.com",
      username: "alex",
      password_hash: "hashed",
    });

    const found = await users.findByEmail("alex@example.com");
    expect(found?.username).toBe("alex");
  });

  test("findByUsername() returns correct user", async () => {
    await users.create({
      email: "user@example.com",
      username: "uniqueuser",
      password_hash: "hashed",
    });

    const found = await users.findByUsername("uniqueuser");
    expect(found?.email).toBe("user@example.com");
  });

  test("findById() returns correct user", async () => {
    const created = await users.create({
      email: "findid@example.com",
      username: "findiduser",
      password_hash: "hashed",
    });

    const fetched = await users.findById(created.id);
    expect(fetched?.email).toBe("findid@example.com");
  });

  test("create() defaults to role 'user' when no role provided", async () => {
    const created = await users.create({
      email: "defaultrole@example.com",
      username: "defrole",
      password_hash: "pw",
    });
    expect(created.role).toBe("user");
  });
});