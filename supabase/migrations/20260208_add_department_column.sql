-- Migration: Add department columns for multi-department support
-- Allows tracking which NUST school/department a user/poster belongs to

-- 1. auth_users table
ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS department VARCHAR(10);
UPDATE auth_users SET department = SPLIT_PART(user_id, '-', 1) WHERE department IS NULL;
CREATE INDEX IF NOT EXISTS idx_auth_users_department ON auth_users(department);
COMMENT ON COLUMN auth_users.department IS 'NUST department code (e.g. SEECS, NBS, SMME)';

-- 2. rumors table - track poster department
ALTER TABLE rumors ADD COLUMN IF NOT EXISTS poster_department VARCHAR(10);
COMMENT ON COLUMN rumors.poster_department IS 'Department of the anonymous poster';

-- 3. evidence table - track evidence submitter department
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS creator_department VARCHAR(10);
COMMENT ON COLUMN evidence.creator_department IS 'Department of the evidence submitter';
