import type { UserModel as Users, SessionsModel as Sessions, DbUser as UserRow } from "../../contracts/db.contracts";


// Mock the token service so AuthService logic can be tested in isolation.
jest.mock("../../services/tokenService", () => ({
  issueAccessToken: jest.fn(() => "access-NEW"),
  issueRefreshToken: jest.fn(() => ({ token: "refresh-NEW", jti: "jti-NEW" })),
  verifyRefresh: jest.fn(() => ({ sub: "u1", jti: "jti-OLD" })),
}));

jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import {compare, hash} from "bcryptjs";
import { makeAuthService } from "../../services/authService";

// Pull typed functions so we can override per-test
import * as tokens from "../../services/tokenService";

const baseUser: UserRow = {
  id: "u1",
  email: "alex@example.com",
  username: "alex",
  role: "Volunteer",
  password_hash: "$2b$10$hash", // not used directly (verifyPassword is mocked)
  //created_at: new Date(),
};

function makeUsersMock(initial?: Partial<UserRow>) {
  const row: UserRow = {
    id: "u1",
    email: "alex@example.com",
    username: "alex",
    role: "Volunteer",
    password_hash: "$2b$10$hash",
    //created_at: new Date(),
    ...initial,
  };

  const users: jest.Mocked<Users> = {
    findByEmail:  jest.fn().mockResolvedValue(row),
    findById:     jest.fn().mockResolvedValue(row),
    create:       jest.fn().mockImplementation(async (input) => {
      const newUser = {
        email: input.email,
        username: input.username,
        password_hash: input.password_hash,
        role: (input.role ?? "Volunteer") as UserRow["role"],
      };
      return newUser;
    })}
  return users;
}
function makeSessionsMock() {
  return {
    create: jest.fn().mockImplementation(async (input) => {
      const row: UserRow = {
        id: "new-user-id",
        email: input.email,
        username: input.username,
        role: (input.role ?? "Volunteer") as UserRow["role"],
        password_hash: input.password_hash,      // echo what service hashed
        //created_at: new Date().toISOString(),
      };
      return row;
    }),
    findByJti: jest.fn().mockResolvedValue({
      jti: "jti-OLD",
      user_id: "u1",
      revoked_at: null,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 3600_000).toISOString(),
    }),
    revoke: jest.fn(),
    revokeAllForUser: jest.fn(),
  } as const;
}

describe("AuthService", () => {
  let users: Users;
  let sessions: Sessions;

  beforeEach(() => {
    jest.clearAllMocks();
    users = makeUsersMock();
    sessions = makeSessionsMock();

    // Default token mocks (can be overridden per test)
    (tokens.issueAccessToken as jest.Mock).mockReturnValue("access-NEW");
    (tokens.issueRefreshToken as jest.Mock).mockReturnValue({ token: "refresh-NEW", jti: "jti-NEW" });
    (tokens.verifyRefresh as jest.Mock).mockReturnValue({ sub: "u1", jti: "jti-OLD" });
  });

  //Login Test: Success
  test("login: success → issues tokens and returns public user", async () => {
    const auth = makeAuthService({ users, sessions });

    // verifyPassword must return true for success
    (compare as jest.Mock).mockResolvedValue(true);

    const result = await auth.login({ email: baseUser.email, password: "correct-password" });

    expect(tokens.issueAccessToken).toHaveBeenCalledWith({ id: baseUser.id, role: baseUser.role });
    expect(tokens.issueRefreshToken).toHaveBeenCalledWith({ id: baseUser.id, role: baseUser.role });
    expect(sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ jti: "jti-NEW", userId: "u1", expiresAt: expect.any(Date) })
    );
    expect(result).toEqual({
      accessToken: "access-NEW",
      refreshToken: "refresh-NEW",
      user: { username: baseUser.username, email: baseUser.email, role: baseUser.role },
    });
  });

  //Login Test: Failure
  test("login: invalid credentials → throws", async () => {
    const auth = makeAuthService({ users, sessions });

    (compare as jest.Mock).mockResolvedValue(false);

    await expect(auth.login({ email: baseUser.email, password: "wrong" }))
      .rejects.toThrow(/invalid/i);
  });

  //Register Test: Success
  test("register: success → creates user, issues tokens, stores session", async () => {
    const auth = makeAuthService({ users, sessions });

    // Ensure no collision
    users.findByEmail = jest.fn().mockResolvedValue(null);
    (hash as jest.Mock).mockResolvedValue("hashedpw");

    const result = await auth.register({ email: "new@example.com", username: "newuser", password: "StrongPassw0rd!", role: "Volunteer" });

    expect(users.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: "new@example.com", username: "newuser", password_hash: expect.any(String), role: "Volunteer" })
    );
    expect(tokens.issueAccessToken).toHaveBeenCalled();
    expect(tokens.issueRefreshToken).toHaveBeenCalled();
    expect(sessions.create).toHaveBeenCalled();
    expect(result.user).toEqual({email: "new@example.com", username: "newuser", role: "Volunteer" });
  });

  //Refresh Test: Success
  test("refresh: success → verifies, rotates, revokes old, creates new", async () => {
    const auth = makeAuthService({ users, sessions });

    const result = await auth.refresh({ refreshToken: "any.valid.token" });

    expect(tokens.verifyRefresh).toHaveBeenCalledWith("any.valid.token");
    expect(sessions.findByJti).toHaveBeenCalledWith("jti-OLD");
    expect(sessions.revoke).toHaveBeenCalledWith("jti-OLD");
    expect(tokens.issueAccessToken).toHaveBeenCalledWith({ id: "u1", role: "Volunteer" });
    expect(tokens.issueRefreshToken).toHaveBeenCalledWith({ id: "u1", role: "Volunteer" });
    expect(sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ jti: "jti-NEW", userId: "u1", expiresAt: expect.any(Date) })
    );
    expect(result).toEqual({ accessToken: "access-NEW", refreshToken: "refresh-NEW" });
  });

  //Refresh Test: Failure - unknown/expired session
  test("refresh: unknown/expired session → revoke all for user and throw", async () => {
    const auth = makeAuthService({ users, sessions });

    (tokens.verifyRefresh as jest.Mock).mockReturnValue({ sub: "u1", jti: "not-in-db" });
    sessions.findByJti = jest.fn().mockResolvedValue(null);

    await expect(auth.refresh({ refreshToken: "stale" }))
      .rejects.toThrow(/invalid refresh token/i);

    expect(sessions.revokeAllForUser).toHaveBeenCalledWith("u1");
  });

  //Refresh Test: Failure - malformed/invalid token
  test("refresh: malformed/invalid token → throws before DB lookup", async () => {
    const auth = makeAuthService({ users, sessions });

    (tokens.verifyRefresh as jest.Mock).mockImplementation(() => {
      throw new Error("jwt malformed");
    });

    await expect(auth.refresh({ refreshToken: "bad.token" }))
      .rejects.toThrow(/malformed|invalid|jwt/i);

    expect(sessions.findByJti).not.toHaveBeenCalled();
  });
});