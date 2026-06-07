import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";

const required = [
  "dist/config.json",
  "dist/functions/__server.func/index.mjs",
  "dist/client",
];

const missing = required.filter((path) => !existsSync(path));
if (missing.length > 0) {
  console.error("Vercel build output is incomplete. Missing:");
  for (const path of missing) console.error(`  - ${path}`);
  console.error(
    "\nFix: set Vercel Output Directory to 'dist' (not 'dist/client').",
  );
  process.exit(1);
}

const config = JSON.parse(readFileSync("dist/config.json", "utf8"));
if (config.version !== 3) {
  console.error(`Expected dist/config.json version 3, got ${config.version}`);
  process.exit(1);
}

const hasServerRoute = config.routes?.some(
  (route) => route.dest === "/__server" || route.dest?.endsWith("__server"),
);
if (!hasServerRoute) {
  console.error("dist/config.json is missing the SSR catch-all route to /__server");
  process.exit(1);
}

console.log("Vercel output verified: dist/client + dist/functions/__server.func + config.json");
