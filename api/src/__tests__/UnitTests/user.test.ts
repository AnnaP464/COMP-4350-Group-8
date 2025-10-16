import { users } from "../../db/user";
import { query } from "../../db/connect";
import type { DbUser } from "../../contracts/db.contracts";

jest.mock("../../db/connect", () => ({
  query: jest.fn(),
}));

describe("Persistence layer User", () => {
  const fakeUser: DbUser = {
    id: "u1",
    email: "alex@example.com",
    username: "alex",
    role: "Volunteer",
    password_hash: "$2b$10$hash",
    created_at: new Date("2025-01-01"),
  };

  beforeEach(() => jest.clearAllMocks());


  test("findByEmail() returns the first matching row", async () => {
    (query as jest.Mock).mockResolvedValueOnce({ rows: [fakeUser] });

    const result = await users.findByEmail(fakeUser.email);

    expect(result).toEqual(fakeUser);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("SELECT * FROM users WHERE email"),
      [fakeUser.email]
    );
  });

  test("findByEmail() returns null when no rows", async () => {
    (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
    const result = await users.findByEmail("nobody@example.com");
    expect(result).toBeNull();
  });

  test("findByUsername() returns the first matching row", async () => {
    (query as jest.Mock).mockResolvedValueOnce({ rows: [fakeUser] });

    const result = await users.findByUsername(fakeUser.username);

    expect(result).toEqual(fakeUser);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("SELECT * FROM users WHERE username"),
      [fakeUser.username]
    );
  });

  test("findById() returns the first matching row", async () => {
    (query as jest.Mock).mockResolvedValueOnce({ rows: [fakeUser] });

    const result = await users.findById(fakeUser.id);

    expect(result).toEqual(fakeUser);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("SELECT * FROM users WHERE id"),
      [fakeUser.id]
    );
  });

  test("create() inserts new user and returns inserted row", async () => {
    const newUser = { ...fakeUser, id: "u2" };
    (query as jest.Mock).mockResolvedValueOnce({ rows: [newUser] });

    const input = {
      email: "new@example.com",
      username: "newuser",
      password_hash: "hashedpw",
    };

    const result = await users.create(input);

    expect(result).toEqual(newUser);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO users"),
      [input.email, input.username, input.password_hash, "user"]
    );
  });

  test("create() uses provided role if passed", async () => {
    const orgUser = { ...fakeUser, id: "u3", role: "Organization" };
    (query as jest.Mock).mockResolvedValueOnce({ rows: [orgUser] });

    const result = await users.create({
      email: "admin@example.com",
      username: "admin",
      password_hash: "hashedpw",
      role: "Organization",
    });

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO users"),
      ["admin@example.com", "admin", "hashedpw", "admin"]
    );
    expect(result.role).toEqual(orgUser.role);

  });
});