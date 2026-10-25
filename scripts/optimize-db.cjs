const Database = require("better-sqlite3");
const { join, resolve } = require("node:path");

// Reconciled from the VM. Use the application's database, never an implicit
// empty prod.db. Run manually after taking a backup.
const databasePath = resolve(process.env.DATABASE_PATH || join(__dirname, "..", "dev.db"));
const sqlite = new Database(databasePath, { fileMustExist: true });
try {
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("synchronous = NORMAL");
  sqlite.pragma("foreign_keys = ON");
  console.log("WAL habilitado; base de datos existente conservada.");
} finally {
  sqlite.close();
}
