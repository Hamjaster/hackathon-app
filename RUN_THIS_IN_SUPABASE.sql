-- ========================================
-- COMPLETE AI FEATURES MIGRATION FOR RUMORS
-- Run this ONCE in Supabase SQL Editor
-- ========================================

-- Add basic AI columns (for backward compatibility)
ALTER TABLE rumors
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS content_warning BOOLEAN DEFAULT FALSE;

-- Add advanced AI processing columns (from Inngest update)
ALTER TABLE rumors
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS is_time_bound BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS censored_content TEXT,
ADD COLUMN IF NOT EXISTS has_harmful_content BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ai_confidence VARCHAR(10) CHECK (ai_confidence IN ('high', 'medium', 'low')),
ADD COLUMN IF NOT EXISTS ai_processed_at TIMESTAMPTZ;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_rumors_expiry_date
ON rumors(expiry_date)
WHERE is_time_bound = TRUE;

CREATE INDEX IF NOT EXISTS idx_rumors_harmful_content
ON rumors(has_harmful_content)
WHERE has_harmful_content = TRUE;

--  Comments for documentation
COMMENT ON COLUMN rumors.summary IS 'AI-generated 1-2 line summary (legacy field)';
COMMENT ON COLUMN rumors.content_warning IS 'AI flag for harmful content (legacy field)';
COMMENT ON COLUMN rumors.ai_summary IS 'AI-generated concise summary';
COMMENT ON COLUMN rumors.is_time_bound IS 'Whether rumor has time-based relevance';
COMMENT ON COLUMN rumors.expiry_date IS 'When rumor becomes irrelevant';
COMMENT ON COLUMN rumors.censored_content IS 'Profanity-masked version';
COMMENT ON COLUMN rumors.has_harmful_content IS 'AI-flagged for harassment/threats';
COMMENT ON COLUMN rumors.ai_confidence IS 'AI confidence: high/medium/low';
COMMENT ON COLUMN rumors.ai_processed_at IS 'AI processing timestamp';

-- ========================================
-- VERIFICATION QUERY - Run this to confirm
-- ========================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'rumors'
AND column_name IN ('summary', 'content_warning', 'ai_summary', 'has_harmful_content')
ORDER BY column_name;

-- If you see 4 rows, the migration worked! ✅
