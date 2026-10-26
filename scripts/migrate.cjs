const Database = require("better-sqlite3");
const { createHash } = require("node:crypto");
const { join } = require("node:path");
const { readFileSync, readdirSync } = require("node:fs");

// Older deployments applied SQL manually, without a migration journal.
// Adopt existing tables/columns without replacing them or deleting their rows.
function migrate(databasePath, migrationsPath = join(__dirname, "..", "src", "db", "migrations")) {
  const sqlite = new Database(databasePath);
  try {
    sqlite.pragma("foreign_keys = ON");
    sqlite.pragma("busy_timeout = 5000");
    const files = readdirSync(migrationsPath).filter((name) => /^\d+.*\.sql$/.test(name)).sort();
    sqlite.transaction(() => {
      sqlite.exec(`CREATE TABLE IF NOT EXISTS app_migrations (
        name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TEXT NOT NULL
      )`);
      for (const file of files) {
        const content = readFileSync(join(migrationsPath, file), "utf8").replace(/\r\n/g, "\n");
        const checksum = createHash("sha256").update(content).digest("hex");
        const applied = sqlite.prepare("SELECT checksum FROM app_migrations WHERE name = ?").get(file);
        if (applied) {
          if (applied.checksum !== checksum) throw new Error(`Migración modificada después de aplicarse: ${file}`);
          continue;
        }
        for (const part of content.split(";")) {
          const statement = part.replace(/--[^\n]*/g, "").trim();
          if (!statement) continue;
          const column = statement.match(/^ALTER TABLE [`"]?(\w+)[`"]? ADD COLUMN [`"]?(\w+)[`"]?/i);
          if (column) {
            const columns = sqlite.prepare(`PRAGMA table_info("${column[1]}")`).all();
            if (columns.some((existing) => existing.name === column[2])) continue;
          }
          // Only CREATE TABLE/INDEX and ADD COLUMN are adopted. Other SQL errors
          // abort and roll back the entire batch instead of being ignored.
          const sql = statement.replace(/^CREATE TABLE (?!IF NOT EXISTS)/i, "CREATE TABLE IF NOT EXISTS ")
            .replace(/^CREATE (UNIQUE )?INDEX (?!IF NOT EXISTS)/i, "CREATE $1INDEX IF NOT EXISTS ");
          sqlite.exec(sql);
        }
        sqlite.prepare("INSERT INTO app_migrations VALUES (?, ?, ?)").run(file, checksum, new Date().toISOString());
        console.log(`Migración aplicada/verificada: ${file}`);
      }
    })();
  } finally {
    sqlite.close();
  }
}

if (require.main === module) {
  const databasePath = require("./database-path.cjs").databasePath();
  migrate(databasePath);
  console.log("Migraciones completadas.");
}

module.exports = { migrate };
