// src/controllers/geofences.controller.ts
import type { Request, Response } from "express";
import type { GeofencesService } from "../contracts/geofences.svc.contracts";
import type { GeofencesController } from "../contracts/geofences.ctrl.contracts";

export function makeGeofencesController(deps: { service: GeofencesService }) : GeofencesController {
  const { service } = deps;

  return {
    createPolygon: async (req: Request, res: Response) => {
      const { eventId } = req.params as { eventId: string };
      const { name, geojson4326 } = req.body as {
        name: string;
        geojson4326: string | object;
      };

      const view = await service.createPolygon({
        eventId,
        name,
        geojson4326: typeof geojson4326 === "string" ? geojson4326 : JSON.stringify(geojson4326),
      });
      res.status(201).json(view);
    },

    createCircle: async (req: Request, res: Response) => {
      const { eventId } = req.params as { eventId: string };
      const { name, lon, lat, radius_m } = req.body as {
        name: string; lon: number; lat: number; radius_m: number;
      };

      const view = await service.createCircle({ eventId, name, lon, lat, radius_m });
      res.status(201).json(view);
    },

    listByEvent: async (req: Request, res: Response) => {
      const { eventId } = req.params as { eventId: string };
      const views = await service.listByEvent(eventId);
      res.json(views);
    },

    getById: async (req: Request, res: Response) => {
      const { id } = req.params as { id: string };
      const view = await service.getById(id);
      if (!view) res.status(404).json({ error: "Not Found" });
      res.json(view);
    },

    remove: async (req: Request, res: Response) => {
      const { id } = req.params as { id: string };
      await service.remove(id);
      res.status(204).send();
    },
  };
}