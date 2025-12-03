import { query } from "../../src/db/connect";

beforeAll(async () => {
  console.log("✅ Connected to test database:", process.env.DATABASE_URL);
});

afterEach(async () => {
  console.log("🧹 Cleaning tables after test...");
  await query(`
    TRUNCATE TABLE
      users,
      refresh_tokens,
      events,
      event_geofences,
      event_attendance,
      registered_users
    RESTART IDENTITY CASCADE;
  `);
});