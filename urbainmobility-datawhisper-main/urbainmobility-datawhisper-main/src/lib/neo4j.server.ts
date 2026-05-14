// Helper Neo4j côté serveur uniquement.
import neo4j, { Driver } from "neo4j-driver";

let driver: Driver | null = null;

export function getDriver(): Driver | null {
  const uri = process.env.NEO4J_URI;
  const user = process.env.NEO4J_USER;
  const password = process.env.NEO4J_PASSWORD;
  if (!uri || !user || !password) return null;
  if (!driver) {
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
      maxConnectionPoolSize: 10,
      connectionAcquisitionTimeout: 5000,
    });
  }
  return driver;
}

export async function isConnected(): Promise<boolean> {
  const d = getDriver();
  if (!d) return false;
  try {
    await d.verifyConnectivity();
    return true;
  } catch {
    return false;
  }
}
