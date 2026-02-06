-- Migration: Add AI Processing Fields to Rumors Table
-- Run this in your Supabase SQL Editor

-- Add AI analysis columns
ALTER TABLE rumors 
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS is_time_bound BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS censored_content TEXT,
ADD COLUMN IF NOT EXISTS has_harmful_content BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ai_confidence VARCHAR(10) CHECK (ai_confidence IN ('high', 'medium', 'low')),
ADD COLUMN IF NOT EXISTS ai_processed_at TIMESTAMPTZ;

-- Add index for time-bound rumors (for efficient expiry queries)
CREATE INDEX IF NOT EXISTS idx_rumors_expiry_date 
ON rumors(expiry_date) 
WHERE is_time_bound = TRUE AND expiry_date IS NOT NULL;

-- Add index for harmful content (for moderation dashboard)
CREATE INDEX IF NOT EXISTS idx_rumors_harmful_content 
ON rumors(has_harmful_content) 
WHERE has_harmful_content = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN rumors.ai_summary IS 'AI-generated concise summary for long rumors';
COMMENT ON COLUMN rumors.is_time_bound IS 'Whether this rumor has time-based relevance that will expire';
COMMENT ON COLUMN rumors.expiry_date IS 'Date when this rumor becomes irrelevant (for time-bound rumors)';
COMMENT ON COLUMN rumors.censored_content IS 'Censored version of content with profanity masked';
COMMENT ON COLUMN rumors.has_harmful_content IS 'AI-flagged for harassment, threats, or hate speech';
COMMENT ON COLUMN rumors.ai_confidence IS 'AI confidence level: high, medium, or low';
COMMENT ON COLUMN rumors.ai_processed_at IS 'Timestamp when AI processing completed';
