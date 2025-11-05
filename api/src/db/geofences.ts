// src/db/geofences.ts
import { query } from "./connect";

export type GeofenceRow = {
  id: string;
  event_id: string;
  name: string;
  // area and center are stored in 3857; we won’t select them raw in most APIs
  radius_m: number | null;
  created_at: string; // timestamptz -> ISO
};

/**
 * Create a polygon/multipolygon fence from GeoJSON (assumed EPSG:4326).
 * Stored as geometry(MultiPolygon, 3857).
 */
export async function createPolygonFence(opts: {
  eventId: string;
  name: string;
  geojson4326: string; // a Feature or (Multi)Polygon geometry GeoJSON string
}): Promise<GeofenceRow> {
  const { rows } = await query<GeofenceRow>(
    `
    INSERT INTO event_geofences (event_id, name, area)
    VALUES (
      $1,
      $2,
      -- Parse GeoJSON (4326) -> Multi -> Reproject to 3857 -> Make valid -> cast
      ST_MakeValid(
        ST_Transform(
          ST_Multi(
            ST_SetSRID(ST_GeomFromGeoJSON($3), 4326)
          ),
          3857
        )
      )::geometry(MultiPolygon, 3857)
    )
    RETURNING id, event_id, name, radius_m, created_at
    `,
    [opts.eventId, opts.name, opts.geojson4326]
  );
  return rows[0];
}

/**
 * Create a circular fence as center point (lon/lat WGS84) + radius in meters.
 * Stored center as geometry(Point, 3857) and radius_m as integer.
 */
export async function createCircleFence(opts: {
  eventId: string;
  name: string;
  lon: number; // WGS84 longitude
  lat: number; // WGS84 latitude
  radius_m: number; // meters
}): Promise<GeofenceRow> {
  const { rows } = await query<GeofenceRow>(
    `
    INSERT INTO event_geofences (event_id, name, center, radius_m)
    VALUES (
      $1,
      $2,
      ST_Transform(
        ST_SetSRID(ST_MakePoint($3, $4), 4326),
        3857
      )::geometry(Point, 3857),
      $5
    )
    RETURNING id, event_id, name, radius_m, created_at
    `,
    [opts.eventId, opts.name, opts.lon, opts.lat, Math.round(opts.radius_m)]
  );
  return rows[0];
}

/**
 * Return all fences for an event, normalized for the API:
 * - Polygons as GeoJSON (reprojected to 4326 for the frontend)
 * - Circles as center lon/lat (4326) + radius_m
 */
export type GeofenceApiShape = {
  id: string;
  name: string;
  // polygon fence (nullable):
  area_geojson_4326?: any | null;
  // circle fence (nullable):
  center_lon?: number | null;
  center_lat?: number | null;
  radius_m?: number | null;
  created_at: string;
};

export async function listFencesByEvent(eventId: string): Promise<GeofenceApiShape[]> {
  const { rows } = await query<GeofenceApiShape>(
    `
    SELECT
      id,
      name,
      -- polygons as GeoJSON in 4326 for client
      CASE
        WHEN area IS NOT NULL THEN ST_AsGeoJSON(ST_Transform(area, 4326))::json
        ELSE NULL
      END AS area_geojson_4326,
      -- circles as lon/lat in 4326 for client
      CASE WHEN center IS NOT NULL THEN ST_X(ST_Transform(center, 4326)) ELSE NULL END AS center_lon,
      CASE WHEN center IS NOT NULL THEN ST_Y(ST_Transform(center, 4326)) ELSE NULL END AS center_lat,
      radius_m,
      created_at
    FROM event_geofences
    WHERE event_id = $1
    ORDER BY created_at DESC
    `,
    [eventId]
  );
  return rows;
}

/** Get one fence in the same normalized form as listFencesByEvent */
export async function getFence(id: string): Promise<GeofenceApiShape | null> {
  const { rows } = await query<GeofenceApiShape>(
    `
    SELECT
      id,
      name,
      CASE
        WHEN area IS NOT NULL THEN ST_AsGeoJSON(ST_Transform(area, 4326))::json
        ELSE NULL
      END AS area_geojson_4326,
      CASE WHEN center IS NOT NULL THEN ST_X(ST_Transform(center, 4326)) ELSE NULL END AS center_lon,
      CASE WHEN center IS NOT NULL THEN ST_Y(ST_Transform(center, 4326)) ELSE NULL END AS center_lat,
      radius_m,
      created_at
    FROM event_geofences
    WHERE id = $1
    `,
    [id]
  );
  return rows[0] ?? null;
}

/** Delete a fence by id */
export async function deleteFence(id: string): Promise<void> {
  await query(`DELETE FROM event_geofences WHERE id = $1`, [id]);
}

/**
 * Point-in-any-fence test (returns true if the lon/lat lies inside any fence of the event)
 * Input lon/lat are WGS84. We transform to 3857 to match storage.
 */
export async function isPointInsideAnyFence(opts: {
  eventId: string;
  lon: number; // WGS84 longitude
  lat: number; // WGS84 latitude
}): Promise<boolean> {
  const { rows } = await query<{ inside: boolean }>(
    `
    SELECT EXISTS (
      SELECT 1
      FROM event_geofences eg
      WHERE eg.event_id = $1
        AND (
          -- polygon case: ST_Contains on 3857
          (eg.area IS NOT NULL AND ST_Contains(
             eg.area,
             ST_Transform(ST_SetSRID(ST_MakePoint($2, $3), 4326), 3857)
           ))
          OR
          -- circle case: center + radius_m in 3857 units (meters)
          (eg.center IS NOT NULL AND ST_DWithin(
             eg.center,
             ST_Transform(ST_SetSRID(ST_MakePoint($2, $3), 4326), 3857),
             eg.radius_m
           ))
        )
    ) AS inside
    `,
    [opts.eventId, opts.lon, opts.lat]
  );
  return rows[0]?.inside ?? false;
}

export const geofences = {
  createPolygonFence,
  createCircleFence,
  listFencesByEvent,
  getFence,
  deleteFence,
  isPointInsideAnyFence,
};



// Inserting into multipolygon geofence from GeoJSON
// ST_Multi(ST_GeomFromGeoJSON($geojson))

// Example of inserting a geofence for an event using PostGIS

/*INSERT INTO event_geofences (event_id, name, area)
VALUES (
  $1,
  $2,
  ST_GeogFromText('SRID=4326;MULTIPOLYGON(((-97.14 49.89, -97.14 49.88, -97.12 49.88, -97.12 49.89, -97.14 49.89)))')
);
*/

/*
-- Is the point inside any polygon geofence for the event?
SELECT 1
FROM event_geofences eg
WHERE eg.event_id = $eventId
  AND eg.area IS NOT NULL
  AND ST_Contains(eg.area::geometry, ST_SetSRID(ST_MakePoint($lon, $lat), 4326))
LIMIT 1;

*/

/*
-- Is the point within radius (meters) of any circle geofence?
SELECT 1
FROM event_geofences eg
WHERE eg.event_id = $eventId
  AND eg.center IS NOT NULL
  AND ST_DWithin(
        eg.center,
        ST_SetSRID(ST_MakePoint($lon, $lat), 4326)::geography,
        eg.radius_m
      )
LIMIT 1;
*/