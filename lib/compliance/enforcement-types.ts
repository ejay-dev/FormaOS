// lib/compliance/enforcement-types.ts
export type GateKey =
  | "AUDIT_EXPORT"
  | "CERT_REPORT"
  | "FRAMEWORK_ISO27001"
  | "FRAMEWORK_SOC2"
  | "FRAMEWORK_HIPAA"
  | "FRAMEWORK_NDIS";

export type ComplianceBlock = {
  id: string;
  gate_key: string;
  reason: string;
  metadata: unknown;
};

export class ComplianceBlockedError extends Error {
  gate: GateKey;
  blocks: ComplianceBlock[];

  constructor(gate: GateKey, blocks: ComplianceBlock[]) {
    super(`Compliance gate blocked: ${gate}`);
    this.name = "ComplianceBlockedError";
    this.gate = gate;
    this.blocks = blocks;
  }
}