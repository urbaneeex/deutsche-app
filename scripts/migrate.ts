/**
 * Aplica los ficheros supabase/migrations/*.sql en orden contra la base de
 * datos de Supabase, usando una conexion Postgres directa (DATABASE_URL).
 * Uso: npm run db:migrate
 */
import { Client } from "pg";
import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve } from "path";

function loadDotEnvLocal() {
  const path = resolve(__dirname, "../.env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadDotEnvLocal();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error(
    "Falta DATABASE_URL en .env.local (cadena de conexion Postgres directa de Supabase)."
  );
  process.exit(1);
}

async function main() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  await client.query(`
    create table if not exists _migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    );
  `);

  // Bootstrap: si la base de datos ya tenia el esquema de 0001_init.sql
  // aplicado a mano (antes de que existiera esta tabla de control), lo
  // marcamos como aplicado para no volver a ejecutarlo y romper por
  // objetos duplicados (policies, etc).
  const { rows: migrationsCount } = await client.query<{ count: string }>(
    "select count(*)::text as count from _migrations"
  );
  if (migrationsCount[0].count === "0") {
    const { rows: existingTables } = await client.query<{ exists: boolean }>(
      "select exists (select from information_schema.tables where table_schema = 'public' and table_name = 'decks') as exists"
    );
    if (existingTables[0].exists) {
      await client.query(
        "insert into _migrations (filename) values ($1) on conflict do nothing",
        ["0001_init.sql"]
      );
      console.log(
        "-> Detectado esquema previo: 0001_init.sql marcada como ya aplicada."
      );
    }
  }

  const dir = resolve(__dirname, "../supabase/migrations");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

  const { rows } = await client.query<{ filename: string }>(
    "select filename from _migrations"
  );
  const applied = new Set(rows.map((r) => r.filename));

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`-> ${file} ya aplicada, se omite.`);
      continue;
    }
    console.log(`-> Aplicando ${file}...`);
    const sql = readFileSync(resolve(dir, file), "utf-8");
    await client.query("begin");
    try {
      await client.query(sql);
      await client.query("insert into _migrations (filename) values ($1)", [
        file,
      ]);
      await client.query("commit");
    } catch (err) {
      await client.query("rollback");
      throw err;
    }
  }

  console.log("Migraciones aplicadas correctamente.");
  await client.end();
}

main().catch((err) => {
  console.error("Error aplicando migraciones:", err);
  process.exit(1);
});
