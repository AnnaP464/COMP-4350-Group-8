import { execSync } from "child_process";
import { query } from "../../db/connect";

beforeAll(async () => {
  console.log("Resetting test database:", process.env.DATABASE_URL);
  // Drop + recreate schema for a clean slate
    execSync(
    `psql "${process.env.DATABASE_URL}" -c 'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;'`,
    { stdio: "inherit" }
  );
  // 2) apply migrations
  execSync(`psql "${process.env.DATABASE_URL}" -f "migrations/002_init.sql"`, {
    stdio: "inherit",
  });
});
