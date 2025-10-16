import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const RegisterRequest = z.object({
  username: z.string().min(3).max(32),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["Organizer", "Volunteer"]),
});
const UserPublic = z
  .object({ id: z.string(), username: z.string(), role: z.string() })
  .passthrough();
const LoginResponse = z
  .object({ access_token: z.string(), user: UserPublic })
  .passthrough();
const ErrorResponse = z.object({ message: z.string() }).partial().passthrough();
const LoginRequest = z.object({
  email: z.string().email(),
  password: z.string(),
});
const RefreshResponse = z.object({ access_token: z.string() }).passthrough();
const TokenErrorResponse = z
  .object({ message: z.string() })
  .partial()
  .passthrough();
const Event = z
  .object({
    id: z.string(),
    name: z.string(),
    starts_at: z.string().datetime({ offset: true }),
    ends_at: z.string().datetime({ offset: true }),
    location: z
      .object({ lat: z.number(), lon: z.number() })
      .partial()
      .passthrough(),
    verifier: z
      .object({ id: z.string(), name: z.string() })
      .partial()
      .passthrough(),
  })
  .passthrough();

export const schemas = {
  RegisterRequest,
  UserPublic,
  LoginResponse,
  ErrorResponse,
  LoginRequest,
  RefreshResponse,
  TokenErrorResponse,
  Event,
};

const endpoints = makeApi([
  {
    method: "post",
    path: "/v1/auth/login",
    alias: "postV1authlogin",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: LoginRequest,
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 400,
        description: `Invalid input`,
        schema: z.object({ message: z.string() }).partial().passthrough(),
      },
      {
        status: 401,
        description: `Invalid credentials or unverified email`,
        schema: z.object({ message: z.string() }).partial().passthrough(),
      },
      {
        status: NaN,
        schema: z.void(),
      },
    ],
  },
  {
    method: "post",
    path: "/v1/auth/logout",
    alias: "postV1authlogout",
    requestFormat: "json",
    response: z.void(),
    errors: [
      {
        status: 401,
        description: `Missing or invalid access token`,
        schema: z.object({ message: z.string() }).partial().passthrough(),
      },
    ],
  },
  {
    method: "post",
    path: "/v1/auth/refresh",
    alias: "postV1authrefresh",
    requestFormat: "json",
    response: z.object({ access_token: z.string() }).passthrough(),
    errors: [
      {
        status: 401,
        description: `Invalid/expired refresh token or reuse detected`,
        schema: z.object({ message: z.string() }).partial().passthrough(),
      },
    ],
  },
  {
    method: "post",
    path: "/v1/auth/register",
    alias: "postV1authregister",
    description: `Creates a user with **username, email, password**.  
Optionally send a verification email before enabling sensitive actions.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: RegisterRequest,
      },
    ],
    response: LoginResponse,
    errors: [
      {
        status: 400,
        description: `Invalid input (e.g., weak password, bad email)`,
        schema: z.object({ message: z.string() }).partial().passthrough(),
      },
      {
        status: 409,
        description: `Username or email already exists`,
        schema: z.object({ message: z.string() }).partial().passthrough(),
      },
    ],
  },
  {
    method: "get",
    path: "/v1/events",
    alias: "getV1events",
    description: `Returns all available volunteer events, optionally filtered by date or location.`,
    requestFormat: "json",
    parameters: [
      {
        name: "from",
        type: "Query",
        schema: z.string().datetime({ offset: true }).optional(),
      },
      {
        name: "to",
        type: "Query",
        schema: z.string().datetime({ offset: true }).optional(),
      },
    ],
    response: z.array(Event),
    errors: [
      {
        status: 400,
        description: `Invalid query parameters.`,
        schema: z.void(),
      },
      {
        status: 500,
        description: `Internal server error.`,
        schema: z.void(),
      },
    ],
  },
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
