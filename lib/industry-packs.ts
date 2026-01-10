export type IndustryPack = {
    id: string;
    name: string;
    description: string;
    policies: { title: string; content: string }[];
    tasks: { title: string; description: string }[];
    assets: { name: string; type: string; criticality: string }[];
};

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
    }
};