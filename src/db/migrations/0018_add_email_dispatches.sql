CREATE TABLE email_dispatches (
 id TEXT PRIMARY KEY NOT NULL,
 actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
 recipient_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
 recipient TEXT NOT NULL,
 subject TEXT NOT NULL,
 payload_hash TEXT NOT NULL,
 status TEXT NOT NULL,
 code TEXT,
 correlation_id TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL
);
CREATE INDEX email_dispatches_actor_created ON email_dispatches(actor_id, created_at);
