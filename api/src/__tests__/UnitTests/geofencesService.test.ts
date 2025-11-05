// tests/services/geofencesService.test.ts
console.log('[geofencesService.test] typeof test:', typeof test, 'typeof describe:', typeof describe);
import { makeGeofencesService } from "../../services/geofencesService";
import { GeofencesRepo } from "../../contracts/geofences.contracts";
import { GeofenceView } from "../../contracts/domain.types";

const polygonGeoJSON = JSON.stringify({
  type: "Polygon",
  coordinates: [
    [[0,0],[0,1],[1,1],[1,0],[0,0]]
  ]
});

describe("GeofencesService", () => {
  let repo: jest.Mocked<GeofencesRepo>;

  beforeEach(() => {
    repo = {
      createPolygonFence: jest.fn(),
      createCircleFence: jest.fn(),
      listFencesByEvent: jest.fn(),
      getFence: jest.fn(),
      deleteFence: jest.fn(),
    } as any;
  });

  test("createPolygon -> calls repo.createPolygonFence then fetches normalized view with repo.getFence", async () => {
    repo.createPolygonFence.mockResolvedValue({
      id: "uuid-poly-1",
      event_id: "evt-1",
      name: "Zone A",
      radius_m: null,
      created_at: new Date().toISOString(),
    });

    const expectedView: GeofenceView = {
      id: "uuid-poly-1",
      name: "Zone A",
      area_geojson_4326: JSON.parse(polygonGeoJSON),
      center_lon: null,
      center_lat: null,
      radius_m: null,
      created_at: new Date().toISOString(),
    };
    repo.getFence.mockResolvedValue(expectedView);

    const svc = makeGeofencesService({ repo });

    const view = await svc.createPolygon({
      eventId: "evt-1",
      name: "Zone A",
      geojson4326: polygonGeoJSON,
    });

    expect(repo.createPolygonFence).toHaveBeenCalledWith({
      eventId: "evt-1",
      name: "Zone A",
      geojson4326: polygonGeoJSON,
    });
    expect(repo.getFence).toHaveBeenCalledWith("uuid-poly-1");
    expect(view).toEqual(expectedView);
  });
  // WHY: Ensure the service enforces the “create then re-fetch normalized view” contract.

  test("createCircle -> calls repo.createCircleFence then repo.getFence", async () => {
    repo.createCircleFence.mockResolvedValue({
      id: "uuid-circ-1",
      event_id: "evt-1",
      name: "Circle A",
      radius_m: 50,
      created_at: new Date().toISOString(),
    });

    const expectedView: GeofenceView = {
      id: "uuid-circ-1",
      name: "Circle A",
      area_geojson_4326: null,
      center_lon: 10,
      center_lat: 20,
      radius_m: 50,
      created_at: new Date().toISOString(),
    };
    repo.getFence.mockResolvedValue(expectedView);

    const svc = makeGeofencesService({ repo });

    const view = await svc.createCircle({
      eventId: "evt-1",
      name: "Circle A",
      lon: 10,
      lat: 20,
      radius_m: 50,
    });

    expect(repo.createCircleFence).toHaveBeenCalledWith({
      eventId: "evt-1",
      name: "Circle A",
      lon: 10,
      lat: 20,
      radius_m: 50,
    });
    expect(repo.getFence).toHaveBeenCalledWith("uuid-circ-1");
    expect(view).toEqual(expectedView);
  });
  // WHY: Same “create then normalized fetch” behavior for circles.

  test("listByEvent -> delegates to repo", async () => {
    repo.listFencesByEvent.mockResolvedValue([{ id: "x" } as any]);
    const svc = makeGeofencesService({ repo });
    const out = await svc.listByEvent("evt-1");
    expect(repo.listFencesByEvent).toHaveBeenCalledWith("evt-1");
    expect(out).toEqual([{ id: "x" }]);
  });
  // WHY: Make sure service is a thin passthrough for list.

  test("getById -> delegates to repo", async () => {
    repo.getFence.mockResolvedValue({ id: "g1" } as any);
    const svc = makeGeofencesService({ repo });
    const out = await svc.getById("g1");
    expect(repo.getFence).toHaveBeenCalledWith("g1");
    expect(out).toEqual({ id: "g1" });
  });
  // WHY: Simple passthrough.

  test("remove -> calls repo.deleteFence", async () => {
    repo.deleteFence.mockResolvedValue();
    const svc = makeGeofencesService({ repo });
    await svc.remove("g1");
    expect(repo.deleteFence).toHaveBeenCalledWith("g1");
  });
  // WHY: Ensure destructive path hits the right repo method.
});