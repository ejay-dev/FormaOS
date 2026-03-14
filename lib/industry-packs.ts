export type IndustryPack = {
    id: string;
    name: string;
    description: string;
    policies: { title: string; content: string }[];
    tasks: { title: string; description: string }[];
    assets: { name: string; type: string; criticality: string }[];
};

export const INDUSTRY_PACK_VERSION = '2026.03.14';

export const INDUSTRY_PACKS: Record<string, IndustryPack> = {
    "ndis": {
        id: "ndis",
        name: "NDIS Provider",
        description: "Compliance framework for National Disability Insurance Scheme providers.",
        policies: [
            { title: "Incident Management Policy", content: "## 1. Purpose\nTo ensure all incidents are recorded..." },
            { title: "Code of Conduct", content: "## 1. Purpose\nTo set expectations for worker behavior..." },
            { title: "Complaints Management", content: "## 1. Purpose\nTo provide a clear pathway for feedback..." }
        ],
        tasks: [
            { title: "Worker Screening Check", description: "Verify NDIS worker screening for all staff." },
            { title: "Complete NDIS Audit Self-Assessment", description: "Review practice standards against current operations." },
            { title: "Appoint Key Personnel", description: "Assign roles for operations and quality management." }
        ],
        assets: [
            { name: "Participant Records Database", type: "data", criticality: "critical" },
            { name: "Staff Training Register", type: "data", criticality: "high" }
        ]
    },
    "healthcare": {
        id: "healthcare",
        name: "GP / Medical Practice",
        description: "RACGP Standards for general practices and medical centers.",
        policies: [
            { title: "Patient Privacy Policy", content: "## 1. Overview\nEnsuring confidentiality of patient records..." },
            { title: "Infection Control Policy", content: "## 1. Procedures\nStandard precautions for hygiene and sterilization..." },
            { title: "Data Breach Response Plan", content: "## 1. Immediate Actions\nSteps to take in event of data loss..." }
        ],
        tasks: [
            { title: "Annual Accreditation Review", description: "Prepare documentation for RACGP/Standard accreditation." },
            { title: "Check Medical Board Registrations", description: "Validate AHPRA registration for all practitioners." }
        ],
        assets: [
            { name: "Practice Management Software", type: "software", criticality: "critical" },
            { name: "Medical Devices Register", type: "hardware", criticality: "high" }
        ]
    },
    "childcare": {
        id: "childcare",
        name: "Childcare / Early Learning",
        description: "National Quality Framework (NQF) for early childhood education.",
        policies: [
            { title: "Child Protection Policy", content: "## 1. Objective\nMandatory reporting and child safety protocols..." },
            { title: "Delivery and Collection of Children", content: "## 1. Procedures\nEnsuring safe arrival and departure..." },
            { title: "Sun Protection Policy", content: "## 1. Requirements\nSun safety measures for outdoor play..." }
        ],
        tasks: [
            { title: "Working with Children Checks", description: "Audit WWCC for all educators and staff." },
            { title: "Review Emergency Evacuation Plan", description: "Conduct quarterly fire drill rehearsal." }
        ],
        assets: [
            { name: "Child Enrollment Database", type: "data", criticality: "critical" },
            { name: "Outdoor Play Equipment", type: "hardware", criticality: "medium" }
        ]
    },
    "aged_care": {
        id: "aged_care",
        name: "Aged Care Residential",
        description: "Aged Care Quality Standards for residential facilities.",
        policies: [
            { title: "Dignity and Choice Policy", content: "## 1. Consumer Rights\nRespecting consumer dignity and choices..." },
            { title: "Clinical Governance Framework", content: "## 1. Governance\nEnsuring high quality clinical care..." },
            { title: "Serious Incident Response Scheme (SIRS)", content: "## 1. Reporting\nMandatory reporting of incidents..." }
        ],
        tasks: [
            { title: "Review Staff Rosters", description: "Ensure adequate staffing levels per new regulations." },
            { title: "Food Safety Audit", description: "Internal audit of kitchen and meal service." }
        ],
        assets: [
            { name: "Resident Care Plans", type: "data", criticality: "critical" },
            { name: "Medication Management System", type: "software", criticality: "critical" }
        ]
    },
    "community_services": {
        id: "community_services",
        name: "Community Services",
        description: "Compliance for community service organizations and NGOs.",
        policies: [
            { title: "Client Rights & Advocacy Policy", content: "## 1. Purpose\nEnsuring client rights are upheld and advocacy pathways are accessible..." },
            { title: "Service Delivery Standards", content: "## 1. Overview\nMaintaining quality and consistency in service delivery..." },
            { title: "Complaints & Feedback Policy", content: "## 1. Purpose\nProviding accessible feedback and complaints channels..." }
        ],
        tasks: [
            { title: "Vulnerable Persons Check", description: "Verify working with vulnerable persons clearances for all staff." },
            { title: "Review Service Agreements", description: "Ensure all client service agreements are current and compliant." },
            { title: "Community Program Risk Assessment", description: "Conduct risk assessment for all active community programs." }
        ],
        assets: [
            { name: "Client Management System", type: "software", criticality: "critical" },
            { name: "Case File Records", type: "data", criticality: "critical" }
        ]
    },
    "financial_services": {
        id: "financial_services",
        name: "Financial Services",
        description: "Regulatory compliance for financial services providers.",
        policies: [
            { title: "AML/CTF Policy", content: "## 1. Purpose\nAnti-money laundering and counter-terrorism financing procedures..." },
            { title: "Risk Management Framework", content: "## 1. Scope\nEnterprise risk identification, assessment, and mitigation..." },
            { title: "Privacy & Data Protection Policy", content: "## 1. Overview\nProtecting client financial data and personal information..." }
        ],
        tasks: [
            { title: "AML/CTF Compliance Review", description: "Review anti-money laundering controls and transaction monitoring." },
            { title: "Conduct Risk Assessment", description: "Complete annual enterprise risk assessment and update risk register." },
            { title: "Staff Compliance Training", description: "Ensure all staff complete mandatory regulatory compliance training." }
        ],
        assets: [
            { name: "Core Banking System", type: "software", criticality: "critical" },
            { name: "Client Financial Records", type: "data", criticality: "critical" }
        ]
    },
    "saas_technology": {
        id: "saas_technology",
        name: "SaaS / Technology",
        description: "SOC 2, ISO 27001, and GDPR controls for technology companies.",
        policies: [
            { title: "Information Security Policy", content: "## 1. Purpose\nEstablishing information security controls and access management..." },
            { title: "Incident Response Plan", content: "## 1. Scope\nProcedures for detecting, responding to, and recovering from security incidents..." },
            { title: "Data Retention & Disposal Policy", content: "## 1. Overview\nData lifecycle management, retention schedules, and secure disposal..." }
        ],
        tasks: [
            { title: "SOC 2 Readiness Assessment", description: "Evaluate current controls against SOC 2 Trust Service Criteria." },
            { title: "Vulnerability Scan Review", description: "Review results from latest vulnerability scan and prioritize remediation." },
            { title: "Access Control Audit", description: "Audit user access permissions and remove stale accounts." }
        ],
        assets: [
            { name: "Production Infrastructure", type: "software", criticality: "critical" },
            { name: "Source Code Repository", type: "data", criticality: "critical" }
        ]
    },
    "enterprise": {
        id: "enterprise",
        name: "Enterprise / Multi-site",
        description: "Multi-framework compliance for large enterprises and multi-site organizations.",
        policies: [
            { title: "Enterprise Risk Management Policy", content: "## 1. Purpose\nEstablishing enterprise-wide risk governance across all business units..." },
            { title: "Business Continuity Plan", content: "## 1. Scope\nEnsuring operational resilience and disaster recovery across all sites..." },
            { title: "Vendor & Third-Party Management Policy", content: "## 1. Overview\nManaging third-party risk, vendor assessments, and supply chain compliance..." }
        ],
        tasks: [
            { title: "Multi-site Compliance Baseline", description: "Establish compliance baseline across all operational sites." },
            { title: "Vendor Risk Assessment", description: "Complete risk assessments for all critical third-party vendors." },
            { title: "Business Continuity Test", description: "Conduct annual business continuity and disaster recovery test." }
        ],
        assets: [
            { name: "Enterprise Resource Planning System", type: "software", criticality: "critical" },
            { name: "Vendor Contracts Register", type: "data", criticality: "high" }
        ]
    },
    "other": {
        id: "other",
        name: "General Compliance",
        description: "General compliance framework for regulated services.",
        policies: [
            { title: "Privacy Policy", content: "## 1. Purpose\nProtecting personal information in accordance with applicable privacy laws..." },
            { title: "Risk Management Policy", content: "## 1. Overview\nIdentifying, assessing, and managing organizational risks..." }
        ],
        tasks: [
            { title: "Complete Risk Register", description: "Identify and document key organizational risks." },
            { title: "Staff Compliance Orientation", description: "Ensure all staff understand compliance obligations and reporting." }
        ],
        assets: [
            { name: "Document Management System", type: "software", criticality: "high" },
            { name: "Staff Records Database", type: "data", criticality: "high" }
        ]
    }
};

export function listIndustryPacks(): IndustryPack[] {
    return Object.values(INDUSTRY_PACKS);
}

export function getIndustryPack(industryId: string): IndustryPack | null {
    return INDUSTRY_PACKS[industryId] ?? null;
}

export function applyIndustryPackCustomization(
    industryId: string,
    customization: Partial<IndustryPack>,
): IndustryPack | null {
    const pack = getIndustryPack(industryId);
    if (!pack) {
        return null;
    }

    return {
        ...pack,
        ...customization,
        policies: customization.policies ?? pack.policies,
        tasks: customization.tasks ?? pack.tasks,
        assets: customization.assets ?? pack.assets,
    };
}

export function mapIndustryPackToFrameworks(
    industryId: string,
    frameworks: string[],
): Array<{
    industryId: string;
    framework: string;
    policyCount: number;
    taskCount: number;
    assetCount: number;
    version: string;
}> {
    const pack = getIndustryPack(industryId);
    if (!pack) {
        return [];
    }

    return frameworks.map((framework) => ({
        industryId,
        framework,
        policyCount: pack.policies.length,
        taskCount: pack.tasks.length,
        assetCount: pack.assets.length,
        version: INDUSTRY_PACK_VERSION,
    }));
}
