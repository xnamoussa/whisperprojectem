# Import GTFS IDFM → Neo4j Aura

Ce script charge le **flux GTFS officiel d'Île-de-France Mobilités** dans votre instance Neo4j Aura.

## Pourquoi un script local ?

Le runtime Cloudflare Workers (utilisé par Lovable Cloud) ne supporte pas les connexions
TCP/Bolt longue durée nécessaires à un import massif (~150 MB, des centaines de milliers
de stop_times). Le script tourne donc sur **votre machine** et pousse les données vers Aura
via le driver officiel `neo4j-driver`.

Une fois les données chargées, l'application interroge Aura à l'exécution via la
**Query API HTTP** (`src/lib/neo4j-http.server.ts`), 100 % compatible Worker.

## Lancer l'import

```bash
NEO4J_URI="neo4j+s://c36a57e7.databases.neo4j.io" \
NEO4J_USER="neo4j" \
NEO4J_PASSWORD="VOTRE_MOT_DE_PASSE" \
NEO4J_DATABASE="neo4j" \
node scripts/import-gtfs.mjs
```

Premier run : ~2-5 min selon le réseau (download + parse + push).
Le zip est mis en cache dans `gtfs-cache/` pour les runs suivants.

## Options

| Variable | Défaut | Rôle |
|---|---|---|
| `GTFS_URL` | flux IDFM officiel | URL du zip GTFS |
| `GTFS_ZIP` | — | Chemin local d'un zip déjà téléchargé |
| `ROUTE_TYPES` | `1,2` | Types GTFS retenus (1 = métro, 2 = train/RER, 0 = tram, 3 = bus) |
| `BATCH_SIZE` | `1000` | Taille des lots Cypher |

Pour inclure tram + bus : `ROUTE_TYPES="0,1,2,3"` (⚠️ multiplie les nœuds par ~10).

## Schéma créé dans Neo4j

```
(Station {id, name, lat, lon})
(Route   {id, short, long, type, color})
(Station)-[:LINK {route, temps_moyen, samples}]->(Station)
```

- `temps_moyen` = moyenne (en secondes) du temps observé entre deux arrêts consécutifs
  sur l'ensemble des trips → utilisable directement comme poids Dijkstra.
- `samples` = nombre d'observations agrégées (utile pour pondérer la fiabilité).

## Vérification

Dans Neo4j Browser (Aura console) :

```cypher
MATCH (s:Station) RETURN count(s);
MATCH ()-[l:LINK]->() RETURN count(l);
MATCH (a:Station {name:'Châtelet'})-[l:LINK]->(b)
RETURN a.name, l.route, l.temps_moyen, b.name LIMIT 10;
```
