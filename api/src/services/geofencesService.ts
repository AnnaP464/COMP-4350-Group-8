// src/services/geofencesService.ts
import { GeofencesRepo} from "../contracts/geofences.contracts";
import { GeofenceView } from "../contracts/domain.types";

import type {
    CircleGeofenceInput,
    PolygonGeofenceInput,
    GeofencesService,
    } from "../contracts/geofences.svc.contracts";

export function makeGeofencesService(deps: { repo: GeofencesRepo }): GeofencesService {
  const { repo } = deps;

  return {
    // Create polygon/multipolygon fence
    async createPolygon(input: PolygonGeofenceInput): Promise<GeofenceView> {
      // Persistence returns DB fields; service returns normalized view
      const rec = await repo.createPolygonFence({
        eventId: input.eventId,
        name: input.name,
        geojson4326: input.geojson4326,
      });
      // After creation, fetch in normalized (4326/GeoJSON or circle) shape
      return (await repo.getFence(rec.id)) as GeofenceView;
    },

    // Create circle fence
    async createCircle(input: CircleGeofenceInput): Promise<GeofenceView> {
      const rec = await repo.createCircleFence({
        eventId: input.eventId,
        name: input.name,
        lon: input.lon,
        lat: input.lat,
        radius_m: input.radius_m,
      });
      return (await repo.getFence(rec.id)) as GeofenceView;
    },

    // Get all fences for an event (normalized for API)
    async listByEvent(eventId: string): Promise<GeofenceView[]> {
      return repo.listFencesByEvent(eventId);
    },

    // Get one by id (normalized for API)
    async getById(id: string): Promise<GeofenceView | null> {
      return repo.getFence(id);
    },

    // Delete by id
    async remove(id: string): Promise<void> {
      await repo.deleteFence(id);
    },
  };
}