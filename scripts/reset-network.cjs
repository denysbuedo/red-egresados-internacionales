const Database = require("better-sqlite3");
const ALLOWED_TABLES = new Set(["connections","email_lists","graduates","posts","users","admin_posts","post_reactions","user_posts","post_comments","notifications","events","event_attendees","groups","group_members","group_posts","event_notification_log","app_migrations","sessions","auth_rate_limits","email_dispatches"]);

function resetNetwork(db, username) {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(row => row.name);
  if (tables.some(name => !ALLOWED_TABLES.has(name))) throw new Error("Unknown database table; reset aborted");
  const account = db.prepare("SELECT * FROM users WHERE username=?").get(username);
  if (!account || account.role !== "admin" || account.status !== "approved") throw new Error("An approved administrator must be preserved");
  const profiles = db.prepare("SELECT * FROM graduates WHERE user_id=?").all(account.id);
  if (profiles.length > 1 || (account.graduate_id !== null && !profiles.some(profile => profile.id === account.graduate_id))) throw new Error("Inconsistent administrator profile; reset aborted");
  if (db.pragma("integrity_check", { simple: true }) !== "ok" || db.pragma("foreign_key_check").length) throw new Error("Database integrity must be valid before reset");
  db.transaction(() => {
    db.pragma("defer_foreign_keys = ON");
    for (const table of tables) {
      if (["users", "graduates", "app_migrations", "sessions"].includes(table)) continue;
      db.prepare(`DELETE FROM "${table}"`).run();
    }
    db.prepare("DELETE FROM sessions WHERE user_id <> ?").run(account.id);
    db.prepare("DELETE FROM users WHERE id <> ?").run(account.id);
    db.prepare("DELETE FROM graduates WHERE user_id IS NULL OR user_id <> ?").run(account.id);
    if (db.pragma("foreign_key_check").length) throw new Error("Foreign keys failed; reset rolled back");
    const after = db.prepare("SELECT * FROM users WHERE id=?").get(account.id);
    if (JSON.stringify(after) !== JSON.stringify(account)) throw new Error("Administrator account changed; reset rolled back");
    const afterProfiles = db.prepare("SELECT * FROM graduates WHERE user_id=?").all(account.id);
    if (JSON.stringify(afterProfiles) !== JSON.stringify(profiles)) throw new Error("Administrator profile changed; reset rolled back");
  })();
  return Object.fromEntries(tables.map(table => [table, db.prepare(`SELECT count(*) AS count FROM "${table}"`).get().count]));
}

module.exports = { resetNetwork };
if (require.main === module) {
  const args = process.argv.slice(2);
  const file = args[args.indexOf("--database") + 1];
  const username = args[args.indexOf("--keep-user") + 1];
  if (!args.includes("--confirm-reset") || !args.includes("--database") || !file || !args.includes("--keep-user") || !username) {
    console.error("Usage: node scripts/reset-network.cjs --database /absolute/path.db --keep-user dinfo --confirm-reset (create a verified backup first)"); process.exit(1);
  }
  const db = new Database(file, { fileMustExist: true });
  try { db.pragma("foreign_keys = ON"); console.log(JSON.stringify(resetNetwork(db, username))); }
  finally { db.close(); }
}
