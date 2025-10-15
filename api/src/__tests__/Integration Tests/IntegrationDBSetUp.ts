import { execSync } from "child_process";
import { query } from "../../db/connect";

beforeAll(async () => {
  // Drop + recreate schema for a clean slate
  execSync("psql $DATABASE_URL -f migrations/001_init.sql");
});

afterAll(async () => {
  await query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
});