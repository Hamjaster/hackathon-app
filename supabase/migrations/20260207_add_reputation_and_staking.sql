-- Migration: Add Voter Reputation, Staking, and Time-Based Resolution
-- Implements FR-4 (staking), FR-6 (time-based resolution), FR-8 (enhanced bot detection)

-- 1. Add reputation tracking to users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_hash VARCHAR(64) UNIQUE NOT NULL,
  reputation DECIMAL(4,3) DEFAULT 0.500,
  correct_votes INT DEFAULT 0,
  total_votes INT DEFAULT 0,
  total_points INT DEFAULT 100, -- Starting points for staking
  points_staked INT DEFAULT 0,
  bot_flag_score DECIMAL(4,3) DEFAULT 0.000,
  is_suspicious BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add time-based resolution tracking to rumors
ALTER TABLE rumors
  ADD COLUMN IF NOT EXISTS score_above_75_since TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS score_below_25_since TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolution_pending BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

COMMENT ON COLUMN rumors.score_above_75_since IS 'Timestamp when score first crossed 0.75 threshold';
COMMENT ON COLUMN rumors.score_below_25_since IS 'Timestamp when score first crossed 0.25 threshold';
COMMENT ON COLUMN rumors.resolution_pending IS 'True if rumor is in 48h grace period before final resolution';
COMMENT ON COLUMN rumors.resolved_at IS 'Timestamp when rumor was finally resolved';

-- 3. Add staking information to evidence_votes
ALTER TABLE evidence_votes
  ADD COLUMN IF NOT EXISTS stake_amount INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS voter_reputation DECIMAL(4,3),
  ADD COLUMN IF NOT EXISTS vote_weight DECIMAL(6,3);

COMMENT ON COLUMN evidence_votes.stake_amount IS 'Points staked on this vote (1-10)';
COMMENT ON COLUMN evidence_votes.voter_reputation IS 'Snapshot of voter reputation at time of vote';
COMMENT ON COLUMN evidence_votes.vote_weight IS 'Calculated weight: reputation × (1 + evidence_quality) × stake';

-- 4. Add vote outcomes tracking (for reputation updates)
CREATE TABLE IF NOT EXISTS vote_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_hash VARCHAR(64) NOT NULL,
  rumor_id UUID REFERENCES rumors(id) ON DELETE CASCADE,
  evidence_id UUID REFERENCES evidence(id) ON DELETE CASCADE,
  vote_type VARCHAR(20) NOT NULL, -- 'helpful' or 'misleading'
  stake_amount INT NOT NULL,
  was_correct BOOLEAN, -- NULL until rumor resolves
  points_gained INT DEFAULT 0,
  points_lost INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_vote_outcomes_vote_hash ON vote_outcomes(vote_hash);
CREATE INDEX IF NOT EXISTS idx_vote_outcomes_rumor_id ON vote_outcomes(rumor_id);

-- 5. Add agreement correlation tracking for bot detection
CREATE TABLE IF NOT EXISTS vote_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_hash_1 VARCHAR(64) NOT NULL,
  vote_hash_2 VARCHAR(64) NOT NULL,
  total_shared_votes INT DEFAULT 0,
  agreement_count INT DEFAULT 0,
  agreement_rate DECIMAL(4,3) DEFAULT 0.000,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vote_hash_1, vote_hash_2)
);

CREATE INDEX IF NOT EXISTS idx_vote_agreements_hash1 ON vote_agreements(vote_hash_1);
CREATE INDEX IF NOT EXISTS idx_vote_agreements_hash2 ON vote_agreements(vote_hash_2);
CREATE INDEX IF NOT EXISTS idx_vote_agreements_rate ON vote_agreements(agreement_rate);

-- 6. Update user_fingerprints table structure
ALTER TABLE user_fingerprints
  ADD COLUMN IF NOT EXISTS agreement_flags JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS down_weight_factor DECIMAL(4,3) DEFAULT 1.000;

COMMENT ON COLUMN user_fingerprints.agreement_flags IS 'Array of users with high agreement correlation';
COMMENT ON COLUMN user_fingerprints.down_weight_factor IS 'Multiplier for vote weight (1.0 = normal, 0.1 = heavily down-weighted)';

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rumors_score_thresholds ON rumors(trust_score, status);
CREATE INDEX IF NOT EXISTS idx_rumors_created_at ON rumors(created_at);
CREATE INDEX IF NOT EXISTS idx_evidence_votes_vote_hash ON evidence_votes(vote_hash);
CREATE INDEX IF NOT EXISTS idx_evidence_votes_evidence_id ON evidence_votes(evidence_id);

-- 8. Add function to calculate reputation (Laplace smoothing)
CREATE OR REPLACE FUNCTION calculate_reputation(correct INT, total INT)
RETURNS DECIMAL(4,3) AS $$
BEGIN
  RETURN (correct + 1.0) / (total + 2.0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_reputation IS 'Calculates user reputation with Laplace smoothing: (correct + 1) / (total + 2)';
