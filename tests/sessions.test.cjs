const { test } = require("node:test");
const assert = require("node:assert/strict");
const Database = require("better-sqlite3");
const { migrate } = require("../scripts/migrate.cjs");
const { createSessionStore, MAX_AGE } = require("../src/lib/session-store.cjs");
const { mkdtempSync, rmSync } = require("node:fs");
const { join } = require("node:path");
const { tmpdir } = require("node:os");

test("opaque sessions reject forged identity, expire and are revoked independently", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "egresados-sessions-"));
  const file = join(dir, "test.db"); migrate(file);
  const db = new Database(file);
  t.after(() => { db.close(); rmSync(dir, { recursive: true, force: true }); });
  db.prepare("INSERT INTO users (id,username,email,password_hash) VALUES (1,'u','u@example.test','unused')").run();
  let now = 1000;
  const store = createSessionStore(db, () => now);
  const token = store.create(1); const other = store.create(1);
  assert.notEqual(token, other);
  assert.equal(store.find(token), 1);
  assert.equal(store.find(Buffer.from(JSON.stringify({ userId: 1, createdAt: now })).toString('base64')), null);
  assert.equal(store.find(token.slice(0,-1) + (token.endsWith('a') ? 'b' : 'a')), null);
  assert.equal(store.find(null), null);
  const stored = db.prepare("SELECT token_hash FROM sessions").all();
  assert.ok(stored.every((r) => r.token_hash !== token && r.token_hash.length === 64));
  store.revoke(token); assert.equal(store.find(token), null); assert.equal(store.find(other), 1);
  now += MAX_AGE * 1000; assert.equal(store.find(other), null);
  const fresh = store.create(1); store.revokeUser(1); assert.equal(store.find(fresh), null);
});

test("rate limits persist between store instances and reset after their window", () => {
  const db = new Database(":memory:");
  db.exec("CREATE TABLE auth_rate_limits (key TEXT PRIMARY KEY, attempts INTEGER, expires_at INTEGER)");
  let now = 1000; const store = createSessionStore(db, () => now);
  assert.equal(store.consumeLimit("account", 2, 1000), true);
  assert.equal(store.consumeLimit("account", 2, 1000), true);
  assert.equal(createSessionStore(db, () => now).consumeLimit("account", 2, 1000), false);
  now += 1000; assert.equal(store.consumeLimit("account", 2, 1000), true); db.close();
});
