-- FormaOS Workflow Automation Tables
-- Migration: 20260115_workflow_automation.sql

-- Workflow Rules Table
CREATE TABLE IF NOT EXISTS org_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    trigger TEXT NOT NULL, -- member_added, task_created, task_completed, certificate_expiring, task_overdue, schedule
    enabled BOOLEAN DEFAULT true,
    conditions JSONB DEFAULT '[]'::jsonb, -- Array of condition objects
    actions JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of action objects
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Execution Log (for debugging and monitoring)
CREATE TABLE IF NOT EXISTS org_workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES org_workflows(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    trigger_event TEXT NOT NULL,
    trigger_data JSONB,
    status TEXT NOT NULL, -- success, failed, partial
    actions_executed INTEGER DEFAULT 0,
    error_message TEXT,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflows_org_id ON org_workflows(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflows_trigger ON org_workflows(trigger);
CREATE INDEX IF NOT EXISTS idx_workflows_enabled ON org_workflows(enabled);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON org_workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_executed_at ON org_workflow_executions(executed_at);

-- RLS Policies
ALTER TABLE org_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_workflow_executions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view workflows for their organization
CREATE POLICY "Users can view org workflows"
    ON org_workflows FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM org_members WHERE user_id = auth.uid()
        )
    );

-- Policy: Admins can manage workflows
CREATE POLICY "Admins can manage workflows"
    ON org_workflows FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM org_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- Policy: Users can view workflow execution logs for their org
CREATE POLICY "Users can view workflow executions"
    ON org_workflow_executions FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM org_members WHERE user_id = auth.uid()
        )
    );

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_workflow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_workflow_updated_at
    BEFORE UPDATE ON org_workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_workflow_updated_at();
