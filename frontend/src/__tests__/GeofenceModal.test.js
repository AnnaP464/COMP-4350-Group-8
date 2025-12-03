import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import GeofenceModal from "../components/GeofenceModal";

// Mock GeofenceMap component
jest.mock("../components/GeofenceMap", () => ({
  __esModule: true,
  default: ({ value, onChange }) => (
    <div data-testid="mock-geofence-map">
      <button
        data-testid="draw-polygon"
        onClick={() =>
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
          })
        }
      >
        Draw Polygon
      </button>
      <button
        data-testid="draw-circle"
        onClick={() =>
          onChange({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [-97.14, 49.89],
            },
            properties: { _pmType: "Circle", radius: 100 },
          })
        }
      >
        Draw Circle
      </button>
    </div>
  ),
}));

// Mock EventService
const mockFetchGeofences = jest.fn();
const mockDeleteGeofence = jest.fn();
const mockCreatePolygonGeofence = jest.fn();
const mockCreateCircleGeofence = jest.fn();

jest.mock("../services/EventService", () => ({
  __esModule: true,
  fetchGeofences: (...args) => mockFetchGeofences(...args),
  deleteGeofence: (...args) => mockDeleteGeofence(...args),
  createPolygonGeofence: (...args) => mockCreatePolygonGeofence(...args),
  createCircleGeofence: (...args) => mockCreateCircleGeofence(...args),
}));

describe("GeofenceModal", () => {
  const mockOnClose = jest.fn();
  const mockOnGeofencesChanged = jest.fn();
  const eventId = "test-event-123";

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(window, "alert").mockImplementation(() => {});
    jest.spyOn(window, "confirm").mockImplementation(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("when closed", () => {
    test("renders nothing when isOpen is false", () => {
      const { container } = render(
        <GeofenceModal
          eventId={eventId}
          mode="add"
          isOpen={false}
          onClose={mockOnClose}
          onGeofencesChanged={mockOnGeofencesChanged}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe("Add mode", () => {
    test("renders add geofence form when mode is add", () => {
      render(
        <GeofenceModal
          eventId={eventId}
          mode="add"
          isOpen={true}
          onClose={mockOnClose}
          onGeofencesChanged={mockOnGeofencesChanged}
        />
      );

      expect(screen.getByText("Add Geofence")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/Geofence name/i)
      ).toBeInTheDocument();
      expect(screen.getByTestId("mock-geofence-map")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Save Geofence/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Cancel/i })
      ).toBeInTheDocument();
    });

    test("shows alert when submitting without name", async () => {
      render(
        <GeofenceModal
          eventId={eventId}
          mode="add"
          isOpen={true}
          onClose={mockOnClose}
          onGeofencesChanged={mockOnGeofencesChanged}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: /Save Geofence/i }));

      expect(window.alert).toHaveBeenCalledWith(
        "Please provide a name for the geofence."
      );
    });

    test("shows alert when submitting without drawing shape", async () => {
      render(
        <GeofenceModal
          eventId={eventId}
          mode="add"
          isOpen={true}
          onClose={mockOnClose}
          onGeofencesChanged={mockOnGeofencesChanged}
        />
      );

      fireEvent.change(screen.getByPlaceholderText(/Geofence name/i), {
        target: { value: "Test Geofence" },
      });

      fireEvent.click(screen.getByRole("button", { name: /Save Geofence/i }));

      expect(window.alert).toHaveBeenCalledWith(
        "Please draw a geofence on the map."
      );
    });

    test("creates polygon geofence successfully", async () => {
      mockCreatePolygonGeofence.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "new-geofence-id" }),
      });

      render(
        <GeofenceModal
          eventId={eventId}
          mode="add"
          isOpen={true}
          onClose={mockOnClose}
          onGeofencesChanged={mockOnGeofencesChanged}
        />
      );

      // Enter name
      fireEvent.change(screen.getByPlaceholderText(/Geofence name/i), {
        target: { value: "Test Polygon" },
      });

      // Draw polygon using mock
      fireEvent.click(screen.getByTestId("draw-polygon"));

      // Submit
      fireEvent.click(screen.getByRole("button", { name: /Save Geofence/i }));

      await waitFor(() => {
        expect(mockCreatePolygonGeofence).toHaveBeenCalledWith(
          eventId,
          "Test Polygon",
          expect.objectContaining({ type: "Polygon" })
        );
      });

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          "Geofence saved successfully!"
        );
      });

      expect(mockOnGeofencesChanged).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    test("creates circle geofence successfully", async () => {
      mockCreateCircleGeofence.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "new-circle-id" }),
      });

      render(
        <GeofenceModal
          eventId={eventId}
          mode="add"
          isOpen={true}
          onClose={mockOnClose}
          onGeofencesChanged={mockOnGeofencesChanged}
        />
      );

      // Enter name
      fireEvent.change(screen.getByPlaceholderText(/Geofence name/i), {
        target: { value: "Test Circle" },
      });

      // Draw circle using mock
      fireEvent.click(screen.getByTestId("draw-circle"));

      // Submit
      fireEvent.click(screen.getByRole("button", { name: /Save Geofence/i }));

      await waitFor(() => {
        expect(mockCreateCircleGeofence).toHaveBeenCalledWith(
          eventId,
          "Test Circle",
          49.89, // lat
          -97.14, // lon
          100 // radius
        );
      });

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          "Geofence saved successfully!"
        );
      });
    });

    test("handles create geofence failure", async () => {
      mockCreatePolygonGeofence.mockResolvedValueOnce({
        ok: false,
        text: async () => "Server error",
      });

      render(
        <GeofenceModal
          eventId={eventId}
          mode="add"
          isOpen={true}
          onClose={mockOnClose}
          onGeofencesChanged={mockOnGeofencesChanged}
        />
      );

      fireEvent.change(screen.getByPlaceholderText(/Geofence name/i), {
        target: { value: "Test Geofence" },
      });
      fireEvent.click(screen.getByTestId("draw-polygon"));
      fireEvent.click(screen.getByRole("button", { name: /Save Geofence/i }));

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith("Server error");
      });

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    test("closes modal when cancel is clicked", () => {
      render(
        <GeofenceModal
          eventId={eventId}
          mode="add"
          isOpen={true}
          onClose={mockOnClose}
          onGeofencesChanged={mockOnGeofencesChanged}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));

      expect(mockOnClose).toHaveBeenCalled();
    });

    test("closes modal when clicking overlay", () => {
      render(
        <GeofenceModal
          eventId={eventId}
          mode="add"
          isOpen={true}
          onClose={mockOnClose}
          onGeofencesChanged={mockOnGeofencesChanged}
        />
      );

      fireEvent.click(screen.getByRole("dialog"));

      expect(mockOnClose).toHaveBeenCalled();
    });

    test("closes modal when clicking X button", () => {
      render(
        <GeofenceModal
          eventId={eventId}
          mode="add"
          isOpen={true}
          onClose={mockOnClose}
          onGeofencesChanged={mockOnGeofencesChanged}
        />
      );

      fireEvent.click(screen.getByLabelText("Close"));

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("Edit mode", () => {
    test("renders edit view and fetches geofences", async () => {
      mockFetchGeofences.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: "gf1", name: "Entrance", center_lat: null },
          { id: "gf2", name: "Parking", center_lat: 49.89 },
        ],
      });

      render(
        <GeofenceModal
          eventId={eventId}
          mode="edit"
          isOpen={true}
          onClose={mockOnClose}
          onGeofencesChanged={mockOnGeofencesChanged}
        />
      );

      expect(screen.getByText("Edit Geofences")).toBeInTheDocument();

      await waitFor(() => {
        expect(mockFetchGeofences).toHaveBeenCalledWith(eventId);
      });

      await waitFor(() => {
        expect(screen.getByText("Entrance")).toBeInTheDocument();
        expect(screen.getByText("Parking")).toBeInTheDocument();
      });

      // Check type labels
      expect(screen.getByText("Polygon")).toBeInTheDocument();
      expect(screen.getByText("Circle")).toBeInTheDocument();
    });

    test("shows empty message when no geofences", async () => {
      mockFetchGeofences.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(
        <GeofenceModal
          eventId={eventId}
          mode="edit"
          isOpen={true}
          onClose={mockOnClose}
          onGeofencesChanged={mockOnGeofencesChanged}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText("No geofences defined for this event.")
        ).toBeInTheDocument();
      });
    });

    test("deletes geofence when delete button clicked", async () => {
      mockFetchGeofences.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: "gf1", name: "Test Fence", center_lat: null }],
      });

      mockDeleteGeofence.mockResolvedValueOnce({ ok: true });

      render(
        <GeofenceModal
          eventId={eventId}
          mode="edit"
          isOpen={true}
          onClose={mockOnClose}
          onGeofencesChanged={mockOnGeofencesChanged}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Test Fence")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /Delete/i }));

      await waitFor(() => {
        expect(mockDeleteGeofence).toHaveBeenCalledWith("gf1");
      });

      expect(mockOnGeofencesChanged).toHaveBeenCalled();
    });

    test("handles delete failure", async () => {
      mockFetchGeofences.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: "gf1", name: "Test Fence", center_lat: null }],
      });

      mockDeleteGeofence.mockResolvedValueOnce({
        ok: false,
        text: async () => "Delete failed",
      });

      render(
        <GeofenceModal
          eventId={eventId}
          mode="edit"
          isOpen={true}
          onClose={mockOnClose}
          onGeofencesChanged={mockOnGeofencesChanged}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Test Fence")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /Delete/i }));

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith("Delete failed");
      });
    });

    test("does not delete when confirm is cancelled", async () => {
      window.confirm.mockReturnValueOnce(false);

      mockFetchGeofences.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: "gf1", name: "Test Fence", center_lat: null }],
      });

      render(
        <GeofenceModal
          eventId={eventId}
          mode="edit"
          isOpen={true}
          onClose={mockOnClose}
          onGeofencesChanged={mockOnGeofencesChanged}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Test Fence")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /Delete/i }));

      expect(mockDeleteGeofence).not.toHaveBeenCalled();
    });
  });

  describe("Delete mode", () => {
    test("renders delete view and fetches geofences", async () => {
      mockFetchGeofences.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: "gf1", name: "To Delete", center_lat: null }],
      });

      render(
        <GeofenceModal
          eventId={eventId}
          mode="delete"
          isOpen={true}
          onClose={mockOnClose}
          onGeofencesChanged={mockOnGeofencesChanged}
        />
      );

      expect(screen.getByText("Delete Geofences")).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText("To Delete")).toBeInTheDocument();
      });

      expect(
        screen.getByRole("button", { name: /Done/i })
      ).toBeInTheDocument();
    });

    test("shows empty message when no geofences to delete", async () => {
      mockFetchGeofences.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(
        <GeofenceModal
          eventId={eventId}
          mode="delete"
          isOpen={true}
          onClose={mockOnClose}
          onGeofencesChanged={mockOnGeofencesChanged}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("No geofences to delete.")).toBeInTheDocument();
      });
    });
  });

  describe("Network errors", () => {
    test("handles fetch geofences network error", async () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockFetchGeofences.mockRejectedValueOnce(new Error("Network error"));

      render(
        <GeofenceModal
          eventId={eventId}
          mode="edit"
          isOpen={true}
          onClose={mockOnClose}
          onGeofencesChanged={mockOnGeofencesChanged}
        />
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Failed to load geofences:",
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    test("handles create geofence network error", async () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockCreatePolygonGeofence.mockRejectedValueOnce(
        new Error("Network error")
      );

      render(
        <GeofenceModal
          eventId={eventId}
          mode="add"
          isOpen={true}
          onClose={mockOnClose}
          onGeofencesChanged={mockOnGeofencesChanged}
        />
      );

      fireEvent.change(screen.getByPlaceholderText(/Geofence name/i), {
        target: { value: "Test" },
      });
      fireEvent.click(screen.getByTestId("draw-polygon"));
      fireEvent.click(screen.getByRole("button", { name: /Save Geofence/i }));

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          "Failed to create geofence."
        );
      });

      consoleSpy.mockRestore();
    });

    test("handles delete geofence network error", async () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockFetchGeofences.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: "gf1", name: "Test", center_lat: null }],
      });

      mockDeleteGeofence.mockRejectedValueOnce(new Error("Network error"));

      render(
        <GeofenceModal
          eventId={eventId}
          mode="edit"
          isOpen={true}
          onClose={mockOnClose}
          onGeofencesChanged={mockOnGeofencesChanged}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Test")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /Delete/i }));

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          "Failed to delete geofence."
        );
      });

      consoleSpy.mockRestore();
    });
  });
});
