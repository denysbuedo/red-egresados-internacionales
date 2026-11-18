CREATE TABLE problem_reports (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
 category TEXT NOT NULL,
 subject TEXT NOT NULL,
 description TEXT NOT NULL,
 contact_email TEXT,
 page_url TEXT,
 status TEXT NOT NULL DEFAULT 'new',
 created_at INTEGER NOT NULL
);
CREATE INDEX problem_reports_status_created ON problem_reports(status,created_at DESC);
