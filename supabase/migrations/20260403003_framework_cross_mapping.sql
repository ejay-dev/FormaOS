-- Framework Cross-Mapping: canonical control equivalences across compliance frameworks
-- Enables evidence reuse and deduplication across SOC 2, ISO 27001, HIPAA, NDIS, PCI-DSS, GDPR

-- 1. Control mappings between frameworks
CREATE TABLE IF NOT EXISTS framework_control_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_framework TEXT NOT NULL,
  source_control_id TEXT NOT NULL,
  target_framework TEXT NOT NULL,
  target_control_id TEXT NOT NULL,
  mapping_strength TEXT NOT NULL CHECK (mapping_strength IN ('exact', 'partial', 'related')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crossmap_source ON framework_control_mappings(source_framework, source_control_id);
CREATE INDEX IF NOT EXISTS idx_crossmap_target ON framework_control_mappings(target_framework, target_control_id);

-- 2. Control groups (clusters of equivalent controls)
CREATE TABLE IF NOT EXISTS control_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Group membership
CREATE TABLE IF NOT EXISTS control_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES control_groups(id) ON DELETE CASCADE,
  framework TEXT NOT NULL,
  control_id TEXT NOT NULL,
  UNIQUE(group_id, framework, control_id)
);

-- RLS
ALTER TABLE framework_control_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_group_members ENABLE ROW LEVEL SECURITY;

-- Mappings and groups are read-only for all authenticated users (global reference data)
DO $$ BEGIN
  DROP POLICY IF EXISTS "crossmap_read_all" ON framework_control_mappings;
  CREATE POLICY "crossmap_read_all" ON framework_control_mappings FOR SELECT USING (auth.uid() IS NOT NULL);
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "groups_read_all" ON control_groups;
  CREATE POLICY "groups_read_all" ON control_groups FOR SELECT USING (auth.uid() IS NOT NULL);
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "group_members_read_all" ON control_group_members;
  CREATE POLICY "group_members_read_all" ON control_group_members FOR SELECT USING (auth.uid() IS NOT NULL);
END $$;

-- Seed: 30+ cross-framework mappings

-- Group 1: Access Control
INSERT INTO control_groups (id, name, description, category) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'Access Control', 'Logical and physical access controls', 'Access Control');

INSERT INTO control_group_members (group_id, framework, control_id) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'SOC2', 'CC6.1'),
  ('a0000001-0000-0000-0000-000000000001', 'ISO27001', 'A.8.2'),
  ('a0000001-0000-0000-0000-000000000001', 'HIPAA', '164.312(a)(1)'),
  ('a0000001-0000-0000-0000-000000000001', 'PCI-DSS', 'Req-7'),
  ('a0000001-0000-0000-0000-000000000001', 'GDPR', 'Art.32(1)(b)');

INSERT INTO framework_control_mappings (source_framework, source_control_id, target_framework, target_control_id, mapping_strength, notes) VALUES
  ('SOC2', 'CC6.1', 'ISO27001', 'A.8.2', 'exact', 'Both require logical access restrictions'),
  ('SOC2', 'CC6.1', 'HIPAA', '164.312(a)(1)', 'exact', 'Access control standard'),
  ('SOC2', 'CC6.1', 'PCI-DSS', 'Req-7', 'exact', 'Restrict access by business need to know'),
  ('SOC2', 'CC6.1', 'GDPR', 'Art.32(1)(b)', 'partial', 'GDPR requires confidentiality measures'),
  ('ISO27001', 'A.8.2', 'HIPAA', '164.312(a)(1)', 'exact', 'Access control alignment'),
  ('ISO27001', 'A.8.2', 'PCI-DSS', 'Req-7', 'exact', 'Business need-based access');

-- Group 2: Encryption at Rest & Transit
INSERT INTO control_groups (id, name, description, category) VALUES
  ('a0000002-0000-0000-0000-000000000002', 'Encryption', 'Encryption at rest and in transit', 'Data Protection');

INSERT INTO control_group_members (group_id, framework, control_id) VALUES
  ('a0000002-0000-0000-0000-000000000002', 'SOC2', 'CC6.7'),
  ('a0000002-0000-0000-0000-000000000002', 'ISO27001', 'A.10.1'),
  ('a0000002-0000-0000-0000-000000000002', 'HIPAA', '164.312(a)(2)(iv)'),
  ('a0000002-0000-0000-0000-000000000002', 'PCI-DSS', 'Req-3'),
  ('a0000002-0000-0000-0000-000000000002', 'GDPR', 'Art.32(1)(a)');

INSERT INTO framework_control_mappings (source_framework, source_control_id, target_framework, target_control_id, mapping_strength, notes) VALUES
  ('SOC2', 'CC6.7', 'ISO27001', 'A.10.1', 'exact', 'Cryptographic controls'),
  ('SOC2', 'CC6.7', 'HIPAA', '164.312(a)(2)(iv)', 'exact', 'Encryption and decryption'),
  ('SOC2', 'CC6.7', 'PCI-DSS', 'Req-3', 'partial', 'PCI-DSS Req-3 focuses on stored data; CC6.7 broader'),
  ('SOC2', 'CC6.7', 'GDPR', 'Art.32(1)(a)', 'partial', 'Pseudonymisation and encryption'),
  ('HIPAA', '164.312(a)(2)(iv)', 'PCI-DSS', 'Req-4', 'exact', 'Encrypt data in transit');

-- Group 3: Incident Response
INSERT INTO control_groups (id, name, description, category) VALUES
  ('a0000003-0000-0000-0000-000000000003', 'Incident Response', 'Security incident detection and response', 'Incident Management');

INSERT INTO control_group_members (group_id, framework, control_id) VALUES
  ('a0000003-0000-0000-0000-000000000003', 'SOC2', 'CC7.3'),
  ('a0000003-0000-0000-0000-000000000003', 'ISO27001', 'A.16.1'),
  ('a0000003-0000-0000-0000-000000000003', 'HIPAA', '164.308(a)(6)'),
  ('a0000003-0000-0000-0000-000000000003', 'NDIS', 'PS-3'),
  ('a0000003-0000-0000-0000-000000000003', 'PCI-DSS', 'Req-12.10');

INSERT INTO framework_control_mappings (source_framework, source_control_id, target_framework, target_control_id, mapping_strength, notes) VALUES
  ('SOC2', 'CC7.3', 'ISO27001', 'A.16.1', 'exact', 'Incident mgmt and response'),
  ('SOC2', 'CC7.3', 'HIPAA', '164.308(a)(6)', 'exact', 'Security incident procedures'),
  ('SOC2', 'CC7.3', 'NDIS', 'PS-3', 'partial', 'NDIS broader: participant safety incidents'),
  ('SOC2', 'CC7.3', 'PCI-DSS', 'Req-12.10', 'exact', 'Incident response plan'),
  ('ISO27001', 'A.16.1', 'HIPAA', '164.308(a)(6)', 'exact', 'Incident response process');

-- Group 4: Risk Assessment
INSERT INTO control_groups (id, name, description, category) VALUES
  ('a0000004-0000-0000-0000-000000000004', 'Risk Assessment', 'Identify and assess information security risks', 'Risk Management');

INSERT INTO control_group_members (group_id, framework, control_id) VALUES
  ('a0000004-0000-0000-0000-000000000004', 'SOC2', 'CC3.2'),
  ('a0000004-0000-0000-0000-000000000004', 'ISO27001', '6.1.2'),
  ('a0000004-0000-0000-0000-000000000004', 'HIPAA', '164.308(a)(1)(ii)(A)'),
  ('a0000004-0000-0000-0000-000000000004', 'PCI-DSS', 'Req-12.2');

INSERT INTO framework_control_mappings (source_framework, source_control_id, target_framework, target_control_id, mapping_strength, notes) VALUES
  ('SOC2', 'CC3.2', 'ISO27001', '6.1.2', 'exact', 'Risk assessment process'),
  ('SOC2', 'CC3.2', 'HIPAA', '164.308(a)(1)(ii)(A)', 'exact', 'Risk analysis requirement'),
  ('SOC2', 'CC3.2', 'PCI-DSS', 'Req-12.2', 'exact', 'Annual risk assessment'),
  ('ISO27001', '6.1.2', 'HIPAA', '164.308(a)(1)(ii)(A)', 'exact', 'Risk assessment alignment');

-- Group 5: Logging & Monitoring
INSERT INTO control_groups (id, name, description, category) VALUES
  ('a0000005-0000-0000-0000-000000000005', 'Logging & Monitoring', 'Audit logging and security monitoring', 'Monitoring');

INSERT INTO control_group_members (group_id, framework, control_id) VALUES
  ('a0000005-0000-0000-0000-000000000005', 'SOC2', 'CC7.2'),
  ('a0000005-0000-0000-0000-000000000005', 'ISO27001', 'A.12.4'),
  ('a0000005-0000-0000-0000-000000000005', 'HIPAA', '164.312(b)'),
  ('a0000005-0000-0000-0000-000000000005', 'PCI-DSS', 'Req-10');

INSERT INTO framework_control_mappings (source_framework, source_control_id, target_framework, target_control_id, mapping_strength, notes) VALUES
  ('SOC2', 'CC7.2', 'ISO27001', 'A.12.4', 'exact', 'Event logging'),
  ('SOC2', 'CC7.2', 'HIPAA', '164.312(b)', 'exact', 'Audit controls / activity logs'),
  ('SOC2', 'CC7.2', 'PCI-DSS', 'Req-10', 'exact', 'Track and monitor all access'),
  ('ISO27001', 'A.12.4', 'PCI-DSS', 'Req-10', 'exact', 'Logging requirements');

-- Group 6: Business Continuity
INSERT INTO control_groups (id, name, description, category) VALUES
  ('a0000006-0000-0000-0000-000000000006', 'Business Continuity', 'Disaster recovery and continuity planning', 'Resilience');

INSERT INTO control_group_members (group_id, framework, control_id) VALUES
  ('a0000006-0000-0000-0000-000000000006', 'SOC2', 'CC9.1'),
  ('a0000006-0000-0000-0000-000000000006', 'ISO27001', 'A.17.1'),
  ('a0000006-0000-0000-0000-000000000006', 'HIPAA', '164.308(a)(7)');

INSERT INTO framework_control_mappings (source_framework, source_control_id, target_framework, target_control_id, mapping_strength, notes) VALUES
  ('SOC2', 'CC9.1', 'ISO27001', 'A.17.1', 'exact', 'Business continuity planning'),
  ('SOC2', 'CC9.1', 'HIPAA', '164.308(a)(7)', 'exact', 'Contingency plan'),
  ('ISO27001', 'A.17.1', 'HIPAA', '164.308(a)(7)', 'exact', 'Continuity alignment');

-- Group 7: Change Management
INSERT INTO control_groups (id, name, description, category) VALUES
  ('a0000007-0000-0000-0000-000000000007', 'Change Management', 'System and process change controls', 'Change Control');

INSERT INTO control_group_members (group_id, framework, control_id) VALUES
  ('a0000007-0000-0000-0000-000000000007', 'SOC2', 'CC8.1'),
  ('a0000007-0000-0000-0000-000000000007', 'ISO27001', 'A.12.1.2'),
  ('a0000007-0000-0000-0000-000000000007', 'PCI-DSS', 'Req-6.4');

INSERT INTO framework_control_mappings (source_framework, source_control_id, target_framework, target_control_id, mapping_strength, notes) VALUES
  ('SOC2', 'CC8.1', 'ISO27001', 'A.12.1.2', 'exact', 'Change management'),
  ('SOC2', 'CC8.1', 'PCI-DSS', 'Req-6.4', 'exact', 'Change control processes');

-- Group 8: Data Privacy / Subject Rights
INSERT INTO control_groups (id, name, description, category) VALUES
  ('a0000008-0000-0000-0000-000000000008', 'Data Subject Rights', 'Individual rights over personal data', 'Privacy');

INSERT INTO control_group_members (group_id, framework, control_id) VALUES
  ('a0000008-0000-0000-0000-000000000008', 'GDPR', 'Art.15-22'),
  ('a0000008-0000-0000-0000-000000000008', 'HIPAA', '164.524'),
  ('a0000008-0000-0000-0000-000000000008', 'NDIS', 'PS-1');

INSERT INTO framework_control_mappings (source_framework, source_control_id, target_framework, target_control_id, mapping_strength, notes) VALUES
  ('GDPR', 'Art.15-22', 'HIPAA', '164.524', 'partial', 'HIPAA limited to access; GDPR broader rights'),
  ('GDPR', 'Art.15-22', 'NDIS', 'PS-1', 'related', 'NDIS participant rights and dignity');
