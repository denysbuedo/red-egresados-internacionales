CREATE TABLE notification_preferences (
 user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 connections TEXT NOT NULL DEFAULT 'off', communities TEXT NOT NULL DEFAULT 'off',
 events TEXT NOT NULL DEFAULT 'off', activity TEXT NOT NULL DEFAULT 'off', updated_at INTEGER NOT NULL
);
CREATE TABLE notification_queue (
 id INTEGER PRIMARY KEY AUTOINCREMENT, event_key TEXT NOT NULL UNIQUE,
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 category TEXT NOT NULL, kind TEXT NOT NULL, subject TEXT NOT NULL, text_body TEXT NOT NULL,
 link TEXT NOT NULL, due_at INTEGER NOT NULL, created_at INTEGER NOT NULL,
 state TEXT NOT NULL DEFAULT 'pending', dispatch_id TEXT REFERENCES email_dispatches(id) ON DELETE SET NULL,
 context_type TEXT, context_id INTEGER
);
CREATE INDEX notification_queue_due ON notification_queue(state,due_at);
CREATE TABLE notification_worker_state (key TEXT PRIMARY KEY,value INTEGER NOT NULL);
CREATE TABLE password_reset_tokens (
 token_hash TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at INTEGER NOT NULL,created_at INTEGER NOT NULL
);
CREATE INDEX password_reset_user ON password_reset_tokens(user_id);
CREATE TABLE community_invitations (
 id INTEGER PRIMARY KEY AUTOINCREMENT,group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 invited_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
 status TEXT NOT NULL DEFAULT 'pending',created_at INTEGER NOT NULL,
 UNIQUE(group_id,user_id)
);
CREATE TABLE community_announcements (
 id INTEGER PRIMARY KEY AUTOINCREMENT,group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
 author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,title TEXT NOT NULL,content TEXT NOT NULL,created_at INTEGER NOT NULL
);
ALTER TABLE events ADD COLUMN cancelled_at INTEGER;
ALTER TABLE events ADD COLUMN revision INTEGER NOT NULL DEFAULT 0;
