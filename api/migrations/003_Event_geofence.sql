-- migrations/010_postgis.sql
CREATE EXTENSION IF NOT EXISTS postgis;

-- Geofence per event (polygon or circle)
CREATE TABLE event_geofences (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name          text NOT NULL,
  -- Using Geometry for meter-based distances as its simpler for calculations
  area          geometry(MultiPolygon, 3857),  -- for polygon/multipolygon geofences
  -- Optional circular geofence (center + radius, meters)
  center        geometry(Point, 3857),
  radius_m      integer,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_shape_present CHECK (area IS NOT NULL OR (center IS NOT NULL AND radius_m IS NOT NULL))
);

-- Indexes for fast spatial queries
CREATE INDEX idx_event_geofences_area_gix   ON event_geofences USING GIST (area);
CREATE INDEX idx_event_geofences_center_gix ON event_geofences USING GIST (center);
CREATE INDEX idx_event_geofences_event      ON event_geofences(event_id);