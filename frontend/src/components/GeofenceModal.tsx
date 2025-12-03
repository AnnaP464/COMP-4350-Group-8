import React, { useState, useEffect } from "react";
import GeofenceMap from "./GeofenceMap";
import type { Feature } from "geojson";
import * as EventService from "../services/EventService";
import * as AuthService from "../services/AuthService";

export type GeofenceView = {
  id: string;
  name: string;
  area_geojson_4326?: unknown | null;
  center_lon?: number | null;
  center_lat?: number | null;
  radius_m?: number | null;
  created_at: string;
};

type ModalMode = "add" | "edit" | "delete";

type GeofenceModalProps = {
  eventId: string;
  mode: ModalMode;
  isOpen: boolean;
  onClose: () => void;
  onGeofencesChanged: () => void;
};

export default function GeofenceModal({
  eventId,
  mode,
  isOpen,
  onClose,
  onGeofencesChanged,
}: GeofenceModalProps) {
  const [geofences, setGeofences] = useState<GeofenceView[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Add mode state
  const [gfName, setGfName] = useState("");
  const [geofenceShape, setGeofenceShape] = useState<Feature | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch existing geofences when modal opens in edit/delete mode
  useEffect(() => {
    if (!isOpen) return;
    if (mode === "edit" || mode === "delete") {
      loadGeofences();
    }
  }, [isOpen, mode, eventId]);

  const loadGeofences = async () => {
    setLoading(true);
    try {
      const token = AuthService.getToken();
      const res = await EventService.fetchGeofences(token, eventId);
      if (res.ok) {
        const data = await res.json();
        setGeofences(data);
      }
    } catch (err) {
      console.error("Failed to load geofences:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (geofenceId: string) => {
    if (!confirm("Are you sure you want to delete this geofence?")) return;

    setDeleting(geofenceId);
    try {
      const token = AuthService.getToken();
      const res = await EventService.deleteGeofence(token, geofenceId);
      if (res.ok) {
        setGeofences((prev) => prev.filter((g) => g.id !== geofenceId));
        onGeofencesChanged();
      } else {
        const text = await res.text().catch(() => "");
        alert(text || "Failed to delete geofence.");
      }
    } catch (err) {
      console.error("Delete geofence error:", err);
      alert("Failed to delete geofence.");
    } finally {
      setDeleting(null);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = AuthService.getToken();
    if (!token) {
      alert("Session expired. Please log in again.");
      return;
    }

    if (!gfName.trim()) {
      alert("Please provide a name for the geofence.");
      return;
    }

    if (!geofenceShape) {
      alert("Please draw a geofence on the map.");
      return;
    }

    const geom = geofenceShape.geometry;
    const props: any = geofenceShape.properties || {};

    setSaving(true);

    try {
      let res: Response;

      // Geoman circle encoding: geometry is Point, properties._pmType === "Circle"
      if (props._pmType === "Circle" && geom.type === "Point") {
        const coords = geom.coordinates as [number, number]; // [lon, lat]
        const lon = coords[0];
        const lat = coords[1];
        const radius_m = props.radius ?? props.radius_m;

        if (
          !Number.isFinite(lat) ||
          !Number.isFinite(lon) ||
          !Number.isFinite(radius_m)
        ) {
          alert("Invalid circle geometry from map.");
          setSaving(false);
          return;
        }

        res = await EventService.createCircleGeofence(
          token,
          eventId,
          gfName.trim(),
          lat,
          lon,
          radius_m
        );
      } else {
        // Treat anything else as polygon/multipolygon
        if (geom.type !== "Polygon" && geom.type !== "MultiPolygon") {
          alert("Unsupported geometry type. Please draw a polygon or circle.");
          setSaving(false);
          return;
        }

        res = await EventService.createPolygonGeofence(
          token,
          eventId,
          gfName.trim(),
          geom
        );
      }

      if (res.status === 401) {
        alert("Session expired. Please log in again.");
        return;
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        alert(text || "Failed to create geofence.");
        return;
      }

      alert("Geofence saved successfully!");
      setGfName("");
      setGeofenceShape(null);
      onGeofencesChanged();
      onClose();
    } catch (err) {
      console.error("Create geofence error:", err);
      alert("Failed to create geofence.");
    } finally {
      setSaving(false);
    }
  };

  const resetAndClose = () => {
    setGfName("");
    setGeofenceShape(null);
    setGeofences([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="geofence-modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={resetAndClose}
    >
      <div className="geofence-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="geofence-modal-header">
          <h3 style={{ margin: 0 }}>
            {mode === "add" && "Add Geofence"}
            {mode === "edit" && "Edit Geofences"}
            {mode === "delete" && "Delete Geofences"}
          </h3>
          <button
            type="button"
            className="geofence-modal-close"
            onClick={resetAndClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="geofence-modal-content">
          {/* ADD MODE */}
          {mode === "add" && (
            <form onSubmit={handleAdd} className="geofence-add-form">
              <p className="geofence-modal-description">
                Draw a polygon or circle on the map to define where volunteers
                can sign in.
              </p>

              <input
                className="text-input"
                type="text"
                placeholder="Geofence name (e.g. Main entrance)"
                value={gfName}
                onChange={(e) => setGfName(e.target.value)}
              />

              <div className="geofence-map-container">
                <GeofenceMap value={geofenceShape} onChange={setGeofenceShape} />
              </div>

              <div className="geofence-modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={resetAndClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="option-btn"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Geofence"}
                </button>
              </div>
            </form>
          )}

          {/* EDIT MODE */}
          {mode === "edit" && (
            <div className="geofence-edit-container">
              <p className="geofence-modal-description">
                Manage existing geofences for this event. You can delete
                geofences and add new ones.
              </p>

              {loading ? (
                <p className="geofence-loading">Loading geofences...</p>
              ) : geofences.length === 0 ? (
                <p className="geofence-empty">
                  No geofences defined for this event.
                </p>
              ) : (
                <ul className="geofence-list">
                  {geofences.map((gf) => (
                    <li key={gf.id} className="geofence-list-item">
                      <div className="geofence-info">
                        <strong>{gf.name}</strong>
                        <span className="geofence-type">
                          {gf.center_lat != null ? "Circle" : "Polygon"}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="cancel-btn"
                        onClick={() => handleDelete(gf.id)}
                        disabled={deleting === gf.id}
                      >
                        {deleting === gf.id ? "Deleting..." : "Delete"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="geofence-modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={resetAndClose}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* DELETE MODE */}
          {mode === "delete" && (
            <div className="geofence-delete-container">
              <p className="geofence-modal-description">
                Select geofences to delete from this event.
              </p>

              {loading ? (
                <p className="geofence-loading">Loading geofences...</p>
              ) : geofences.length === 0 ? (
                <p className="geofence-empty">
                  No geofences to delete.
                </p>
              ) : (
                <ul className="geofence-list">
                  {geofences.map((gf) => (
                    <li key={gf.id} className="geofence-list-item">
                      <div className="geofence-info">
                        <strong>{gf.name}</strong>
                        <span className="geofence-type">
                          {gf.center_lat != null ? "Circle" : "Polygon"}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="cancel-btn"
                        onClick={() => handleDelete(gf.id)}
                        disabled={deleting === gf.id}
                      >
                        {deleting === gf.id ? "Deleting..." : "Delete"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="geofence-modal-actions">
                <button
                  type="button"
                  className="option-btn"
                  onClick={resetAndClose}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
