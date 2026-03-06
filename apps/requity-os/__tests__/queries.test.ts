import { describe, it, expect } from "vitest";
import {
  resolveCrmContactName,
  getInvestorDisplayName,
  getInitials,
} from "@/lib/supabase/queries";

describe("resolveCrmContactName", () => {
  it("returns name field when present", () => {
    expect(
      resolveCrmContactName({ name: "Acme Corp", first_name: "John", last_name: "Doe" })
    ).toBe("Acme Corp");
  });

  it("falls back to first_name + last_name", () => {
    expect(
      resolveCrmContactName({ name: null, first_name: "John", last_name: "Doe" })
    ).toBe("John Doe");
  });

  it("handles first_name only", () => {
    expect(
      resolveCrmContactName({ name: null, first_name: "Jane", last_name: null })
    ).toBe("Jane");
  });

  it("returns fallback for null contact", () => {
    expect(resolveCrmContactName(null)).toBe("Unknown");
  });

  it("returns custom fallback", () => {
    expect(resolveCrmContactName(null, "N/A")).toBe("N/A");
  });

  it("returns fallback when all fields are null", () => {
    expect(
      resolveCrmContactName({ name: null, first_name: null, last_name: null })
    ).toBe("Unknown");
  });
});

describe("getInvestorDisplayName", () => {
  it("returns CRM contact name from investor relation", () => {
    const investorRelation = {
      user_id: "user-123",
      crm_contacts: { name: "John Investor", first_name: null, last_name: null },
    };
    expect(getInvestorDisplayName(investorRelation)).toBe("John Investor");
  });

  it("falls back to CRM first/last name", () => {
    const investorRelation = {
      user_id: "user-123",
      crm_contacts: { name: null, first_name: "Jane", last_name: "Smith" },
    };
    expect(getInvestorDisplayName(investorRelation)).toBe("Jane Smith");
  });

  it("falls back to profile name from Record", () => {
    const investorRelation = {
      user_id: "user-123",
      crm_contacts: null,
    };
    const profileNames = { "user-123": "Profile User" };
    expect(getInvestorDisplayName(investorRelation, profileNames)).toBe("Profile User");
  });

  it("falls back to profile name from Map", () => {
    const investorRelation = {
      user_id: "user-123",
      crm_contacts: null,
    };
    const profileNames = new Map([["user-123", "Map User"]]);
    expect(getInvestorDisplayName(investorRelation, profileNames)).toBe("Map User");
  });

  it("returns Unknown for null relation", () => {
    expect(getInvestorDisplayName(null)).toBe("Unknown");
  });

  it("returns Unknown when no CRM and no profile match", () => {
    const investorRelation = {
      user_id: "user-999",
      crm_contacts: null,
    };
    const profileNames = { "user-123": "Other User" };
    expect(getInvestorDisplayName(investorRelation, profileNames)).toBe("Unknown");
  });
});

describe("getInitials", () => {
  it("returns initials from full name", () => {
    expect(getInitials("John Doe")).toBe("JD");
  });

  it("returns single initial from one-word name", () => {
    expect(getInitials("John")).toBe("J");
  });

  it("limits to 2 characters", () => {
    expect(getInitials("John Michael Doe")).toBe("JM");
  });

  it("returns ? for null", () => {
    expect(getInitials(null)).toBe("?");
  });

  it("returns ? for empty string", () => {
    expect(getInitials("")).toBe("?");
  });
});
