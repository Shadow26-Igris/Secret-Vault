-- 001_create_keys.sql
CREATE TABLE IF NOT EXISTS `keys` (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(191) NULL,
  service VARCHAR(191) NULL,
  environment VARCHAR(64) NULL,
  description TEXT NULL,
  owner_id CHAR(36) NULL,
  secret MEDIUMBLOB NOT NULL,
  iv VARBINARY(16) NOT NULL,
  tag VARBINARY(16) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  deleted_at DATETIME NULL,
  INDEX idx_owner_id (owner_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
