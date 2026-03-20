import { z } from "zod";

export const createLoanSchema = z.object({
  borrower_id: z.string().min(1, "Borrower is required"),
  type: z.string().min(1, "Loan type is required"),
  purpose: z.string().min(1, "Loan purpose is required"),
  loan_amount: z.string().refine(
    (val) => {
      const n = parseFloat(val);
      return !isNaN(n) && n > 0;
    },
    { message: "Loan amount must be a positive number" }
  ),
});
