import pg from "pg";

function needsSsl(connectionString: string): boolean {
  return (
    connectionString.includes("sslmode=require") ||
    connectionString.includes("neon.tech") ||
    connectionString.includes("supabase.co") ||
    connectionString.includes("render.com")
  );
}

export function createPool(connectionString: string) {
  return new pg.Pool({
    connectionString,
    ...(needsSsl(connectionString) ? { ssl: { rejectUnauthorized: false } } : {}),
  });
}
