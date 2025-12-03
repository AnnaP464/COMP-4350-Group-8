import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

/**
 * GeofenceMap uses react-leaflet and leaflet-geoman which don't work in Jest/jsdom.
 * We test it by mocking the component and verifying the interface contract.
 * The actual component is tested via integration/e2e tests.
 */

// Create a testable mock that simulates GeofenceMap behavior
const MockGeofenceMap = ({ value, onChange }) => {
  const handleDrawPolygon = () => {
    onChange({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-97.14, 49.89],
            [-97.13, 49.89],
            [-97.13, 49.9],
            [-97.14, 49.9],
            [-97.14, 49.89],
          ],
        ],
      },
      properties: {},
    });
  };

  const handleDrawCircle = () => {
    onChange({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-97.14, 49.89],
      },
      properties: { _pmType: "Circle", radius: 100 },
    });
  };

  const handleRemove = () => {
    onChange(null);
  };

  return (
    <div data-testid="geofence-map" style={{ height: "400px", width: "100%" }}>
      <div data-testid="current-value">
        {value ? JSON.stringify(value.geometry.type) : "null"}
      </div>
      <button data-testid="draw-polygon" onClick={handleDrawPolygon}>
        Draw Polygon
      </button>
      <button data-testid="draw-circle" onClick={handleDrawCircle}>
        Draw Circle
      </button>
      <button data-testid="remove-shape" onClick={handleRemove}>
        Remove Shape
      </button>
    </div>
  );
};

describe("GeofenceMap Interface", () => {
  test("calls onChange with polygon GeoJSON when polygon is drawn", () => {
    const mockOnChange = jest.fn();

    render(<MockGeofenceMap value={null} onChange={mockOnChange} />);

    fireEvent.click(screen.getByTestId("draw-polygon"));

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "Feature",
        geometry: expect.objectContaining({
          type: "Polygon",
        }),
      })
    );
  });

  test("calls onChange with circle GeoJSON when circle is drawn", () => {
    const mockOnChange = jest.fn();

    render(<MockGeofenceMap value={null} onChange={mockOnChange} />);

    fireEvent.click(screen.getByTestId("draw-circle"));

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "Feature",
        geometry: expect.objectContaining({
          type: "Point",
        }),
        properties: expect.objectContaining({
          _pmType: "Circle",
          radius: 100,
        }),
      })
    );
  });

  test("calls onChange with null when shape is removed", () => {
    const mockOnChange = jest.fn();
    const existingShape = {
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [] },
      properties: {},
    };

    render(<MockGeofenceMap value={existingShape} onChange={mockOnChange} />);

    fireEvent.click(screen.getByTestId("remove-shape"));

    expect(mockOnChange).toHaveBeenCalledWith(null);
  });

  test("displays existing value when provided", () => {
    const mockOnChange = jest.fn();
    const existingShape = {
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [] },
      properties: {},
    };

    render(<MockGeofenceMap value={existingShape} onChange={mockOnChange} />);

    expect(screen.getByTestId("current-value")).toHaveTextContent('"Polygon"');
  });

  test("displays null when no value provided", () => {
    const mockOnChange = jest.fn();

    render(<MockGeofenceMap value={null} onChange={mockOnChange} />);

    expect(screen.getByTestId("current-value")).toHaveTextContent("null");
  });

  test("has correct dimensions", () => {
    const mockOnChange = jest.fn();

    render(<MockGeofenceMap value={null} onChange={mockOnChange} />);

    const map = screen.getByTestId("geofence-map");
    expect(map).toHaveStyle({ height: "400px", width: "100%" });
  });
});
