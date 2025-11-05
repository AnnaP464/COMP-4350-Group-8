// src/contracts/controllers/geofences.controller.contract.ts
import type { Request, Response } from "express";

export interface GeofencesController {
  createPolygon(req: Request, res: Response): Promise<void>;
  createCircle(req: Request, res: Response): Promise<void>;
  listByEvent(req: Request, res: Response): Promise<void>;
  getById(req: Request, res: Response): Promise<void>;
  remove(req: Request, res: Response): Promise<void>;
}