// frontend/src/components/GeofenceMap.tsx
import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

// Leaflet & Geoman styles / plugins
import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import type { Feature } from "geojson";

export type GeofenceGeoJSON = any; 

type GeofenceMapProps = {
  /** Existing shape to show (optional) */
  value:Feature | null;
  /** Called whenever the user creates / changes / deletes a shape */
  onChange: (shape: Feature | null) => void;
};

/** 
 * This child component runs inside <MapContainer>,
 * so it can safely call useMap() and access the Leaflet map instance.
 * It wires up Geoman and emits GeoJSON to the parent.
 */
function GeomanHandler({ value, onChange }: GeofenceMapProps) {
  const map = useMap();

  useEffect(() => {
    // Geoman is attached to the map instance as "pm"
    const pm = (map as any).pm as any;
    if (!pm) {
      console.warn("Leaflet-Geoman (pm) is not available on the map instance.");
      return;
    }

    // Configure the Geoman controls:
    pm.addControls({
      position: "topleft",
      drawCircle: true,
      drawPolygon: true,
      drawMarker: false,
      drawCircleMarker: false,
      drawRectangle: false,
      drawPolyline: false,
      editMode: true,
      dragMode: false,
      cutPolygon: false,
      removalMode: true,
    });

    // Helper to clear existing drawn layers (but keep the base tile layer)
    const clearLayers = () => {
      map.eachLayer((layer: any) => {
        // tile layer has no pm; shapes added by Geoman *do* have pm
        if (layer.pm && layer instanceof L.Layer && !(layer instanceof L.TileLayer)) {
          map.removeLayer(layer);
        }
      });
    };

    // If the parent passed an initial value, render it:
    clearLayers();
    if (value) {
      L.geoJSON(value as any).addTo(map);
    }

    // When user finishes drawing a new shape
    const handleCreate = (e: any) => {
      const layer = e.layer as L.Layer;

      // only keep the latest shape (optional behaviour)
      clearLayers();
      map.addLayer(layer);

      // Convert to GeoJSON. For circles, Leaflet returns a Polygon approximation.
      const geojson = (layer as any).toGeoJSON();

      // Sending this GeoJSON to the polygon endpoint
      // Both Polygon and MultiPolygon work
      onChange(geojson);
    };

    // When a shape is removed via the Geoman delete tool
    const handleRemove = () => {
      onChange(null);
    };

    map.on("pm:create", handleCreate);
    map.on("pm:remove", handleRemove);

    // Cleanup when component unmounts or dependencies change
    return () => {
      map.off("pm:create", handleCreate);
      map.off("pm:remove", handleRemove);
      try {
        pm.removeControls();
      } catch {
        /* ignore */
      }
    };
  }, [map, value, onChange]);

  return null; // no JSX UI – this is a "logic-only" component
}

/**
 * Main exported map component.
 * Parent passes onChange to receive GeoJSON,
 * and (optionally) value to show an existing shape.
 */
export default function GeofenceMap({ value = null, onChange }: GeofenceMapProps) {
  return (
    <MapContainer
      center={[49.8951, -97.1384]} // Winnipeg-ish default
      zoom={13}
      style={{ height: "400px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <GeomanHandler value={value} onChange={onChange} />
    </MapContainer>
  );
}