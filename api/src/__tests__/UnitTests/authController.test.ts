// tests/authController.test.ts
import type { Request, Response, NextFunction } from "express";
import { makeAuthController } from "../../controllers/authController";

describe("AuthController", () => {
  let mockService: any;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockService = {
      register: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn(),
      me: jest.fn(),
      logout: jest.fn(),
    };

    mockReq = { body: {}, cookies: {} };
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      cookie: jest.fn(),
    };
    mockNext = jest.fn();
  });

    test("register → calls service, sets cookie, returns 201", async () => {
        const ctrl = makeAuthController(mockService);

        const mockUser = {
            accessToken: "access123",
            refreshToken: "refresh456",
            user: { username: "alex", email: "alex@example.com", role: "Volunteer" },
        };

        mockService.register.mockResolvedValue(mockUser);
        mockReq.body = { email: "alex@example.com", password: "pw", username: "alex" };

        await ctrl.register(mockReq as Request, mockRes as Response, mockNext as NextFunction);

        expect(mockService.register).toHaveBeenCalledWith(mockReq.body);

        expect(mockRes.cookie).toHaveBeenCalledWith(
            "refresh_token",
            "refresh456",
            expect.objectContaining({ httpOnly: true }) // or your refreshCookieOptions
        );

        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.json).toHaveBeenCalledWith({
            access_token: "access123",
            user: mockUser.user,
        });

        expect(mockNext).not.toHaveBeenCalled();
  });

    test("login → calls service and returns tokens", async () => {
        const ctrl = makeAuthController(mockService);

        const mockTokens = {
            accessToken: "access123",
            refreshToken: "refresh456",
            user: { username: "alex", email: "alex@example.com", role: "Volunteer" },
        };

        mockService.login.mockResolvedValue(mockTokens);
        mockReq.body = { email: "alex@example.com", password: "pw" };

        await ctrl.login(mockReq as Request, mockRes as Response, mockNext);

        expect(mockService.login).toHaveBeenCalledWith(mockReq.body);
        expect(mockRes.json).toHaveBeenCalledWith(mockTokens);
    });

    test("refresh → sends new tokens, sets cookie", async () => {
        const ctrl = makeAuthController(mockService);

        const tokens = {
            accessToken: "access-NEW",
            refreshToken: "refresh-NEW",
            user: { username: "alex", email: "alex@example.com", role: "Volunteer" },
        };

        mockService.refresh.mockResolvedValue(tokens);
        mockReq.cookies = { refresh_token: "oldToken" };

        await ctrl.refresh(mockReq as Request, mockRes as Response, mockNext);

        expect(mockService.refresh).toHaveBeenCalledWith("oldToken");
        expect(mockRes.cookie).toHaveBeenCalledWith(
            "refresh_token",
            "refresh-NEW",
            expect.objectContaining({
                httpOnly: true,
                sameSite: "lax",
                path: "/v1/auth/refresh",
                // secure: process.env.NODE_ENV === "production",
                maxAge: 30 * 24 * 60 * 60 * 1000,
            })
        );
        expect(mockRes.json).toHaveBeenCalledWith({
            access_token: "access-NEW",
            refresh_token: "refresh-NEW",
            user: tokens.user,
        });
    });
});


