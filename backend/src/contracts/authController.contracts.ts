import type { RequestHandler } from "express";

export interface AuthController {
  register: RequestHandler;
  login:    RequestHandler;
  refresh:  RequestHandler;
  me:       RequestHandler;
  logout:   RequestHandler;
}