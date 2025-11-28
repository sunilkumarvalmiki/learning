-- Migration: Create user_consents table for GDPR consent management
-- Date: 2025-11-28
-- Purpose: Track user consent preferences for GDPR compliance

CREATE TABLE IF NOT EXISTS user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Consent types
    data_processing BOOLEAN NOT NULL DEFAULT true, -- Required for service
    analytics BOOLEAN NOT NULL DEFAULT false,
    marketing BOOLEAN NOT NULL DEFAULT false,

    -- Consent tracking
    consent_given_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Ensure one consent record per user
    UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX idx_user_consents_updated_at ON user_consents(updated_at DESC);

-- Add comments
COMMENT ON TABLE user_consents IS 'User consent preferences for GDPR compliance';
COMMENT ON COLUMN user_consents.data_processing IS 'Consent for data processing (required for service operation)';
COMMENT ON COLUMN user_consents.analytics IS 'Consent for analytics and performance tracking';
COMMENT ON COLUMN user_consents.marketing IS 'Consent for marketing communications';

-- Create a function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_user_consents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_user_consents_updated_at
    BEFORE UPDATE ON user_consents
    FOR EACH ROW
    EXECUTE FUNCTION update_user_consents_updated_at();
