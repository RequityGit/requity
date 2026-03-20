import { z } from "zod";

export const drawFormSchema = z.object({
  selectedLoanId: z.string().min(1, "Please select a loan."),
  amount: z.string().refine(
    (val) => {
      const n = parseFloat(val);
      return !isNaN(n) && n > 0;
    },
    { message: "Please enter a valid amount." }
  ),
});
