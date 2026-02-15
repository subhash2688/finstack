import { createClient, Client } from "@libsql/client";

let client: Client | null = null;

/**
 * Get the Turso database client singleton.
 * Connects via HTTP — works on Vercel without filesystem access.
 */
export function getDbClient(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) {
      throw new Error("TURSO_DATABASE_URL environment variable is not set");
    }
    client = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}
