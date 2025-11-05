import type { Feature, Polygon, MultiPolygon } from "geojson";

// Domain types shared between backend 
export type Role = "Volunteer" | "Organizer";
export type UserPublic = { username: string; email: string; role: Role };

export type GeofenceView = {
  id: string;
  name: string;
  // One of these will be present depending on shape type:
  area_geojson_4326?: unknown | null; // GeoJSON object (Polygon/MultiPolygon)
  center_lon?: number | null;
  center_lat?: number | null;
  radius_m?: number | null;
  created_at: string; // ISO
};

export type AreaGeoJSON4326 =
  | Polygon
  | MultiPolygon
  | Feature<Polygon | MultiPolygon>;

  export type CircleGeofenceInput = {
  eventId: string;
  name: string;
  lon: number;   // EPSG:4326
  lat: number;   // EPSG:4326
  radius_m: number;
};

export {};
