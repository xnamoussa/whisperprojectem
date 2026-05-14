// Client HTTP pour Neo4j Aura — compatible Cloudflare Workers (pas de TCP/Bolt).
// Utilise la Query API v2 : POST https://<dbid>.databases.neo4j.io/db/<db>/query/v2

type QueryResult = {
  data: { fields: string[]; values: unknown[][] };
  errors?: { code: string; message: string }[];
};

function getConfig() {
  const uri = process.env.NEO4J_URI;
  const user = process.env.NEO4J_USER ?? process.env.NEO4J_USERNAME;
  const password = process.env.NEO4J_PASSWORD;
  const database = process.env.NEO4J_DATABASE ?? "neo4j";
  if (!uri || !user || !password) return null;
  // neo4j+s://abc.databases.neo4j.io  →  https://abc.databases.neo4j.io
  const httpHost = uri.replace(/^bolt\+s:\/\//, "https://").replace(/^neo4j\+s:\/\//, "https://").replace(/^bolt:\/\//, "http://").replace(/^neo4j:\/\//, "http://");
  return { httpHost, user, password, database };
}

export function neo4jConfigured(): boolean {
  return getConfig() !== null;
}

export async function cypher<T = Record<string, unknown>>(
  statement: string,
  parameters: Record<string, unknown> = {},
): Promise<T[]> {
  const cfg = getConfig();
  if (!cfg) throw new Error("Neo4j non configuré (NEO4J_URI/USER/PASSWORD manquants)");
  const url = `${cfg.httpHost}/db/${cfg.database}/query/v2`;
  const auth = btoa(`${cfg.user}:${cfg.password}`);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ statement, parameters }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Neo4j HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = (await res.json()) as QueryResult;
  if (json.errors?.length) {
    throw new Error(`Neo4j: ${json.errors.map((e) => e.message).join("; ")}`);
  }
  const fields = json.data?.fields ?? [];
  const values = json.data?.values ?? [];
  return values.map((row) => {
    const obj: Record<string, unknown> = {};
    fields.forEach((f, i) => (obj[f] = row[i]));
    return obj as T;
  });
}

export async function ping(): Promise<boolean> {
  try {
    await cypher("RETURN 1 AS ok");
    return true;
  } catch {
    return false;
  }
}
