import request from "supertest";
import app from "../app";

describe("Auth routes", () => {
  it("should return 200 for GET /api.json", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);// assuming your swaggerSpec has a `swagger` field
  });

  it("should return 404 for unknown route", async () => {
    const res = await request(app).get("/unknown");
    expect(res.status).toBe(404);
  });
});