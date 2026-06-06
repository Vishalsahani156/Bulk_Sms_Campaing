import "dotenv/config";
import { buildApp } from "./app.js";
import { getEnv } from "./config/env.js";

async function main() {
  const env = getEnv();
  const app = await buildApp();
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
  console.log(`Pulse SMS API listening on ${env.API_BASE_URL}`);

  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down...`);
    await app.close();
    process.exit(0);
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
