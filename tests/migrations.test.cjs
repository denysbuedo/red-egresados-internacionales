const { test } = require("node:test");
const assert = require("node:assert/strict");
const { mkdtempSync, rmSync, writeFileSync, mkdirSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const Database = require("better-sqlite3");
const { migrate } = require("../scripts/migrate.cjs");

function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), "egresados-migrations-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return { dir, path: join(dir, "test.db") };
}

test("fresh database has the columns needed by authentication and approvals", (t) => {
  const { path } = fixture(t);
  migrate(path);
  const db = new Database(path);
  try {
    const columns = db.pragma("table_info(users)").map((c) => c.name);
    for (const column of ["status", "rejection_reason", "institution_name", "pending_university"]) {
      assert.ok(columns.includes(column), column);
    }
    assert.equal(db.prepare("SELECT count(*) AS n FROM app_migrations").get().n, 16);
    assert.equal(db.pragma("integrity_check", { simple: true }), "ok");
  } finally { db.close(); }
});

test("adopts a database without a journal, preserves rows and can run twice", (t) => {
  const { path } = fixture(t);
  migrate(path);
  let db = new Database(path);
  db.prepare("INSERT INTO users (username,email,password_hash,status) VALUES (?,?,?,?)")
    .run("existing", "existing@example.test", "unchanged-hash", "approved");
  const before = db.prepare("SELECT * FROM users").all();
  db.exec("DROP TABLE app_migrations; ALTER TABLE users DROP COLUMN institution_name; ALTER TABLE users DROP COLUMN pending_university;");
  db.close();
  migrate(path);
  migrate(path);
  db = new Database(path);
  try { assert.deepEqual(db.prepare("SELECT * FROM users").all(), before); }
  finally { db.close(); }
});

test("SQL failure rolls back all pending migrations", (t) => {
  const { dir, path } = fixture(t);
  const migrations = join(dir, "sql"); mkdirSync(migrations);
  writeFileSync(join(migrations, "0000_ok.sql"), "CREATE TABLE example (id integer);");
  writeFileSync(join(migrations, "0001_bad.sql"), "INSERT INTO nonexistent VALUES (1);");
  assert.throws(() => migrate(path, migrations), /no such table/);
  const db = new Database(path);
  try { assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE name='example'").get().n, 0); }
  finally { db.close(); }
});

test("rejects edited migrations and accepts CRLF-only changes", (t) => {
  const { dir, path } = fixture(t);
  const migrations = join(dir, "sql"); mkdirSync(migrations);
  const file = join(migrations, "0000_ok.sql");
  writeFileSync(file, "CREATE TABLE example (id integer);\n"); migrate(path, migrations);
  writeFileSync(file, "CREATE TABLE example (id integer);\r\n"); migrate(path, migrations);
  writeFileSync(file, "CREATE TABLE example (id text);\n");
  assert.throws(() => migrate(path, migrations), /modificada/);
});
