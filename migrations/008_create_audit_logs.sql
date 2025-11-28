-- Migration: Create audit_logs table for security event tracking
-- Date: 2025-11-28
-- Purpose: GDPR compliance, security monitoring, and audit trail

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),

    -- User information
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(255),

    -- Request information
    ip_address INET,
    user_agent TEXT,

    -- Resource information
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    action VARCHAR(50),

    -- Event details
    success BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB,
    message TEXT NOT NULL,

    -- Timestamp
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Indexes for common queries
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_ip_address ON audit_logs(ip_address);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Create GIN index for JSONB metadata searches
CREATE INDEX idx_audit_logs_metadata ON audit_logs USING GIN(metadata);

-- Add comment for documentation
COMMENT ON TABLE audit_logs IS 'Security audit trail for compliance and monitoring';
COMMENT ON COLUMN audit_logs.event_type IS 'Type of audit event (e.g., auth.login.success, data.delete)';
COMMENT ON COLUMN audit_logs.severity IS 'Event severity level: info, warning, error, critical';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional event-specific data (sensitive data must be redacted)';

-- Create a view for recent security events
CREATE OR REPLACE VIEW recent_security_events AS
SELECT
    id,
    event_type,
    severity,
    user_name,
    ip_address,
    message,
    timestamp
FROM audit_logs
WHERE timestamp > NOW() - INTERVAL '7 days'
    AND severity IN ('warning', 'error', 'critical')
ORDER BY timestamp DESC;

-- Grant appropriate permissions
-- Note: Adjust these based on your security requirements
GRANT SELECT ON audit_logs TO readonly_user;
GRANT SELECT ON recent_security_events TO readonly_user;
