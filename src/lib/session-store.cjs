const { randomBytes, createHash } = require("node:crypto");
const MAX_AGE = 60 * 60 * 24;
const hash = (token) => createHash("sha256").update(token).digest("hex");

function createSessionStore(sqlite, now = Date.now) {
  const valid = (token) => typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token);
  return {
    create(userId) {
      const token = randomBytes(32).toString("base64url");
      sqlite.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now());
      sqlite.prepare("INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,?)")
        .run(hash(token), userId, now() + MAX_AGE * 1000);
      return token;
    },
    find(token) {
      if (!valid(token)) return null;
      const row = sqlite.prepare("SELECT user_id FROM sessions WHERE token_hash = ? AND expires_at > ?")
        .get(hash(token), now());
      return row ? row.user_id : null;
    },
    revoke(token) {
      if (valid(token)) sqlite.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hash(token));
    },
    revokeUser(userId) {
      sqlite.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
    },
    consumeLimit(key, limit, windowMs) {
      return sqlite.transaction(() => {
        sqlite.prepare("DELETE FROM auth_rate_limits WHERE expires_at <= ?").run(now());
        const row = sqlite.prepare("SELECT attempts FROM auth_rate_limits WHERE key = ?").get(hash(key));
        if (row && row.attempts >= limit) return false;
        sqlite.prepare(`INSERT INTO auth_rate_limits (key,attempts,expires_at) VALUES (?,1,?)
          ON CONFLICT(key) DO UPDATE SET attempts = attempts + 1`).run(hash(key), now() + windowMs);
        return true;
      })();
    },
  };
}
module.exports = { createSessionStore, MAX_AGE };
