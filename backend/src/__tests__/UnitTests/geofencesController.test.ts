// tests/controllers/geofencesController.test.ts
import { makeGeofencesController } from "../../controllers/geofenceController";

function mockRes() {
  const res: any = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.send = jest.fn(() => res);
  return res;
}

describe("GeofencesController", () => {
  const service = {
    createPolygon: jest.fn(),
    createCircle: jest.fn(),
    listByEvent: jest.fn(),
    getById: jest.fn(),
    remove: jest.fn(),
  };

  const ctrl = makeGeofencesController({ service: service as any });

  beforeEach(() => jest.clearAllMocks());

  test("createPolygon: passes payload and returns 201 + body", async () => {
    const req: any = {
      params: { eventId: "evt-1" },
      body: { name: "A", geojson4326: { type: "Polygon", coordinates: [] } },
    };
    const res = mockRes();

    service.createPolygon.mockResolvedValue({ id: "uuid-1" });

    await ctrl.createPolygon(req, res);

    expect(service.createPolygon).toHaveBeenCalledWith({
      eventId: "evt-1",
      name: "A",
      geojson4326: '{"type":"Polygon","coordinates":[]}',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: "uuid-1" });
  });
  // WHY: Controller receives object from frontend and stringifies before passing to service.

  test("createCircle: forwards payload and returns 201", async () => {
    const req: any = {
      params: { eventId: "evt-1" },
      body: { name: "C", lon: 1, lat: 2, radius_m: 30 },
    };
    const res = mockRes();
    service.createCircle.mockResolvedValue({ id: "uuid-c" });

    await ctrl.createCircle(req, res);

    expect(service.createCircle).toHaveBeenCalledWith({
      eventId: "evt-1",
      name: "C",
      lon: 1,
      lat: 2,
      radius_m: 30,
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: "uuid-c" });
  });
  // WHY: Happy path + 201 status for circle.

  test("listByEvent: returns 200 with array", async () => {
    const req: any = { params: { eventId: "evt-1" } };
    const res = mockRes();
    service.listByEvent.mockResolvedValue([{ id: "g1" }]);

    await ctrl.listByEvent(req, res);

    expect(service.listByEvent).toHaveBeenCalledWith("evt-1");
    expect(res.json).toHaveBeenCalledWith([{ id: "g1" }]);
  });
  // WHY: Verify scoping by eventId and JSON body.

  test("getById: 404 when not found; 200 otherwise", async () => {
    const res = mockRes();

    // 404 branch
    service.getById.mockResolvedValueOnce(null);
    await ctrl.getById({ params: { id: "x" } } as any, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Not Found" });

    // 200 branch
    const res2 = mockRes();
    service.getById.mockResolvedValueOnce({ id: "x" });
    await ctrl.getById({ params: { id: "x" } } as any, res2);
    expect(res2.json).toHaveBeenCalledWith({ id: "x" });
  });
  // WHY: Cover both branches so contract is clear.

  test("remove: returns 204", async () => {
    const req: any = { params: { id: "x" } };
    const res = mockRes();

    await ctrl.remove(req, res);

    expect(service.remove).toHaveBeenCalledWith("x");
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });
  // WHY: Verify correct status code for deletion.
});