/**
 * FormaOS Security Module - Organization Validators
 * 
 * Validation utilities for organization-related inputs.
 * Prevents injection attacks and ensures data integrity.
 * 
 * Note: Uses simple validation without Zod to avoid additional dependencies.
 */

/**
 * Organization name validation regex
 * - Minimum 2 characters
 * - Maximum 100 characters
 * - Allows alphanumeric, spaces, hyphens, apostrophes, and periods
 * - Must start and end with alphanumeric
 */
const ORGANIZATION_NAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9\s\-'.]*[a-zA-Z0-9]$/;

/**
 * Validate organization name
 */
export function validateOrganizationName(
  name: string
): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: "Organization name is required" };
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length < 2) {
    return { valid: false, error: "Organization name must be at least 2 characters" };
  }
  
  if (trimmed.length > 100) {
    return { valid: false, error: "Organization name must be less than 100 characters" };
  }
  
  if (!ORGANIZATION_NAME_REGEX.test(trimmed)) {
    return { valid: false, error: "Organization name must start and end with alphanumeric characters" };
  }
  
  if (trimmed !== name.trim()) {
    return { valid: false, error: "Organization name cannot have leading/trailing whitespace" };
  }
  
  return { valid: true };
}

/**
 * Sanitize organization name
 */
export function sanitizeOrganizationName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, " ") // Normalize multiple spaces
    .replace(/-+/g, "-") // Normalize multiple hyphens
    .replace(/'+/g, "'") // Normalize multiple apostrophes
    .replace(/^\-+|\-+$/g, "") // Remove leading/trailing hyphens
    .replace(/^'+|'+$/g, ""); // Remove leading/trailing apostrophes
}

/**
 * Industry options matching the onboarding page
 */
export const INDUSTRY_OPTIONS = [
  { id: "ndis", label: "NDIS / Disability Services" },
  { id: "healthcare", label: "Healthcare & Allied Health" },
  { id: "aged_care", label: "Aged Care" },
  { id: "childcare", label: "Childcare / Early Learning" },
  { id: "community_services", label: "Community Services" },
  { id: "other", label: "Other regulated services" },
] as const;

/**
 * Team size options
 */
export const TEAM_SIZE_OPTIONS = [
  { id: "1-10", label: "1-10" },
  { id: "11-50", label: "11-50" },
  { id: "51-200", label: "51-200" },
  { id: "200+", label: "200+" },
] as const;

/**
 * Framework options
 */
export const FRAMEWORK_OPTIONS = [
  { id: "ndis", label: "NDIS Practice Standards" },
  { id: "hipaa", label: "HIPAA-style healthcare controls" },
  { id: "soc2", label: "SOC 2" },
  { id: "iso27001", label: "ISO 27001" },
  { id: "aged_care", label: "Aged Care Quality Standards" },
  { id: "custom", label: "Custom / internal framework" },
] as const;

/**
 * Plan options
 */
export const PLAN_OPTIONS = [
  { id: "basic", label: "Starter" },
  { id: "pro", label: "Pro" },
  { id: "enterprise", label: "Enterprise" },
] as const;

/**
 * Validate industry selection
 */
export function validateIndustry(industry: string): { valid: boolean; error?: string } {
  const validIds = INDUSTRY_OPTIONS.map((i) => i.id);
  if (!validIds.includes(industry)) {
    return { valid: false, error: "Please select a valid industry" };
  }
  return { valid: true };
}

/**
 * Validate team size selection
 */
export function validateTeamSize(teamSize: string): { valid: boolean; error?: string } {
  const validIds = TEAM_SIZE_OPTIONS.map((t) => t.id);
  if (!validIds.includes(teamSize)) {
    return { valid: false, error: "Please select a valid team size" };
  }
  return { valid: true };
}

/**
 * Validate plan selection
 */
export function validatePlan(plan: string): { valid: boolean; error?: string } {
  const validIds = PLAN_OPTIONS.map((p) => p.id);
  if (!validIds.includes(plan)) {
    return { valid: false, error: "Please select a valid plan" };
  }
  return { valid: true };
}

/**
 * Validate framework selections
 */
export function validateFrameworks(frameworks: string[]): { valid: boolean; error?: string } {
  if (frameworks.length === 0) {
    return { valid: false, error: "Please select at least one framework" };
  }
  
  const validIds = FRAMEWORK_OPTIONS.map((f) => f.id);
  const invalidFrameworks = frameworks.filter((f) => !validIds.includes(f));
  
  if (invalidFrameworks.length > 0) {
    return { valid: false, error: "Invalid framework selection" };
  }
  
  return { valid: true };
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Parse invite emails from textarea input
 */
export function parseInviteEmails(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(/[,\n]/g)
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 3 && item.includes("@"));
}

/**
 * Validate list of invite emails
 */
export function validateInviteEmails(emails: string[]): {
  valid: boolean;
  validEmails: string[];
  invalidEmails: string[];
} {
  const validEmails: string[] = [];
  const invalidEmails: string[] = [];
  
  for (const email of emails) {
    if (isValidEmail(email)) {
      validEmails.push(email);
    } else {
      invalidEmails.push(email);
    }
  }
  
  return {
    valid: invalidEmails.length === 0,
    validEmails,
    invalidEmails,
  };
}

/**
 * Onboarding form data interface
 */
export interface OnboardingFormData {
  organizationName: string;
  industry: string;
  teamSize: string;
  plan: string;
  frameworks: string[];
  inviteEmails: string;
}

/**
 * Validate onboarding form data
 */
export function validateOnboardingForm(formData: FormData): {
  valid: boolean;
  data?: OnboardingFormData;
  errors?: Record<string, string>;
} {
  const data: OnboardingFormData = {
    organizationName: formData.get("organizationName") as string,
    industry: formData.get("industry") as string,
    teamSize: formData.get("teamSize") as string,
    plan: formData.get("plan") as string,
    frameworks: formData.getAll("frameworks").map(String),
    inviteEmails: formData.get("inviteEmails") as string,
  };
  
  const errors: Record<string, string> = {};
  
  // Validate organization name
  const nameValidation = validateOrganizationName(data.organizationName);
  if (!nameValidation.valid) {
    errors.organizationName = nameValidation.error!;
  }
  
  // Validate industry
  const industryValidation = validateIndustry(data.industry);
  if (!industryValidation.valid) {
    errors.industry = industryValidation.error!;
  }
  
  // Validate team size
  const teamSizeValidation = validateTeamSize(data.teamSize);
  if (!teamSizeValidation.valid) {
    errors.teamSize = teamSizeValidation.error!;
  }
  
  // Validate plan
  const planValidation = validatePlan(data.plan);
  if (!planValidation.valid) {
    errors.plan = planValidation.error!;
  }
  
  // Validate frameworks
  const frameworkValidation = validateFrameworks(data.frameworks);
  if (!frameworkValidation.valid) {
    errors.frameworks = frameworkValidation.error!;
  }
  
  // Validate invite emails if provided
  if (data.inviteEmails) {
    const emails = parseInviteEmails(data.inviteEmails);
    const emailValidation = validateInviteEmails(emails);
    if (emailValidation.invalidEmails.length > 0) {
      errors.inviteEmails = `Invalid emails: ${emailValidation.invalidEmails.join(", ")}`;
    }
  }
  
  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }
  
  return { valid: true, data };
}

/**
 * Sanitize complete onboarding form data
 */
export function sanitizeOnboardingData(data: OnboardingFormData): OnboardingFormData {
  return {
    organizationName: sanitizeOrganizationName(data.organizationName),
    industry: data.industry,
    teamSize: data.teamSize,
    plan: data.plan,
    frameworks: data.frameworks,
    inviteEmails: data.inviteEmails,
  };
}
