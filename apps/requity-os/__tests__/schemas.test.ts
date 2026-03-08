import { describe, it, expect } from "vitest";
import { buildContactSchema, contactBaseSchema } from "@/lib/schemas/contact";
import { drawFormSchema } from "@/lib/schemas/draw";
import { createLoanSchema } from "@/lib/schemas/loan";

// ─── Contact Schema ───

describe("contactBaseSchema", () => {
  it("accepts valid names", () => {
    const result = contactBaseSchema.safeParse({
      first_name: "John",
      last_name: "Doe",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty first name", () => {
    const result = contactBaseSchema.safeParse({
      first_name: "",
      last_name: "Doe",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.first_name).toBeDefined();
    }
  });

  it("rejects empty last name", () => {
    const result = contactBaseSchema.safeParse({
      first_name: "John",
      last_name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const result = contactBaseSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("buildContactSchema", () => {
  it("accepts valid contact with email and relationship", () => {
    const schema = buildContactSchema({
      selectedRelationships: ["borrower"],
      email: "john@example.com",
      phone: "",
    });
    const result = schema.safeParse({
      first_name: "John",
      last_name: "Doe",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid contact with phone only", () => {
    const schema = buildContactSchema({
      selectedRelationships: ["investor"],
      email: "",
      phone: "555-1234",
    });
    const result = schema.safeParse({
      first_name: "Jane",
      last_name: "Smith",
    });
    expect(result.success).toBe(true);
  });

  it("rejects contact without relationship type", () => {
    const schema = buildContactSchema({
      selectedRelationships: [],
      email: "john@example.com",
      phone: "",
    });
    const result = schema.safeParse({
      first_name: "John",
      last_name: "Doe",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain(
        "At least one relationship type is required"
      );
    }
  });

  it("rejects contact without email or phone", () => {
    const schema = buildContactSchema({
      selectedRelationships: ["borrower"],
      email: "",
      phone: "",
    });
    const result = schema.safeParse({
      first_name: "John",
      last_name: "Doe",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain(
        "At least one contact method (email or phone) is required"
      );
    }
  });

  it("rejects whitespace-only email and phone", () => {
    const schema = buildContactSchema({
      selectedRelationships: ["borrower"],
      email: "   ",
      phone: "   ",
    });
    const result = schema.safeParse({
      first_name: "John",
      last_name: "Doe",
    });
    expect(result.success).toBe(false);
  });
});

// ─── Draw Form Schema ───

describe("drawFormSchema", () => {
  it("accepts valid draw request", () => {
    const result = drawFormSchema.safeParse({
      selectedLoanId: "loan-123",
      amount: "50000",
    });
    expect(result.success).toBe(true);
  });

  it("accepts decimal amounts", () => {
    const result = drawFormSchema.safeParse({
      selectedLoanId: "loan-123",
      amount: "50000.50",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing loan ID", () => {
    const result = drawFormSchema.safeParse({
      selectedLoanId: "",
      amount: "50000",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.selectedLoanId).toBeDefined();
    }
  });

  it("rejects zero amount", () => {
    const result = drawFormSchema.safeParse({
      selectedLoanId: "loan-123",
      amount: "0",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative amount", () => {
    const result = drawFormSchema.safeParse({
      selectedLoanId: "loan-123",
      amount: "-500",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-numeric amount", () => {
    const result = drawFormSchema.safeParse({
      selectedLoanId: "loan-123",
      amount: "abc",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty amount", () => {
    const result = drawFormSchema.safeParse({
      selectedLoanId: "loan-123",
      amount: "",
    });
    expect(result.success).toBe(false);
  });
});

// ─── Create Loan Schema ───

describe("createLoanSchema", () => {
  const validLoan = {
    borrower_id: "borrower-1",
    type: "bridge",
    purpose: "purchase",
    loan_amount: "1000000",
  };

  it("accepts a valid loan", () => {
    const result = createLoanSchema.safeParse(validLoan);
    expect(result.success).toBe(true);
  });

  it("rejects missing borrower", () => {
    const result = createLoanSchema.safeParse({
      ...validLoan,
      borrower_id: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.borrower_id).toBeDefined();
    }
  });

  it("rejects missing loan type", () => {
    const result = createLoanSchema.safeParse({
      ...validLoan,
      type: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing purpose", () => {
    const result = createLoanSchema.safeParse({
      ...validLoan,
      purpose: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero loan amount", () => {
    const result = createLoanSchema.safeParse({
      ...validLoan,
      loan_amount: "0",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative loan amount", () => {
    const result = createLoanSchema.safeParse({
      ...validLoan,
      loan_amount: "-100000",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-numeric loan amount", () => {
    const result = createLoanSchema.safeParse({
      ...validLoan,
      loan_amount: "one million",
    });
    expect(result.success).toBe(false);
  });

  it("accepts decimal loan amounts", () => {
    const result = createLoanSchema.safeParse({
      ...validLoan,
      loan_amount: "1500000.75",
    });
    expect(result.success).toBe(true);
  });
});
