import { execSync } from "child_process";

beforeAll(async () => {
  const db = process.env.DATABASE_URL;
  console.log("Resetting test database:", process.env.DATABASE_URL);
  // Drop + recreate schema for a clean slate
    execSync(
    `psql "${db}" -c 'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;'`,
    { stdio: "inherit" }
  );
  // 2) apply migrations
  execSync(`for f in migrations/*.sql; do psql "${db}" -v ON_ERROR_STOP=1 -f "$f"; done`, {
    stdio: "inherit",
    shell: "/bin/bash",
  });
});
