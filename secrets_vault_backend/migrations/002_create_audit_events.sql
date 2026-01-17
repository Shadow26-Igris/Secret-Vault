-- 002_create_audit_events.sql
CREATE TABLE IF NOT EXISTS audit_events (
  id CHAR(36) NOT NULL PRIMARY KEY,
  key_id CHAR(36) NULL,
  action VARCHAR(32) NOT NULL,
  actor_type VARCHAR(32) NULL,
  actor_id VARCHAR(255) NULL,
  ip VARCHAR(45) NULL,
  meta JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_key_id (key_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
