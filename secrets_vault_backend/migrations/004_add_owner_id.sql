-- 004_add_owner_id.sql
ALTER TABLE `keys`
  ADD COLUMN owner_id VARCHAR(191) NULL AFTER description,
  ADD INDEX idx_owner_id (owner_id);
