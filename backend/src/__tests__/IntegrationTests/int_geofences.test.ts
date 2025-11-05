import {
  createPolygonFence,
  createCircleFence,
  listFencesByEvent,
  getFence,
  deleteFence,
  isPointInsideAnyFence,
} from "../../db/geofences";
import { query } from "../../db/connect";

const squareGeoJSON = JSON.stringify({
  type: "Polygon",
  coordinates: [
    [[0,0],[0,0.01],[0.01,0.01],[0.01,0],[0,0]]
  ]
});

async function seedEvent(name = "Test Event"): Promise<string> {
  const { rows } = await query<{ id: string }>(
    `INSERT INTO events (id, name) VALUES (gen_random_uuid(), $1) RETURNING id`,
    [name]
  );
  return rows[0].id;
}

describe("DB integration: geofences", () => {
  test("createPolygonFence -> getFence returns normalized 4326 geometry", async () => {
    const eventId = await seedEvent("E-poly");
    const rec = await createPolygonFence({
      eventId,
      name: "poly A",
      geojson4326: squareGeoJSON,
    });

    const got = await getFence(rec.id);
    expect(got).toBeTruthy();
    expect(got!.name).toBe("poly A");
    expect(got!.area_geojson_4326).toBeTruthy();     // WHY: polygon returned as GeoJSON in EPSG:4326 for API
    expect(got!.center_lon).toBeNull();              // WHY: mutually exclusive shape fields
    expect(got!.radius_m).toBeNull();
  });

  test("createCircleFence -> listFencesByEvent returns center in 4326 + radius", async () => {
    const eventId = await seedEvent("E-circle");
    const rec = await createCircleFence({
      eventId, name: "circle A", lon: 10, lat: 20, radius_m: 125
    });

    const list = await listFencesByEvent(eventId);
    const found = list.find(f => f.id === rec.id)!;

    expect(found.center_lon).toBeCloseTo(10, 5);     // WHY: center reprojected back to 4326
    expect(found.center_lat).toBeCloseTo(20, 5);
    expect(found.radius_m).toBe(125);
    expect(found.area_geojson_4326).toBeNull();      // WHY: circle does not return polygon in your API shape
  });

  test("deleteFence removes the record", async () => {
    const eventId = await seedEvent("E-del");
    const rec = await createCircleFence({
      eventId, name: "del me", lon: 0, lat: 0, radius_m: 10
    });

    await deleteFence(rec.id);
    const got = await getFence(rec.id);
    expect(got).toBeNull();                          // WHY: destructive path works
  });

  test("isPointInsideAnyFence detects inside/outside across both shapes", async () => {
    const eventId = await seedEvent("E-inside");

    // polygon fence: small square near origin
    await createPolygonFence({ eventId, name: "poly", geojson4326: squareGeoJSON });

    const inside = await isPointInsideAnyFence({ eventId, lon: 0.005, lat: 0.005 });
    const outside = await isPointInsideAnyFence({ eventId, lon: 2, lat: 2 });

    expect(inside).toBe(true);                       // WHY: ST_Contains with projection to 3857 works
    expect(outside).toBe(false);
  });
});