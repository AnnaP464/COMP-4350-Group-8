
import  { GeofenceView } from "./domain.types";

// ---- Service contract ----

// Polygon/MultiPolygon create (frontend sends GeoJSON in EPSG:4326)
export type PolygonGeofenceInput = {
  eventId: string;
  name: string;
  geojson4326: string; // GeoJSON text (Feature or (Multi)Polygon geometry)
};

// Circle create (frontend sends lon/lat in EPSG:4326 + radius in meters)
export type CircleGeofenceInput = {
  eventId: string;
  name: string;
  lon: number;
  lat: number;
  radius_m: number;
};

export interface GeofencesService {
  createPolygon(input: PolygonGeofenceInput): Promise<GeofenceView>;
  createCircle(input: CircleGeofenceInput): Promise<GeofenceView>;
  listByEvent(eventId: string): Promise<GeofenceView[]>;
  getById(id: string): Promise<GeofenceView | null>;
  remove(id: string): Promise<void>;
}