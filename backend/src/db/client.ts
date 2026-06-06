import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema/index.js";
import { getEnv } from "../config/env.js";
import { createPool } from "./pool.js";

const pool = createPool(getEnv().DATABASE_URL);

export const db = drizzle(pool, { schema });
export type Database = typeof db;
