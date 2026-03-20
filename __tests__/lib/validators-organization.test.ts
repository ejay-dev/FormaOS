/** @jest-environment node */
import {
  validateOrganizationName,
  sanitizeOrganizationName,
  validateIndustry,
  validateTeamSize,
  validatePlan,
  validateFrameworks,
  isValidEmail,
  parseInviteEmails,
  validateInviteEmails,
} from "@/lib/validators/organization";

describe("validateOrganizationName", () => {
  it("accepts valid names", () => {
    expect(validateOrganizationName("Acme Corp")).toEqual({ valid: true });
    expect(validateOrganizationName("AB")).toEqual({ valid: true });
    expect(validateOrganizationName("O'Brien Healthcare")).toEqual({ valid: true });
    expect(validateOrganizationName("Smith-Jones Ltd")).toEqual({ valid: true });
    expect(validateOrganizationName("St. Mary's")).toEqual({ valid: true });
    expect(validateOrganizationName("A1")).toEqual({ valid: true });
    expect(validateOrganizationName("99")).toEqual({ valid: true });
  });

  it("rejects empty or missing names", () => {
    expect(validateOrganizationName("")).toEqual({
      valid: false,
      error: "Organization name is required",
    });
    expect(validateOrganizationName("   ")).toEqual({
      valid: false,
      error: "Organization name is required",
    });
  });

  it("rejects names shorter than 2 characters", () => {
    expect(validateOrganizationName("A")).toEqual({
      valid: false,
      error: "Organization name must be at least 2 characters",
    });
  });

  it("rejects names longer than 100 characters", () => {
    const longName = "A" + "b".repeat(100);
    expect(validateOrganizationName(longName)).toEqual({
      valid: false,
      error: "Organization name must be less than 100 characters",
    });
  });

  it("accepts names exactly at boundary lengths", () => {
    expect(validateOrganizationName("AB").valid).toBe(true);
    const name100 = "A" + "b".repeat(98) + "C";
    expect(validateOrganizationName(name100).valid).toBe(true);
  });

  it("rejects names starting or ending with non-alphanumeric", () => {
    expect(validateOrganizationName("-Acme")).toEqual({
      valid: false,
      error: "Organization name must start and end with alphanumeric characters",
    });
    expect(validateOrganizationName("Acme-")).toEqual({
      valid: false,
      error: "Organization name must start and end with alphanumeric characters",
    });
    expect(validateOrganizationName("'Acme")).toEqual({
      valid: false,
      error: "Organization name must start and end with alphanumeric characters",
    });
    expect(validateOrganizationName("Acme'")).toEqual({
      valid: false,
      error: "Organization name must start and end with alphanumeric characters",
    });
    expect(validateOrganizationName(".Acme")).toEqual({
      valid: false,
      error: "Organization name must start and end with alphanumeric characters",
    });
    expect(validateOrganizationName(".Acme.").valid).toBe(false);
  });

  it("rejects names with special characters", () => {
    expect(validateOrganizationName("Acme!Corp").valid).toBe(false);
    expect(validateOrganizationName("Acme@Corp").valid).toBe(false);
    expect(validateOrganizationName("Acme#Corp").valid).toBe(false);
    expect(validateOrganizationName("Acme$Corp").valid).toBe(false);
    expect(validateOrganizationName("Acme&Corp").valid).toBe(false);
  });
});

describe("sanitizeOrganizationName", () => {
  it("trims whitespace", () => {
    expect(sanitizeOrganizationName("  Acme  ")).toBe("Acme");
  });

  it("normalizes multiple spaces to single space", () => {
    expect(sanitizeOrganizationName("Acme   Corp")).toBe("Acme Corp");
  });

  it("normalizes multiple hyphens to single hyphen", () => {
    expect(sanitizeOrganizationName("Acme--Corp")).toBe("Acme-Corp");
    expect(sanitizeOrganizationName("Acme---Corp")).toBe("Acme-Corp");
  });

  it("normalizes multiple apostrophes to single apostrophe", () => {
    expect(sanitizeOrganizationName("O''Brien")).toBe("O'Brien");
  });

  it("removes leading and trailing hyphens", () => {
    expect(sanitizeOrganizationName("-Acme-")).toBe("Acme");
    expect(sanitizeOrganizationName("---Acme---")).toBe("Acme");
  });

  it("removes leading and trailing apostrophes", () => {
    expect(sanitizeOrganizationName("'Acme'")).toBe("Acme");
    expect(sanitizeOrganizationName("'''Acme'''")).toBe("Acme");
  });

  it("handles combined sanitization", () => {
    expect(sanitizeOrganizationName("  --''Acme   Corp''--  ")).toBe("Acme Corp");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(sanitizeOrganizationName("   ")).toBe("");
  });

  it("handles already clean names", () => {
    expect(sanitizeOrganizationName("Acme Corp")).toBe("Acme Corp");
  });
});

describe("validateIndustry", () => {
  it("accepts all valid industry options", () => {
    const validIds = [
      "ndis",
      "healthcare",
      "aged_care",
      "childcare",
      "community_services",
      "financial_services",
      "saas_technology",
      "enterprise",
      "other",
    ];
    for (const id of validIds) {
      expect(validateIndustry(id)).toEqual({ valid: true });
    }
  });

  it("rejects invalid industry values", () => {
    expect(validateIndustry("invalid")).toEqual({
      valid: false,
      error: "Please select a valid industry",
    });
    expect(validateIndustry("")).toEqual({
      valid: false,
      error: "Please select a valid industry",
    });
    expect(validateIndustry("NDIS")).toEqual({
      valid: false,
      error: "Please select a valid industry",
    });
    expect(validateIndustry("Healthcare")).toEqual({
      valid: false,
      error: "Please select a valid industry",
    });
  });
});

describe("validateTeamSize", () => {
  it("accepts all valid team size options", () => {
    const validIds = ["1-10", "11-50", "51-200", "200+"];
    for (const id of validIds) {
      expect(validateTeamSize(id)).toEqual({ valid: true });
    }
  });

  it("rejects invalid team size values", () => {
    expect(validateTeamSize("invalid")).toEqual({
      valid: false,
      error: "Please select a valid team size",
    });
    expect(validateTeamSize("")).toEqual({
      valid: false,
      error: "Please select a valid team size",
    });
    expect(validateTeamSize("1-50")).toEqual({
      valid: false,
      error: "Please select a valid team size",
    });
    expect(validateTeamSize("500+")).toEqual({
      valid: false,
      error: "Please select a valid team size",
    });
  });
});

describe("validatePlan", () => {
  it("accepts all valid plan options", () => {
    const validIds = ["basic", "pro", "enterprise"];
    for (const id of validIds) {
      expect(validatePlan(id)).toEqual({ valid: true });
    }
  });

  it("rejects invalid plan values", () => {
    expect(validatePlan("invalid")).toEqual({
      valid: false,
      error: "Please select a valid plan",
    });
    expect(validatePlan("")).toEqual({
      valid: false,
      error: "Please select a valid plan",
    });
    expect(validatePlan("Basic")).toEqual({
      valid: false,
      error: "Please select a valid plan",
    });
    expect(validatePlan("free")).toEqual({
      valid: false,
      error: "Please select a valid plan",
    });
  });
});

describe("validateFrameworks", () => {
  it("accepts single valid framework", () => {
    expect(validateFrameworks(["ndis"])).toEqual({ valid: true });
    expect(validateFrameworks(["custom"])).toEqual({ valid: true });
  });

  it("accepts multiple valid frameworks", () => {
    expect(validateFrameworks(["ndis", "hipaa", "soc2"])).toEqual({ valid: true });
    expect(
      validateFrameworks(["ndis", "hipaa", "soc2", "iso27001", "gdpr", "pci-dss", "aged_care", "custom"])
    ).toEqual({ valid: true });
  });

  it("rejects empty array", () => {
    expect(validateFrameworks([])).toEqual({
      valid: false,
      error: "Please select at least one framework",
    });
  });

  it("rejects arrays with invalid frameworks", () => {
    expect(validateFrameworks(["invalid"])).toEqual({
      valid: false,
      error: "Invalid framework selection",
    });
    expect(validateFrameworks(["ndis", "invalid"])).toEqual({
      valid: false,
      error: "Invalid framework selection",
    });
  });

  it("rejects frameworks with wrong casing", () => {
    expect(validateFrameworks(["NDIS"])).toEqual({
      valid: false,
      error: "Invalid framework selection",
    });
    expect(validateFrameworks(["SOC2"])).toEqual({
      valid: false,
      error: "Invalid framework selection",
    });
  });
});

describe("isValidEmail", () => {
  it("accepts valid emails", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("user.name@example.com")).toBe(true);
    expect(isValidEmail("user+tag@example.com")).toBe(true);
    expect(isValidEmail("user@sub.domain.com")).toBe(true);
    expect(isValidEmail("a@b.co")).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("user")).toBe(false);
    expect(isValidEmail("user@")).toBe(false);
    expect(isValidEmail("@example.com")).toBe(false);
    expect(isValidEmail("user@example")).toBe(false);
    expect(isValidEmail("user @example.com")).toBe(false);
    expect(isValidEmail("user@ example.com")).toBe(false);
    expect(isValidEmail("user@example .com")).toBe(false);
  });
});

describe("parseInviteEmails", () => {
  it("returns empty array for null input", () => {
    expect(parseInviteEmails(null)).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(parseInviteEmails("")).toEqual([]);
  });

  it("parses comma-separated emails", () => {
    expect(parseInviteEmails("a@b.co,c@d.co")).toEqual(["a@b.co", "c@d.co"]);
  });

  it("parses newline-separated emails", () => {
    expect(parseInviteEmails("a@b.co\nc@d.co")).toEqual(["a@b.co", "c@d.co"]);
  });

  it("parses mixed comma and newline separators", () => {
    expect(parseInviteEmails("a@b.co,c@d.co\ne@f.co")).toEqual([
      "a@b.co",
      "c@d.co",
      "e@f.co",
    ]);
  });

  it("trims whitespace from entries", () => {
    expect(parseInviteEmails("  a@b.co , c@d.co  ")).toEqual(["a@b.co", "c@d.co"]);
  });

  it("lowercases emails", () => {
    expect(parseInviteEmails("User@Example.COM")).toEqual(["user@example.com"]);
  });

  it("filters out entries without @", () => {
    expect(parseInviteEmails("notanemail,a@b.co")).toEqual(["a@b.co"]);
  });

  it("filters out entries with 3 or fewer characters", () => {
    expect(parseInviteEmails("a@b,a@b.co")).toEqual(["a@b.co"]);
  });

  it("filters empty entries from trailing commas", () => {
    expect(parseInviteEmails("a@b.co,,,")).toEqual(["a@b.co"]);
  });
});

describe("validateInviteEmails", () => {
  it("returns valid for all valid emails", () => {
    const result = validateInviteEmails(["user@example.com", "admin@test.org"]);
    expect(result).toEqual({
      valid: true,
      validEmails: ["user@example.com", "admin@test.org"],
      invalidEmails: [],
    });
  });

  it("separates valid and invalid emails", () => {
    const result = validateInviteEmails(["user@example.com", "not-an-email", "admin@test.org"]);
    expect(result).toEqual({
      valid: false,
      validEmails: ["user@example.com", "admin@test.org"],
      invalidEmails: ["not-an-email"],
    });
  });

  it("returns invalid when all emails are invalid", () => {
    const result = validateInviteEmails(["bad", "also-bad"]);
    expect(result).toEqual({
      valid: false,
      validEmails: [],
      invalidEmails: ["bad", "also-bad"],
    });
  });

  it("handles empty array", () => {
    const result = validateInviteEmails([]);
    expect(result).toEqual({
      valid: true,
      validEmails: [],
      invalidEmails: [],
    });
  });
});
