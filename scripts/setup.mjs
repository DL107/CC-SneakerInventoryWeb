/**
 * One-command local setup: `npm run setup`
 *
 * Creates .env (with a fresh random SESSION_SECRET) if missing, creates the
 * SQLite database from the committed migrations, generates the Prisma client,
 * and loads the demo seed data. Safe to re-run at any time.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";

function run(label, command, args) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) {
    console.error(`\n✖ Step failed: ${label}`);
    process.exit(result.status ?? 1);
  }
}

// 1. Environment file
if (!existsSync(".env")) {
  const template = readFileSync(".env.example", "utf8");
  const secret = randomBytes(32).toString("hex");
  const env = template.replace(/^SESSION_SECRET=.*$/m, `SESSION_SECRET="${secret}"`);
  writeFileSync(".env", env);
  console.log("▶ Created .env with a fresh random SESSION_SECRET");
} else {
  console.log("▶ .env already exists — leaving it untouched");
}

// 2. Database schema (applies committed migrations; creates prisma/dev.db if missing)
run("Applying database migrations", "npx", ["prisma", "migrate", "deploy"]);

// 3. Prisma client
run("Generating Prisma client", "npx", ["prisma", "generate"]);

// 4. Demo data
run("Seeding demo sneakers", "npx", ["tsx", "prisma/seed.ts"]);

console.log(`
✔ Setup complete.

  Start the app:   npm run dev
  Then open:       http://localhost:3000
  Demo login:      demo@sneakershelf.app / Password123!
`);
