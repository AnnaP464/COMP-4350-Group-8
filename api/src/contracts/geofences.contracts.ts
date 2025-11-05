// src/contracts/geofences.contracts.ts
import  { GeofenceView } from "./domain.types";

// ---- Repo (persistence) contract the service depends on ----
export interface GeofencesRepo {
  createPolygonFence(input: {
    eventId: string;
    name: string;
    geojson4326: string;
  }): Promise<{ id: string; event_id: string; name: string; radius_m: number | null; created_at: string }>;

  createCircleFence(input: {
    eventId: string;
    name: string;
    lon: number;
    lat: number;
    radius_m: number;
  }): Promise<{ id: string; event_id: string; name: string; radius_m: number | null; created_at: string }>;

  listFencesByEvent(eventId: string): Promise<GeofenceView[]>;
  getFence(id: string): Promise<GeofenceView | null>;
  deleteFence(id: string): Promise<void>;
}