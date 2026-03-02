'use client';

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  memo,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { useReducedMotion } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════════
   FULL CONTROL MAP VISUALIZATION
   ═══════════════════════════════════════════════════════════════
   Enterprise-grade 147-node compliance control map across
   7 frameworks, rendered on a GPU-composited <canvas>.

   Visual layers (back → front):
    1. Multi-halo radial atmosphere
    2. Ambient drifting particles (80+)
    3. Animated dashed concentric orbits
    4. Slow radar sweep
    5. Curved bezier edge network with gradient coloring
    6. Multi-packet data flow with comet trails
    7. Multi-ring glowing nodes (outer dashed + inner solid + gradient fill)
    8. Hover ripple + connected-chain highlight
    9. HUD overlay (corner brackets, axis ticks)
   ═══════════════════════════════════════════════════════════════ */

/* ── Type definitions ──────────────────────────────────────── */

type NodeType = 'framework' | 'control' | 'evidence' | 'task';

interface MapNode {
  id: string;
  label: string;
  type: NodeType;
  framework: string;
  category: string;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  phase: number;
  ring: number; // 0=framework, 1=outer controls, 2=inner controls, 3=evidence/task
}

interface MapEdge {
  from: string;
  to: string;
}

interface AmbientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  phase: number;
}

/* ── Color palette ─────────────────────────────────────────── */

const FRAMEWORK_COLORS: Record<
  string,
  { fill: string; glow: string; ring: string; label: string }
> = {
  iso27001: {
    fill: 'rgba(20,184,166,0.92)',
    glow: 'rgba(20,184,166,0.30)',
    ring: 'rgba(20,184,166,0.45)',
    label: 'rgba(94,234,212,1)',
  },
  soc2: {
    fill: 'rgba(99,102,241,0.90)',
    glow: 'rgba(99,102,241,0.28)',
    ring: 'rgba(129,140,248,0.45)',
    label: 'rgba(165,180,252,1)',
  },
  nist: {
    fill: 'rgba(56,189,248,0.90)',
    glow: 'rgba(56,189,248,0.28)',
    ring: 'rgba(125,211,252,0.45)',
    label: 'rgba(186,230,253,1)',
  },
  hipaa: {
    fill: 'rgba(244,114,182,0.88)',
    glow: 'rgba(244,114,182,0.25)',
    ring: 'rgba(251,146,60,0.45)',
    label: 'rgba(253,186,116,1)',
  },
  gdpr: {
    fill: 'rgba(167,139,250,0.90)',
    glow: 'rgba(167,139,250,0.28)',
    ring: 'rgba(196,181,253,0.45)',
    label: 'rgba(221,214,254,1)',
  },
  pci: {
    fill: 'rgba(251,146,60,0.88)',
    glow: 'rgba(251,146,60,0.25)',
    ring: 'rgba(253,186,116,0.45)',
    label: 'rgba(254,215,170,1)',
  },
  cis: {
    fill: 'rgba(52,211,153,0.90)',
    glow: 'rgba(52,211,153,0.28)',
    ring: 'rgba(110,231,183,0.45)',
    label: 'rgba(167,243,208,1)',
  },
};

const TYPE_ALPHA: Record<NodeType, number> = {
  framework: 1,
  control: 0.9,
  evidence: 0.8,
  task: 0.75,
};
const TYPE_ICONS: Record<NodeType, string> = {
  framework: 'F',
  control: 'C',
  evidence: 'E',
  task: 'T',
};

function getNodeColors(node: MapNode) {
  return FRAMEWORK_COLORS[node.framework] ?? FRAMEWORK_COLORS['iso27001'];
}

/* ── Framework & control dataset (147 nodes) ──────────────── */

interface FrameworkDef {
  id: string;
  label: string;
  angle: number;
  controls: { id: string; label: string; category: string }[];
}

const FRAMEWORKS: FrameworkDef[] = [
  {
    id: 'iso27001',
    label: 'ISO 27001',
    angle: 0,
    controls: [
      { id: 'iso-gov', label: 'Security Policy', category: 'Governance' },
      { id: 'iso-risk', label: 'Risk Management', category: 'Risk' },
      { id: 'iso-asset', label: 'Asset Inventory', category: 'Assets' },
      { id: 'iso-ac', label: 'Access Control', category: 'Access' },
      { id: 'iso-user', label: 'User Lifecycle', category: 'Access' },
      { id: 'iso-ops', label: 'Operations', category: 'Operations' },
      { id: 'iso-log', label: 'Logging & Monitor', category: 'Operations' },
      { id: 'iso-inc', label: 'Incident Mgmt', category: 'Incidents' },
      { id: 'iso-bc', label: 'Business Continuity', category: 'Continuity' },
      { id: 'iso-comp', label: 'Compliance', category: 'Governance' },
      // Sub-controls (derived)
      { id: 'iso-crypto', label: 'Cryptography', category: 'Technical' },
      { id: 'iso-phys', label: 'Physical Security', category: 'Physical' },
      { id: 'iso-net', label: 'Network Security', category: 'Technical' },
      { id: 'iso-dev', label: 'Secure Dev', category: 'Development' },
      { id: 'iso-sup', label: 'Supplier Mgmt', category: 'Vendor' },
      { id: 'iso-class', label: 'Classification', category: 'Data' },
      { id: 'iso-hr', label: 'HR Security', category: 'People' },
      { id: 'iso-aware', label: 'Awareness', category: 'People' },
      { id: 'iso-change', label: 'Change Mgmt', category: 'Operations' },
      { id: 'iso-audit', label: 'Internal Audit', category: 'Governance' },
      { id: 'iso-legal', label: 'Legal Compliance', category: 'Governance' },
    ],
  },
  {
    id: 'soc2',
    label: 'SOC 2',
    angle: 51.4,
    controls: [
      { id: 'soc-gov', label: 'Governance', category: 'Security' },
      { id: 'soc-iam', label: 'IAM', category: 'Security' },
      { id: 'soc-mon', label: 'Monitoring', category: 'Security' },
      { id: 'soc-avail', label: 'Availability', category: 'Availability' },
      { id: 'soc-resil', label: 'Resilience', category: 'Availability' },
      {
        id: 'soc-class',
        label: 'Data Classification',
        category: 'Confidentiality',
      },
      { id: 'soc-enc', label: 'Encryption', category: 'Confidentiality' },
      { id: 'soc-chg', label: 'Change Mgmt', category: 'Processing' },
      { id: 'soc-qual', label: 'Data Quality', category: 'Processing' },
      { id: 'soc-priv', label: 'Privacy Notice', category: 'Privacy' },
      { id: 'soc-rights', label: 'Data Rights', category: 'Privacy' },
      // Sub-controls
      { id: 'soc-log', label: 'Audit Logging', category: 'Security' },
      { id: 'soc-vuln', label: 'Vulnerability Mgmt', category: 'Security' },
      { id: 'soc-pen', label: 'Pen Testing', category: 'Security' },
      { id: 'soc-bcp', label: 'BCP', category: 'Availability' },
      { id: 'soc-dr', label: 'Disaster Recovery', category: 'Availability' },
      { id: 'soc-dlp', label: 'DLP', category: 'Confidentiality' },
      { id: 'soc-vendor', label: 'Vendor Risk', category: 'Security' },
      { id: 'soc-train', label: 'Training', category: 'Security' },
      { id: 'soc-incr', label: 'Incident Response', category: 'Security' },
      { id: 'soc-retain', label: 'Retention', category: 'Privacy' },
    ],
  },
  {
    id: 'nist',
    label: 'NIST CSF',
    angle: 102.8,
    controls: [
      { id: 'nist-gov', label: 'Governance', category: 'Govern' },
      { id: 'nist-strat', label: 'Risk Strategy', category: 'Govern' },
      { id: 'nist-supply', label: 'Supply Chain', category: 'Govern' },
      { id: 'nist-asset', label: 'Asset Inventory', category: 'Identify' },
      { id: 'nist-env', label: 'Business Env', category: 'Identify' },
      { id: 'nist-ra', label: 'Risk Assessment', category: 'Identify' },
      { id: 'nist-ac', label: 'Access Control', category: 'Protect' },
      { id: 'nist-dp', label: 'Data Protection', category: 'Protect' },
      { id: 'nist-train', label: 'Training', category: 'Protect' },
      { id: 'nist-cm', label: 'Cont. Monitoring', category: 'Detect' },
      { id: 'nist-anom', label: 'Anomaly Detection', category: 'Detect' },
      { id: 'nist-irp', label: 'IR Plan', category: 'Respond' },
      { id: 'nist-comm', label: 'IR Comms', category: 'Respond' },
      { id: 'nist-rec', label: 'Recovery Plan', category: 'Recover' },
      { id: 'nist-imp', label: 'Improvements', category: 'Recover' },
      // Sub-controls
      { id: 'nist-config', label: 'Config Mgmt', category: 'Protect' },
      { id: 'nist-media', label: 'Media Protection', category: 'Protect' },
      { id: 'nist-maint', label: 'Maintenance', category: 'Protect' },
      { id: 'nist-si', label: 'System Integrity', category: 'Detect' },
      { id: 'nist-ic', label: 'Incident Contain', category: 'Respond' },
      { id: 'nist-rtest', label: 'Recovery Testing', category: 'Recover' },
    ],
  },
  {
    id: 'hipaa',
    label: 'HIPAA',
    angle: 154.3,
    controls: [
      { id: 'hip-risk', label: 'Risk Analysis', category: 'Admin' },
      { id: 'hip-sec', label: 'Security Mgmt', category: 'Admin' },
      { id: 'hip-train', label: 'Workforce Train', category: 'Admin' },
      { id: 'hip-inc', label: 'Incident Procs', category: 'Admin' },
      { id: 'hip-fac', label: 'Facility Access', category: 'Physical' },
      { id: 'hip-ws', label: 'Workstation Sec', category: 'Physical' },
      { id: 'hip-ac', label: 'Access Control', category: 'Technical' },
      { id: 'hip-audit', label: 'Audit Controls', category: 'Technical' },
      { id: 'hip-int', label: 'Integrity', category: 'Technical' },
      { id: 'hip-tx', label: 'Transmission Sec', category: 'Technical' },
      // Sub-controls
      { id: 'hip-baa', label: 'BAA Mgmt', category: 'Admin' },
      { id: 'hip-cont', label: 'Contingency Plan', category: 'Admin' },
      { id: 'hip-eval', label: 'Evaluation', category: 'Admin' },
      { id: 'hip-auth', label: 'Authentication', category: 'Technical' },
      { id: 'hip-devmgmt', label: 'Device & Media', category: 'Physical' },
      { id: 'hip-sanc', label: 'Sanctions', category: 'Admin' },
      { id: 'hip-clear', label: 'Clearance Proc', category: 'Admin' },
      { id: 'hip-phi', label: 'PHI Safeguards', category: 'Technical' },
      { id: 'hip-emr', label: 'ePHI Controls', category: 'Technical' },
      { id: 'hip-breach', label: 'Breach Notify', category: 'Admin' },
    ],
  },
  {
    id: 'gdpr',
    label: 'GDPR',
    angle: 205.7,
    controls: [
      { id: 'gdpr-acc', label: 'Accountability', category: 'Governance' },
      { id: 'gdpr-priv', label: 'Privacy Govt', category: 'Governance' },
      { id: 'gdpr-rec', label: 'Processing Records', category: 'Data' },
      { id: 'gdpr-min', label: 'Data Minimization', category: 'Data' },
      { id: 'gdpr-dsr', label: 'Subject Requests', category: 'Rights' },
      { id: 'gdpr-consent', label: 'Consent Mgmt', category: 'Rights' },
      { id: 'gdpr-breach', label: 'Breach Detection', category: 'Breach' },
      { id: 'gdpr-notify', label: 'Notification', category: 'Breach' },
      { id: 'gdpr-vendor', label: 'Vendor DPA', category: 'Vendor' },
      { id: 'gdpr-xborder', label: 'Cross-Border', category: 'Vendor' },
      // Sub-controls
      { id: 'gdpr-dpia', label: 'DPIA', category: 'Governance' },
      { id: 'gdpr-dpo', label: 'DPO Appoint', category: 'Governance' },
      { id: 'gdpr-portab', label: 'Data Portability', category: 'Rights' },
      { id: 'gdpr-erasure', label: 'Right to Erasure', category: 'Rights' },
      { id: 'gdpr-prof', label: 'Profiling', category: 'Rights' },
      { id: 'gdpr-child', label: 'Child Data', category: 'Data' },
      { id: 'gdpr-scc', label: 'SCC/BCR', category: 'Vendor' },
      { id: 'gdpr-rep', label: 'Representative', category: 'Governance' },
      { id: 'gdpr-impact', label: 'Impact Review', category: 'Governance' },
    ],
  },
  {
    id: 'pci',
    label: 'PCI DSS',
    angle: 257.1,
    controls: [
      { id: 'pci-net', label: 'Network Security', category: 'Network' },
      { id: 'pci-config', label: 'Secure Config', category: 'Network' },
      { id: 'pci-store', label: 'Store Protection', category: 'Data' },
      { id: 'pci-tx', label: 'Encrypt Transit', category: 'Data' },
      { id: 'pci-malware', label: 'Malware Protect', category: 'Vuln' },
      { id: 'pci-dev', label: 'Secure Dev', category: 'Vuln' },
      { id: 'pci-ac', label: 'Access Control', category: 'Policy' },
      { id: 'pci-auth', label: 'Authentication', category: 'Policy' },
      { id: 'pci-log', label: 'Log & Monitor', category: 'Monitor' },
      { id: 'pci-test', label: 'Security Testing', category: 'Monitor' },
      { id: 'pci-policy', label: 'Security Policy', category: 'Policy' },
      // Sub-controls
      { id: 'pci-fw', label: 'Firewall Rules', category: 'Network' },
      { id: 'pci-seg', label: 'Segmentation', category: 'Network' },
      { id: 'pci-key', label: 'Key Management', category: 'Data' },
      { id: 'pci-mask', label: 'Data Masking', category: 'Data' },
      { id: 'pci-scan', label: 'Vuln Scanning', category: 'Vuln' },
      { id: 'pci-patch', label: 'Patch Mgmt', category: 'Vuln' },
      { id: 'pci-mfa', label: 'MFA', category: 'Policy' },
      { id: 'pci-siem', label: 'SIEM', category: 'Monitor' },
    ],
  },
  {
    id: 'cis',
    label: 'CIS Controls',
    angle: 308.6,
    controls: [
      { id: 'cis-hw', label: 'HW Inventory', category: 'Inventory' },
      { id: 'cis-sw', label: 'SW Inventory', category: 'Inventory' },
      { id: 'cis-dp', label: 'Data Protection', category: 'Protect' },
      { id: 'cis-config', label: 'Secure Config', category: 'Protect' },
      { id: 'cis-acct', label: 'Account Mgmt', category: 'Protect' },
      { id: 'cis-acl', label: 'Access Control', category: 'Protect' },
      { id: 'cis-vuln', label: 'Vuln Management', category: 'Detect' },
      { id: 'cis-audit', label: 'Audit Logs', category: 'Detect' },
      { id: 'cis-email', label: 'Email/Web Prot', category: 'Detect' },
      { id: 'cis-mal', label: 'Malware Defense', category: 'Detect' },
      { id: 'cis-recov', label: 'Data Recovery', category: 'Respond' },
      { id: 'cis-netmgmt', label: 'Network Infra', category: 'Protect' },
      { id: 'cis-netmon', label: 'Network Monitor', category: 'Detect' },
      { id: 'cis-train', label: 'Security Training', category: 'Respond' },
      { id: 'cis-vendor', label: 'Service Providers', category: 'Respond' },
      { id: 'cis-appsec', label: 'App Security', category: 'Protect' },
      { id: 'cis-ir', label: 'Incident Response', category: 'Respond' },
      { id: 'cis-pen', label: 'Pen Testing', category: 'Respond' },
      // Sub-controls
      { id: 'cis-priv', label: 'Privilege Mgmt', category: 'Protect' },
      { id: 'cis-wireless', label: 'Wireless Sec', category: 'Protect' },
      { id: 'cis-boundary', label: 'Boundary Defense', category: 'Detect' },
      { id: 'cis-backup', label: 'Backup Mgmt', category: 'Respond' },
    ],
  },
];

const TOTAL_CONTROLS = FRAMEWORKS.reduce(
  (sum, fw) => sum + fw.controls.length,
  0,
);

/* ── Cross-framework shared control edges ─────────────────── */

const CROSS_EDGES: MapEdge[] = [
  // Access control linkages
  { from: 'iso-ac', to: 'soc-iam' },
  { from: 'iso-ac', to: 'nist-ac' },
  { from: 'iso-ac', to: 'hip-ac' },
  { from: 'iso-ac', to: 'pci-ac' },
  { from: 'iso-ac', to: 'cis-acl' },
  // Encryption linkages
  { from: 'iso-crypto', to: 'soc-enc' },
  { from: 'iso-crypto', to: 'nist-dp' },
  { from: 'iso-crypto', to: 'hip-tx' },
  { from: 'iso-crypto', to: 'pci-tx' },
  // Incident response linkages
  { from: 'iso-inc', to: 'soc-incr' },
  { from: 'iso-inc', to: 'nist-irp' },
  { from: 'iso-inc', to: 'hip-inc' },
  { from: 'iso-inc', to: 'cis-ir' },
  // Risk assessment linkages
  { from: 'iso-risk', to: 'nist-ra' },
  { from: 'iso-risk', to: 'hip-risk' },
  { from: 'iso-risk', to: 'soc-gov' },
  // Monitoring
  { from: 'iso-log', to: 'soc-mon' },
  { from: 'iso-log', to: 'nist-cm' },
  { from: 'iso-log', to: 'pci-log' },
  { from: 'iso-log', to: 'cis-audit' },
  // Training
  { from: 'iso-aware', to: 'nist-train' },
  { from: 'iso-aware', to: 'hip-train' },
  { from: 'iso-aware', to: 'soc-train' },
  { from: 'iso-aware', to: 'cis-train' },
  // Vendor
  { from: 'iso-sup', to: 'gdpr-vendor' },
  { from: 'iso-sup', to: 'soc-vendor' },
  { from: 'iso-sup', to: 'nist-supply' },
  { from: 'iso-sup', to: 'cis-vendor' },
  // Business continuity
  { from: 'iso-bc', to: 'soc-bcp' },
  { from: 'iso-bc', to: 'nist-rec' },
  { from: 'iso-bc', to: 'hip-cont' },
  // Data protection cross-links
  { from: 'gdpr-min', to: 'soc-class' },
  { from: 'gdpr-min', to: 'nist-dp' },
  { from: 'gdpr-breach', to: 'hip-breach' },
  { from: 'pci-malware', to: 'cis-mal' },
  { from: 'pci-dev', to: 'cis-appsec' },
  { from: 'pci-config', to: 'cis-config' },
  { from: 'pci-net', to: 'cis-netmgmt' },
  { from: 'nist-anom', to: 'cis-netmon' },
  { from: 'nist-anom', to: 'soc-mon' },
  { from: 'soc-dr', to: 'hip-cont' },
  { from: 'soc-dr', to: 'nist-rec' },
  // Change management
  { from: 'iso-change', to: 'soc-chg' },
  // Privacy
  { from: 'gdpr-dsr', to: 'soc-rights' },
  { from: 'gdpr-consent', to: 'soc-priv' },
];

/* ── Layout: radial galaxy layout ─────────────────────────── */

function buildGalaxy(
  w: number,
  h: number,
): { nodes: MapNode[]; edges: MapEdge[] } {
  const cx = w / 2;
  const cy = h / 2;

  // Use elliptical radii to fill the full canvas (not just min dimension)
  const rx = w * 0.42; // horizontal radius
  const ry = h * 0.4; // vertical radius

  const fwRx = rx * 0.38; // framework hub ellipse — horizontal
  const fwRy = ry * 0.36; // framework hub ellipse — vertical

  // Three concentric control rings (elliptical)
  const ring1Rx = rx * 0.58,
    ring1Ry = ry * 0.56;
  const ring2Rx = rx * 0.76,
    ring2Ry = ry * 0.74;
  const ring3Rx = rx * 0.94,
    ring3Ry = ry * 0.92;

  const nodes: MapNode[] = [];
  const edges: MapEdge[] = [];

  for (const fw of FRAMEWORKS) {
    const fwAngle = (fw.angle * Math.PI) / 180;
    const fwX = cx + Math.cos(fwAngle) * fwRx;
    const fwY = cy + Math.sin(fwAngle) * fwRy;

    // Framework hub node
    nodes.push({
      id: fw.id,
      label: fw.label,
      type: 'framework',
      framework: fw.id,
      category: 'framework',
      x: fwX,
      y: fwY,
      baseX: fwX,
      baseY: fwY,
      size: Math.max(14, Math.min(rx, ry) * 0.044),
      phase: fw.angle * 0.01,
      ring: 0,
    });

    // Spread controls in an arc centered on framework angle
    const controlCount = fw.controls.length;
    const arcSpan = ((2 * Math.PI) / FRAMEWORKS.length) * 0.88;
    const arcStart = fwAngle - arcSpan / 2;

    fw.controls.forEach((ctrl, i) => {
      const t = controlCount > 1 ? i / (controlCount - 1) : 0.5;
      const angle = arcStart + t * arcSpan;

      // Distribute across 3 concentric elliptical rings
      const ringIdx = i % 3;
      let ringRx: number, ringRy: number;
      if (ringIdx === 0) {
        ringRx = ring1Rx;
        ringRy = ring1Ry;
      } else if (ringIdx === 1) {
        ringRx = ring2Rx;
        ringRy = ring2Ry;
      } else {
        ringRx = ring3Rx;
        ringRy = ring3Ry;
      }

      // Add subtle radial jitter (±6%)
      const jitter = 1 + Math.sin(i * 7.3 + fw.angle) * 0.06;
      const ctrlX = cx + Math.cos(angle) * ringRx * jitter;
      const ctrlY = cy + Math.sin(angle) * ringRy * jitter;

      nodes.push({
        id: ctrl.id,
        label: ctrl.label,
        type: 'control',
        framework: fw.id,
        category: ctrl.category,
        x: ctrlX,
        y: ctrlY,
        baseX: ctrlX,
        baseY: ctrlY,
        size: Math.max(5, Math.min(rx, ry) * 0.018),
        phase: angle + i * 0.3,
        ring: ringIdx === 0 ? 1 : ringIdx === 1 ? 2 : 1,
      });

      // Edge from framework hub → control
      edges.push({ from: fw.id, to: ctrl.id });
    });
  }

  // Add cross-framework edges
  const nodeIds = new Set(nodes.map((n) => n.id));
  for (const ce of CROSS_EDGES) {
    if (nodeIds.has(ce.from) && nodeIds.has(ce.to)) {
      edges.push(ce);
    }
  }

  return { nodes, edges };
}

/* ── Bezier helpers ────────────────────────────────────────── */

function quadCP(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  cx: number,
  cy: number,
  pull: number,
) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  return { cpx: mx + (cx - mx) * pull, cpy: my + (cy - my) * pull };
}

function quadPt(
  t: number,
  x1: number,
  y1: number,
  cpx: number,
  cpy: number,
  x2: number,
  y2: number,
) {
  const u = 1 - t;
  return {
    x: u * u * x1 + 2 * u * t * cpx + t * t * x2,
    y: u * u * y1 + 2 * u * t * cpy + t * t * y2,
  };
}

/* ── Ambient particles ─────────────────────────────────────── */

function createParticles(w: number, h: number, n: number): AmbientParticle[] {
  return Array.from({ length: n }, (_, i) => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.12,
    vy: (Math.random() - 0.5) * 0.1,
    size: 0.4 + Math.random() * 1.0,
    alpha: 0.06 + Math.random() * 0.16,
    phase: Math.random() * Math.PI * 2,
  }));
}

/* ── Exported stats ────────────────────────────────────────── */

export const CONTROL_MAP_STATS = {
  frameworks: FRAMEWORKS.length,
  controls: TOTAL_CONTROLS,
  totalNodes: FRAMEWORKS.length + TOTAL_CONTROLS,
  crossEdges: CROSS_EDGES.length,
};

/* ═══════════════════════════════════════════════════════════════
   CANVAS RENDERER
   ═══════════════════════════════════════════════════════════════ */

interface FullControlMapVizProps {
  className?: string;
}

function FullControlMapVizInner({ className = '' }: FullControlMapVizProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [isInView, setIsInView] = useState(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const dataRef = useRef<ReturnType<typeof buildGalaxy> | null>(null);
  const particlesRef = useRef<AmbientParticle[]>([]);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const sizeRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { rootMargin: '300px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      setMousePos({
        x:
          (e.clientX - rect.left) *
          (canvas.width / rect.width / (window.devicePixelRatio || 1)),
        y:
          (e.clientY - rect.top) *
          (canvas.height / rect.height / (window.devicePixelRatio || 1)),
      });
    },
    [],
  );

  const clearPointer = useCallback(() => setMousePos(null), []);

  /* ── Main animation loop ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !isInView) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (
      !dataRef.current ||
      Math.abs(sizeRef.current.width - w) > 15 ||
      Math.abs(sizeRef.current.height - h) > 15
    ) {
      dataRef.current = buildGalaxy(w, h);
      particlesRef.current = createParticles(w, h, w < 640 ? 40 : 90);
    }
    sizeRef.current = { width: w, height: h };

    const { nodes, edges } = dataRef.current;
    const particles = particlesRef.current;
    const centerX = w / 2;
    const centerY = h / 2;
    const unit = Math.min(w, h);

    let lastFrame = 0;
    const FPS = 30;
    const interval = 1000 / FPS;

    const findNearestNode = (mx: number, my: number): MapNode | null => {
      let best: MapNode | null = null;
      let bestDist = 60;
      for (const node of nodes) {
        const dist = Math.hypot(node.x - mx, node.y - my);
        if (dist < bestDist) {
          bestDist = dist;
          best = node;
        }
      }
      return best;
    };

    const animate = (timestamp: number) => {
      animRef.current = requestAnimationFrame(animate);
      if (timestamp - lastFrame < interval) return;
      lastFrame = timestamp;
      timeRef.current += 16;
      const t = timeRef.current;
      const tSec = t * 0.001;

      ctx.clearRect(0, 0, w, h);

      /* ── Layer 1: Multi-halo atmosphere ── */
      const atmoR = Math.max(w, h) * 0.52;
      const halo = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        atmoR,
      );
      halo.addColorStop(0, 'rgba(20,184,166,0.08)');
      halo.addColorStop(0.25, 'rgba(56,189,248,0.05)');
      halo.addColorStop(0.5, 'rgba(99,102,241,0.03)');
      halo.addColorStop(1, 'rgba(3,7,18,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, w, h);

      /* ── Layer 2: Ambient particles ── */
      for (const p of particles) {
        if (!shouldReduceMotion) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x = w;
          if (p.x > w) p.x = 0;
          if (p.y < 0) p.y = h;
          if (p.y > h) p.y = 0;
        }
        const pa = p.alpha * (0.5 + 0.5 * Math.sin(tSec * 0.4 + p.phase));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(148,163,184,${pa})`;
        ctx.fill();
      }

      /* ── Layer 3: Concentric orbit rings (elliptical) ── */
      const orbitCounts = 6;
      ctx.save();
      for (let i = 0; i < orbitCounts; i++) {
        const frac = 0.12 + i * 0.14;
        const orx = w * 0.42 * frac;
        const ory = h * 0.4 * frac;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, orx, ory, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(148,163,184,${0.04 - i * 0.004})`;
        ctx.lineWidth = 0.6;
        ctx.setLineDash([3, 14 + i * 3]);
        ctx.lineDashOffset = shouldReduceMotion
          ? 0
          : tSec * (5 + i * 1.5) * (i % 2 === 0 ? 1 : -1);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();

      /* ── Layer 4: Radar sweep (elliptical) ── */
      if (!shouldReduceMotion) {
        const ang = tSec * 0.2;
        const sx = centerX + Math.cos(ang) * w * 0.42;
        const sy = centerY + Math.sin(ang) * h * 0.4;
        const sg = ctx.createLinearGradient(centerX, centerY, sx, sy);
        sg.addColorStop(0, 'rgba(20,184,166,0)');
        sg.addColorStop(0.6, 'rgba(20,184,166,0.025)');
        sg.addColorStop(1, 'rgba(20,184,166,0)');
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = sg;
        ctx.lineWidth = Math.min(w, h) * 0.15;
        ctx.stroke();
      }

      /* ── Breathing movement ── */
      if (!shouldReduceMotion) {
        for (const node of nodes) {
          const amp = node.type === 'framework' ? 2 : 1.5;
          node.x = node.baseX + Math.sin(tSec * 0.7 + node.phase) * amp;
          node.y = node.baseY + Math.cos(tSec * 0.55 + node.phase * 1.2) * amp;
        }
      }

      /* ── Hover detection ── */
      const hoveredNode = mousePos
        ? findNearestNode(mousePos.x, mousePos.y)
        : null;
      const connectedIds = new Set<string>();
      const connectedEdges = new Set<number>();
      if (hoveredNode) {
        connectedIds.add(hoveredNode.id);
        // 2-degree connections for frameworks
        const isFramework = hoveredNode.type === 'framework';
        edges.forEach((edge, idx) => {
          if (edge.from === hoveredNode.id || edge.to === hoveredNode.id) {
            connectedIds.add(edge.from);
            connectedIds.add(edge.to);
            connectedEdges.add(idx);
          }
        });
        if (isFramework) {
          // Second degree: also highlight cross-framework links from connected controls
          const firstDeg = new Set(connectedIds);
          edges.forEach((edge, idx) => {
            if (firstDeg.has(edge.from) || firstDeg.has(edge.to)) {
              connectedIds.add(edge.from);
              connectedIds.add(edge.to);
              connectedEdges.add(idx);
            }
          });
        }
      }

      /* ── Layer 5 & 6: Edges + data packets ── */
      edges.forEach((edge, idx) => {
        const fromN = nodes.find((n) => n.id === edge.from);
        const toN = nodes.find((n) => n.id === edge.to);
        if (!fromN || !toN) return;

        const isHL = hoveredNode != null && connectedEdges.has(idx);
        const isDim = hoveredNode != null && !isHL;
        const isCross = fromN.framework !== toN.framework;

        // Edge path (bezier curved toward center)
        const pull = isCross ? 0.25 : 0.12;
        const cp = quadCP(
          fromN.x,
          fromN.y,
          toN.x,
          toN.y,
          centerX,
          centerY,
          pull,
        );
        ctx.beginPath();
        ctx.moveTo(fromN.x, fromN.y);
        ctx.quadraticCurveTo(cp.cpx, cp.cpy, toN.x, toN.y);

        if (isHL) {
          const eg = ctx.createLinearGradient(fromN.x, fromN.y, toN.x, toN.y);
          const fc = getNodeColors(fromN);
          const tc = getNodeColors(toN);
          eg.addColorStop(0, fc.ring);
          eg.addColorStop(1, tc.ring);
          ctx.strokeStyle = eg;
          ctx.lineWidth = isCross ? 2 : 1.5;
        } else {
          const alpha = isDim ? 0.015 : isCross ? 0.06 : 0.05;
          ctx.strokeStyle = `rgba(148,163,184,${alpha})`;
          ctx.lineWidth = isDim ? 0.3 : isCross ? 0.7 : 0.5;
        }
        ctx.stroke();

        // Data packets
        if (!shouldReduceMotion && !isDim) {
          const pCount = isHL ? 2 : idx % 4 === 0 ? 1 : 0; // Only some idle edges get packets
          if (pCount === 0) return;
          const colors = getNodeColors(fromN);
          for (let p = 0; p < pCount; p++) {
            const phase = (tSec * 0.35 + fromN.phase + p * 0.5) % 1;
            const pos = quadPt(
              phase,
              fromN.x,
              fromN.y,
              cp.cpx,
              cp.cpy,
              toN.x,
              toN.y,
            );
            const sz = isHL ? 3 : 1.8;
            const al = isHL ? 0.7 : 0.2;

            // Glow
            const pg = ctx.createRadialGradient(
              pos.x,
              pos.y,
              0,
              pos.x,
              pos.y,
              sz * 3,
            );
            pg.addColorStop(
              0,
              colors.fill.replace(/[\d.]+\)$/, `${al * 0.5})`),
            );
            pg.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = pg;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, sz * 3, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, sz, 0, Math.PI * 2);
            ctx.fillStyle = colors.fill.replace(/[\d.]+\)$/, `${al})`);
            ctx.fill();

            // Trail
            if (isHL) {
              for (let tr = 1; tr <= 4; tr++) {
                const trT = Math.max(0, phase - tr * 0.018);
                const trP = quadPt(
                  trT,
                  fromN.x,
                  fromN.y,
                  cp.cpx,
                  cp.cpy,
                  toN.x,
                  toN.y,
                );
                ctx.beginPath();
                ctx.arc(trP.x, trP.y, sz * (1 - tr * 0.18), 0, Math.PI * 2);
                ctx.fillStyle = colors.fill.replace(
                  /[\d.]+\)$/,
                  `${al * (1 - tr * 0.22)})`,
                );
                ctx.fill();
              }
            }
          }
        }
      });

      /* ── Hover ripple ── */
      if (hoveredNode && !shouldReduceMotion) {
        const rp = (tSec * 1.8) % 1;
        const rr = hoveredNode.size * (2 + rp * 4);
        const ra = (1 - rp) * 0.2;
        const rc = getNodeColors(hoveredNode);
        ctx.beginPath();
        ctx.arc(hoveredNode.x, hoveredNode.y, rr, 0, Math.PI * 2);
        ctx.strokeStyle = rc.ring.replace(/[\d.]+\)$/, `${ra})`);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      /* ── Layer 7: Nodes ── */
      for (const node of nodes) {
        const colors = getNodeColors(node);
        const isHovered = hoveredNode?.id === node.id;
        const isConnected = connectedIds.has(node.id);
        const isDimmed = hoveredNode != null && !isConnected;
        const isFW = node.type === 'framework';

        const alpha = isDimmed ? 0.08 : TYPE_ALPHA[node.type];
        const scale = isHovered ? 1.5 : isConnected ? 1.2 : 1;
        const ns = node.size * scale;

        // Glow halo
        if (!isDimmed) {
          const haloR = ns * (isFW ? 3 : isHovered ? 3.5 : 2);
          const pulse = shouldReduceMotion
            ? 1
            : 0.85 + 0.15 * Math.sin(tSec * 1.2 + node.phase);
          const hg = ctx.createRadialGradient(
            node.x,
            node.y,
            ns * 0.3,
            node.x,
            node.y,
            haloR * pulse,
          );
          hg.addColorStop(
            0,
            colors.glow.replace(
              /[\d.]+\)$/,
              `${isHovered ? 0.35 : isFW ? 0.15 : 0.08})`,
            ),
          );
          hg.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = hg;
          ctx.beginPath();
          ctx.arc(node.x, node.y, haloR * pulse, 0, Math.PI * 2);
          ctx.fill();
        }

        // Outer dashed ring (frameworks + hovered)
        if ((isFW || isHovered) && !isDimmed && !shouldReduceMotion) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(node.x, node.y, ns + 4, 0, Math.PI * 2);
          ctx.strokeStyle = colors.ring.replace(
            /[\d.]+\)$/,
            `${isHovered ? 0.6 : 0.25})`,
          );
          ctx.lineWidth = 0.8;
          ctx.setLineDash([2.5, 4]);
          ctx.lineDashOffset = tSec * 6 * (node.phase > 2 ? -1 : 1);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }

        // Fill
        const fg = ctx.createRadialGradient(
          node.x - ns * 0.15,
          node.y - ns * 0.15,
          0,
          node.x,
          node.y,
          ns,
        );
        fg.addColorStop(
          0,
          colors.fill.replace(/[\d.]+\)$/, `${alpha * 0.95})`),
        );
        fg.addColorStop(1, colors.fill.replace(/[\d.]+\)$/, `${alpha * 0.6})`));
        ctx.beginPath();
        ctx.arc(node.x, node.y, ns, 0, Math.PI * 2);
        ctx.fillStyle = fg;
        ctx.fill();

        // Border
        ctx.strokeStyle = colors.ring.replace(/[\d.]+\)$/, `${alpha * 0.5})`);
        ctx.lineWidth = isHovered ? 1.5 : 0.8;
        ctx.stroke();

        // Icon
        if (isFW || isHovered || ns > 8) {
          ctx.fillStyle = `rgba(255,255,255,${alpha * 0.9})`;
          ctx.font = `${isHovered ? '600 ' : '500 '}${Math.round(ns * 0.7)}px system-ui, -apple-system, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(TYPE_ICONS[node.type], node.x, node.y + 0.5);
        }

        // Label
        if (isHovered || (isFW && !isDimmed)) {
          const la = isHovered ? 0.95 : 0.6;
          const lfs = isFW ? (w < 640 ? 10 : 13) : w < 640 ? 9 : 11;
          ctx.fillStyle = colors.label.replace(/[\d.]+\)$/, `${la})`);
          ctx.font = `${isHovered ? '600 ' : '400 '}${lfs}px system-ui, -apple-system, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(node.label, node.x, node.y + ns + (isFW ? 18 : 14));
          if (isHovered && !isFW) {
            ctx.fillStyle = `rgba(148,163,184,0.5)`;
            ctx.font = `400 ${lfs - 2}px system-ui, -apple-system, sans-serif`;
            ctx.fillText(node.category, node.x, node.y + ns + (isFW ? 32 : 26));
          }
        }
      }

      /* ── HUD: Corner brackets ── */
      const bs = 18;
      const bi = 6;
      ctx.strokeStyle = 'rgba(148,163,184,0.10)';
      ctx.lineWidth = 1;
      [
        [bi, bi + bs, bi, bi, bi + bs, bi],
        [w - bi - bs, bi, w - bi, bi, w - bi, bi + bs],
        [bi, h - bi - bs, bi, h - bi, bi + bs, h - bi],
        [w - bi - bs, h - bi, w - bi, h - bi, w - bi, h - bi - bs],
      ].forEach(([ax, ay, bx, by, ex, ey]) => {
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      });

      /* ── HUD: Framework angle ticks (elliptical) ── */
      FRAMEWORKS.forEach((fw) => {
        const a = (fw.angle * Math.PI) / 180;
        const trx = w * 0.42;
        const tryy = h * 0.4;
        ctx.beginPath();
        ctx.moveTo(
          centerX + Math.cos(a) * trx * 0.96,
          centerY + Math.sin(a) * tryy * 0.96,
        );
        ctx.lineTo(
          centerX + Math.cos(a) * trx * 1.0,
          centerY + Math.sin(a) * tryy * 1.0,
        );
        ctx.strokeStyle = 'rgba(148,163,184,0.08)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [isInView, shouldReduceMotion, mousePos]);

  useEffect(() => {
    const hr = () => {
      dataRef.current = null;
    };
    window.addEventListener('resize', hr);
    return () => window.removeEventListener('resize', hr);
  }, []);

  if (shouldReduceMotion) {
    return (
      <div ref={containerRef} className={`relative ${className}`}>
        <div className="flex items-center justify-center h-full text-gray-500 text-sm">
          Full compliance control map ({CONTROL_MAP_STATS.totalNodes} nodes —
          motion reduced)
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={clearPointer}
        onPointerUp={clearPointer}
        onPointerCancel={clearPointer}
        className="h-full w-full cursor-default md:cursor-crosshair"
      />
    </div>
  );
}

export const FullControlMapViz = memo(FullControlMapVizInner);
export default FullControlMapViz;
