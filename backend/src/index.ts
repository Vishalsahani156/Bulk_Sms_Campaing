import "dotenv/config";
import { buildApp } from "./app.js";
import { getEnv } from "./config/env.js";

async function main() {
  const env = getEnv();
  const app = await buildApp();
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
  console.log(`Pulse SMS API listening on ${env.API_BASE_URL}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
