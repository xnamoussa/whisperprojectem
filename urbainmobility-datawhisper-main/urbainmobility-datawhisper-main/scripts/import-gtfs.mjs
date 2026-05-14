#!/usr/bin/env node
/**
 * Import GTFS IDFM réel dans Neo4j Aura.
 *
 * Usage local (depuis la racine du projet) :
 *   NEO4J_URI="neo4j+s://<dbid>.databases.neo4j.io" \
 *   NEO4J_USER="neo4j" \
 *   NEO4J_PASSWORD="..." \
 *   NEO4J_DATABASE="neo4j" \
 *   node scripts/import-gtfs.mjs
 *
 * Options par variables d'environnement :
 *   GTFS_URL     URL du zip GTFS (défaut : flux IDFM officiel)
 *   GTFS_ZIP     Chemin local d'un zip déjà téléchargé (évite le download)
 *   ROUTE_TYPES  Liste séparée par virgules (défaut : "1,2" — métro + RER/train)
 *   BATCH_SIZE   Taille des lots Cypher (défaut : 1000)
 *
 * Le script est idempotent : il MERGE les nœuds Station et les relations LINK.
 */
import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { createWriteStream } from "node:fs";
import AdmZip from "adm-zip";
import { parse } from "csv-parse";
import neo4j from "neo4j-driver";

const URI = process.env.NEO4J_URI;
const USER = process.env.NEO4J_USER ?? process.env.NEO4J_USERNAME;
const PASS = process.env.NEO4J_PASSWORD;
const DB = process.env.NEO4J_DATABASE ?? "neo4j";
const GTFS_URL =
  process.env.GTFS_URL ??
  "https://eu.ftp.opendatasoft.com/stif/GTFS/IDFM-gtfs.zip";
const ROUTE_TYPES = (process.env.ROUTE_TYPES ?? "1,2")
  .split(",")
  .map((s) => s.trim());
const BATCH = Number(process.env.BATCH_SIZE ?? 1000);

if (!URI || !USER || !PASS) {
  console.error("❌ NEO4J_URI / NEO4J_USER / NEO4J_PASSWORD requis.");
  process.exit(1);
}

const CACHE_DIR = path.resolve("gtfs-cache");
fs.mkdirSync(CACHE_DIR, { recursive: true });
const ZIP_PATH = process.env.GTFS_ZIP ?? path.join(CACHE_DIR, "IDFM-gtfs.zip");

// ────────────────────────────────────────────────────────────── helpers

function download(url, dest) {
  return new Promise((resolve, reject) => {
    console.log(`⬇️  Téléchargement ${url}`);
    const file = createWriteStream(dest);
    const get = (u) =>
      https
        .get(u, (res) => {
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            res.resume();
            return get(res.headers.location);
          }
          if (res.statusCode !== 200) {
            return reject(new Error(`HTTP ${res.statusCode} sur ${u}`));
          }
          const total = Number(res.headers["content-length"] ?? 0);
          let received = 0;
          res.on("data", (chunk) => {
            received += chunk.length;
            if (total) process.stdout.write(`\r   ${(received / 1e6).toFixed(1)} / ${(total / 1e6).toFixed(1)} MB`);
          });
          res.pipe(file);
          file.on("finish", () => {
            file.close();
            process.stdout.write("\n");
            resolve();
          });
        })
        .on("error", reject);
    get(url);
  });
}

function readCsv(buffer) {
  return new Promise((resolve, reject) => {
    const out = [];
    parse(buffer, { columns: true, skip_empty_lines: true, trim: true })
      .on("data", (r) => out.push(r))
      .on("end", () => resolve(out))
      .on("error", reject);
  });
}

function gtfsTimeToSeconds(t) {
  if (!t) return null;
  const [h, m, s] = t.split(":").map(Number);
  return h * 3600 + m * 60 + (s || 0);
}

// ────────────────────────────────────────────────────────────── pipeline

async function main() {
  if (!fs.existsSync(ZIP_PATH)) {
    await download(GTFS_URL, ZIP_PATH);
  } else {
    console.log(`📦 Zip déjà présent : ${ZIP_PATH}`);
  }

  console.log("📂 Extraction…");
  const zip = new AdmZip(ZIP_PATH);
  const get = (name) => {
    const e = zip.getEntry(name);
    if (!e) throw new Error(`Entrée manquante: ${name}`);
    return e.getData();
  };

  console.log("📑 Parse routes / trips / stops / stop_times…");
  const [routes, trips, stops, stopTimes] = await Promise.all([
    readCsv(get("routes.txt")),
    readCsv(get("trips.txt")),
    readCsv(get("stops.txt")),
    readCsv(get("stop_times.txt")),
  ]);

  console.log(`   routes=${routes.length} trips=${trips.length} stops=${stops.length} stop_times=${stopTimes.length}`);

  // 1. Routes filtrées (métro + RER)
  const keptRoutes = new Map();
  for (const r of routes) {
    if (ROUTE_TYPES.includes(String(r.route_type))) {
      keptRoutes.set(r.route_id, {
        id: r.route_id,
        short: r.route_short_name || r.route_id,
        long: r.route_long_name || "",
        type: r.route_type,
        color: r.route_color || null,
      });
    }
  }
  console.log(`   routes retenues = ${keptRoutes.size}`);

  // 2. Trips → route_id (pour les routes retenues)
  const tripRoute = new Map();
  for (const t of trips) {
    if (keptRoutes.has(t.route_id)) tripRoute.set(t.trip_id, t.route_id);
  }

  // 3. stop_times groupés par trip
  const byTrip = new Map();
  for (const st of stopTimes) {
    if (!tripRoute.has(st.trip_id)) continue;
    if (!byTrip.has(st.trip_id)) byTrip.set(st.trip_id, []);
    byTrip.get(st.trip_id).push(st);
  }

  // 4. Edges (from, to, route) avec moyenne de durée
  /** @type {Map<string, {from:string,to:string,route:string,sum:number,count:number}>} */
  const edges = new Map();
  const usedStopIds = new Set();
  for (const [tripId, list] of byTrip) {
    list.sort((a, b) => Number(a.stop_sequence) - Number(b.stop_sequence));
    const routeId = tripRoute.get(tripId);
    for (let i = 0; i < list.length - 1; i++) {
      const a = list[i];
      const b = list[i + 1];
      const ta = gtfsTimeToSeconds(a.departure_time || a.arrival_time);
      const tb = gtfsTimeToSeconds(b.arrival_time || b.departure_time);
      if (ta == null || tb == null || tb <= ta) continue;
      const key = `${a.stop_id}|${b.stop_id}|${routeId}`;
      const cur = edges.get(key);
      const dur = tb - ta;
      if (cur) { cur.sum += dur; cur.count++; }
      else edges.set(key, { from: a.stop_id, to: b.stop_id, route: routeId, sum: dur, count: 1 });
      usedStopIds.add(a.stop_id);
      usedStopIds.add(b.stop_id);
    }
  }
  console.log(`   arêtes uniques = ${edges.size}, stops utilisés = ${usedStopIds.size}`);

  // 5. Stops utilisés (résolution parent_station si présent → garder le parent)
  const stopById = new Map(stops.map((s) => [s.stop_id, s]));
  function resolveParent(id) {
    const s = stopById.get(id);
    if (!s) return null;
    if (s.parent_station && stopById.has(s.parent_station)) return s.parent_station;
    return id;
  }

  // Re-mappe edges vers stations parentes pour réduire la cardinalité
  const stationEdges = new Map();
  const stationIds = new Set();
  for (const e of edges.values()) {
    const f = resolveParent(e.from);
    const t = resolveParent(e.to);
    if (!f || !t || f === t) continue;
    stationIds.add(f);
    stationIds.add(t);
    const key = `${f}|${t}|${e.route}`;
    const cur = stationEdges.get(key);
    if (cur) { cur.sum += e.sum; cur.count += e.count; }
    else stationEdges.set(key, { from: f, to: t, route: e.route, sum: e.sum, count: e.count });
  }
  console.log(`   stations finales = ${stationIds.size}, arêtes finales = ${stationEdges.size}`);

  const stationRows = [...stationIds].map((id) => {
    const s = stopById.get(id);
    return {
      id,
      name: s?.stop_name ?? id,
      lat: s?.stop_lat ? Number(s.stop_lat) : null,
      lon: s?.stop_lon ? Number(s.stop_lon) : null,
    };
  });

  const routeRows = [...keptRoutes.values()];

  const linkRows = [...stationEdges.values()].map((e) => ({
    from: e.from,
    to: e.to,
    route: e.route,
    temps_moyen: Math.round(e.sum / e.count),
    samples: e.count,
  }));

  // ──────────────────────────────────────────────── Neo4j push
  const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASS), {
    maxConnectionPoolSize: 20,
  });
  await driver.verifyConnectivity();
  console.log("🔌 Connecté à Neo4j Aura");

  const session = driver.session({ database: DB });
  try {
    console.log("🧱 Contraintes & index…");
    await session.run("CREATE CONSTRAINT station_id IF NOT EXISTS FOR (s:Station) REQUIRE s.id IS UNIQUE");
    await session.run("CREATE CONSTRAINT route_id IF NOT EXISTS FOR (r:Route) REQUIRE r.id IS UNIQUE");
    await session.run("CREATE INDEX station_name IF NOT EXISTS FOR (s:Station) ON (s.name)");

    await batched(session, routeRows, BATCH, `
      UNWIND $rows AS row
      MERGE (r:Route {id: row.id})
      SET r.short = row.short, r.long = row.long, r.type = row.type, r.color = row.color
    `, "routes");

    await batched(session, stationRows, BATCH, `
      UNWIND $rows AS row
      MERGE (s:Station {id: row.id})
      SET s.name = row.name, s.lat = row.lat, s.lon = row.lon
    `, "stations");

    await batched(session, linkRows, BATCH, `
      UNWIND $rows AS row
      MATCH (a:Station {id: row.from})
      MATCH (b:Station {id: row.to})
      MERGE (a)-[l:LINK {route: row.route}]->(b)
      SET l.temps_moyen = row.temps_moyen, l.samples = row.samples
    `, "links");

    const stats = await session.run(`
      MATCH (s:Station) WITH count(s) AS stations
      MATCH ()-[l:LINK]->() RETURN stations, count(l) AS links
    `);
    const row = stats.records[0];
    console.log(`✅ Import terminé — Station: ${row.get("stations")}, LINK: ${row.get("links")}`);
  } finally {
    await session.close();
    await driver.close();
  }
}

async function batched(session, rows, size, cypher, label) {
  for (let i = 0; i < rows.length; i += size) {
    const slice = rows.slice(i, i + size);
    await session.run(cypher, { rows: slice });
    process.stdout.write(`\r   ${label}: ${Math.min(i + size, rows.length)} / ${rows.length}`);
  }
  process.stdout.write("\n");
}

main().catch((e) => {
  console.error("\n❌", e);
  process.exit(1);
});
