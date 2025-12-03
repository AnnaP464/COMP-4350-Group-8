// tests/authController.test.ts
import type { Request, Response, NextFunction } from "express";
import { makeAuthController } from "../../controllers/authController";

describe("AuthController", () => {
  let svc: {
    register: jest.Mock;
    login: jest.Mock;
    refresh: jest.Mock;
    me: jest.Mock;
    logout: jest.Mock;
  };
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    svc = {
      register: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn(),
      me: jest.fn(),
      logout: jest.fn(),
    };

    req = { body: {}, cookies: {} };
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      cookie: jest.fn(), // we assert on this
    };
    next = jest.fn();
  });

  test("register → calls service, sets refresh cookie, returns 201 with access_token + user only", async () => {
    const ctrl = makeAuthController(svc);

    const svcResult = {
      accessToken: "access-123",
      refreshToken: "refresh-456", // should NOT be in response body
      user: { username: "alex", email: "alex@example.com", role: "Volunteer" },
    };
    svc.register.mockResolvedValue(svcResult);

    req.body = { email: "alex@example.com", password: "pw", username: "alex" };

    await ctrl.register(req as Request, res as Response, next as NextFunction);

    expect(svc.register).toHaveBeenCalledWith(req.body);

    // cookie was set with refresh token
    expect(res.cookie).toHaveBeenCalledWith(
      "refresh_token",
      "refresh-456",
      expect.objectContaining({ httpOnly: true }) //TEST FOR OTHER OPTIONS 
    );

    // response status + body
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      access_token: "access-123",
      user: svcResult.user,
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("login → calls service, sets refresh cookie, returns access_token + user only", async () => {
    const ctrl = makeAuthController(svc);

    const svcResult = {
      accessToken: "access-LOG",
      refreshToken: "refresh-LOG", // cookie only
      user: { username: "lee", email: "lee@example.com", role: "Volunteer" },
    };
    svc.login.mockResolvedValue(svcResult);

    req.body = { email: "lee@example.com", password: "pw" };

    await ctrl.login(req as Request, res as Response, next as NextFunction);

    expect(svc.login).toHaveBeenCalledWith(req.body);

    expect(res.cookie).toHaveBeenCalledWith(
      "refresh_token",
      "refresh-LOG",
      expect.objectContaining({ httpOnly: true })
    );

    expect(res.json).toHaveBeenCalledWith({
      access_token: "access-LOG",
      user: svcResult.user,
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("refresh → sets new refresh cookie and returns only access_token (+ user if provided)", async () => {
    const ctrl = makeAuthController(svc);

    const svcResult = {
      accessToken: "access-NEW",
      refreshToken: "refresh-NEW", // cookie only,
    };
    svc.refresh.mockResolvedValue(svcResult);

    req.cookies = { refresh_token: "oldToken" };

    await ctrl.refresh(req as Request, res as Response, next as NextFunction);

    expect(svc.refresh).toHaveBeenCalledWith({ refreshToken: "oldToken" });

    // verify cookie options (don't hardcode env-dependent flags)
    expect(res.cookie).toHaveBeenCalledWith(
      "refresh_token",
      "refresh-NEW",
      expect.objectContaining({
        httpOnly: true,
        path: "/",
        sameSite: expect.any(String), // e.g. "lax"
        maxAge: expect.any(Number),
      })
    );

    expect(res.json).toHaveBeenCalledWith({
      access_token: "access-NEW",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("controller passes errors to next(err)", async () => {
    const ctrl = makeAuthController(svc);
    const err = new Error("boom");
    svc.login.mockRejectedValue(err);

    await ctrl.login(req as Request, res as Response, next as NextFunction);

    expect(next).toHaveBeenCalledWith(err);
  });
});
