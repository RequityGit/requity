// @ts-nocheck — Supabase types will be regenerated after schema migration
"use server"

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

// --- UTILITY FUNCTIONS (not exported) ---

function roundPrecise(amount: number): number {
  return parseFloat(amount.toFixed(6));
}

function roundCents(amount: number): number {
  const shifted = amount * 100;
  const floored = Math.floor(shifted);
  const remainder = shifted - floored;
  if (Math.abs(remainder - 0.5) < 1e-9) {
    return (floored % 2 === 0 ? floored : floored + 1) / 100;
  }
  return Math.round(shifted) / 100;
}

function days360(startDate: Date, endDate: Date): number {
  let d1 = startDate.getUTCDate();
  let m1 = startDate.getUTCMonth() + 1;
  let y1 = startDate.getUTCFullYear();
  let d2 = endDate.getUTCDate();
  let m2 = endDate.getUTCMonth() + 1;
  let y2 = endDate.getUTCFullYear();
  if (d1 === 31) d1 = 30;
  if (d2 === 31 && d1 >= 30) d2 = 30;
  return (y2 - y1) * 360 + (m2 - m1) * 30 + (d2 - d1);
}

function calculateInterestPrecise(principal: number, annualRate: number, periodDays: number = 30): number {
  return roundPrecise(principal * annualRate * (periodDays / 360));
}

function calculatePerDiemPrecise(principal: number, annualRate: number): number {
  return roundPrecise(principal * annualRate / 360);
}

function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

function applyPaymentWaterfall(amountPaid: number, lateFeeOwed: number, interestDue: number, principalDue: number, escrowDue: number) {
  let remaining = amountPaid;
  const applied_to_late_fees = roundCents(Math.min(remaining, lateFeeOwed));
  remaining = roundCents(remaining - applied_to_late_fees);
  const applied_to_interest = roundCents(Math.min(remaining, interestDue));
  remaining = roundCents(remaining - applied_to_interest);
  const applied_to_principal = roundCents(Math.min(remaining, principalDue));
  remaining = roundCents(remaining - applied_to_principal);
  const applied_to_escrow = roundCents(Math.min(remaining, escrowDue));
  remaining = roundCents(remaining - applied_to_escrow);
  const totalDue = roundCents(lateFeeOwed + interestDue + principalDue + escrowDue);
  return { applied_to_late_fees, applied_to_interest, applied_to_principal, applied_to_escrow, unapplied: remaining, is_partial: amountPaid < totalDue };
}

// --- EXPORTED SERVER ACTIONS ---

export async function generatePaymentSchedule(dealId: string) {
  const admin = createAdminClient();
  const { data: deal } = await admin.from("unified_deals").select("loan_amount, interest_rate, monthly_payment, payment_frequency, first_payment_date, maturity_date, late_charge_pct, origination_date, day_count_convention").eq("id", dealId).single();
  if (!deal) throw new Error("Deal not found");
  if (!deal.loan_amount || !deal.interest_rate || !deal.first_payment_date || !deal.maturity_date) throw new Error("Missing required loan terms");

  const { count } = await admin.from("deal_payments").select("id", { count: "exact", head: true }).eq("deal_id", dealId);
  if (count && count > 0) throw new Error("Payment schedule already exists");

  const principal = deal.loan_amount;
  const annualRate = deal.interest_rate;
  const frequency = deal.payment_frequency ?? "monthly";
  const firstPaymentDate = new Date(deal.first_payment_date + "T00:00:00Z");
  const maturityDate = new Date(deal.maturity_date + "T00:00:00Z");
  const originationDate = deal.origination_date ? new Date(deal.origination_date + "T00:00:00Z") : null;

  const fullMonthInterestPrecise = calculateInterestPrecise(principal, annualRate, 30);
  const fullMonthInterestCents = roundCents(fullMonthInterestPrecise);
  const perDiem = calculatePerDiemPrecise(principal, annualRate);

  const payments: any[] = [];
  let currentDate = new Date(firstPaymentDate);
  let paymentNumber = 1;
  let totalPreciseInterest = 0;
  let totalRoundedInterest = 0;

  let firstPaymentIsStub = false;
  let stubDays = 30;
  if (originationDate) {
    stubDays = days360(originationDate, firstPaymentDate);
    if (stubDays !== 30 && stubDays > 0 && stubDays < 60) firstPaymentIsStub = true;
  }

  while (currentDate <= maturityDate) {
    let interestPrecise: number, interestCents: number, periodDays: number;
    if (paymentNumber === 1 && firstPaymentIsStub) {
      periodDays = stubDays;
      interestPrecise = calculateInterestPrecise(principal, annualRate, periodDays);
      interestCents = roundCents(interestPrecise);
    } else {
      periodDays = frequency === "quarterly" ? 90 : 30;
      interestPrecise = calculateInterestPrecise(principal, annualRate, periodDays);
      interestCents = roundCents(interestPrecise);
    }
    totalPreciseInterest = roundPrecise(totalPreciseInterest + interestPrecise);
    totalRoundedInterest = roundCents(totalRoundedInterest + interestCents);
    const amountDue = (paymentNumber === 1 && firstPaymentIsStub) ? interestCents : (deal.monthly_payment ? roundCents(deal.monthly_payment) : interestCents);
    payments.push({
      deal_id: dealId, payment_number: paymentNumber, due_date: currentDate.toISOString().split("T")[0],
      amount_due: amountDue, principal_due: 0, interest_due: interestCents, escrow_due: 0, status: "scheduled",
      interest_rate_used: annualRate, principal_balance_at_time: principal,
      notes: (paymentNumber === 1 && firstPaymentIsStub) ? `Stub period: ${periodDays} days (30/360)` : null,
    });
    const monthsToAdd = frequency === "quarterly" ? 3 : 1;
    currentDate = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth() + monthsToAdd, currentDate.getUTCDate()));
    paymentNumber++;
  }

  if (payments.length === 0) throw new Error("No payments generated");

  // True-up final payment
  const roundingDifference = roundCents(totalPreciseInterest - totalRoundedInterest);
  if (roundingDifference !== 0) {
    const last = payments[payments.length - 1];
    last.interest_due = roundCents(last.interest_due + roundingDifference);
    last.amount_due = roundCents(last.amount_due + roundingDifference);
    last.notes = (last.notes ? last.notes + ". " : "") + `True-up: ${roundingDifference > 0 ? "+" : ""}${roundingDifference.toFixed(2)}`;
  }

  const { error } = await admin.from("deal_payments").insert(payments);
  if (error) throw error;

  await admin.from("unified_deals").update({ next_payment_due: payments[0].due_date, per_diem_interest: roundCents(perDiem), monthly_payment: fullMonthInterestCents }).eq("id", dealId);

  await admin.from("deal_servicing_events").insert({
    deal_id: dealId, event_type: "schedule_generated",
    description: `Payment schedule generated: ${payments.length} payments, 30/360 basis`,
    metadata: { day_count_convention: "30/360", principal, annual_rate: annualRate, per_diem_precise: perDiem, per_diem_display: roundCents(perDiem), payment_count: payments.length, total_interest_precise: totalPreciseInterest, total_interest_rounded: totalRoundedInterest, rounding_difference: roundingDifference },
  });

  revalidatePath(`/pipeline/${dealId}`);
  return { count: payments.length, perDiem: roundCents(perDiem), fullMonthInterest: fullMonthInterestCents };
}

export async function recordPayment(paymentId: string, data: { amount_paid: number; paid_date: string; payment_method: string; reference_number?: string; notes?: string }) {
  const admin = createAdminClient();
  const amountPaid = roundCents(data.amount_paid);

  const { data: payment, error } = await admin.from("deal_payments").select("deal_id, payment_number, amount_due, interest_due, principal_due, escrow_due, late_fee").eq("id", paymentId).single();
  if (error || !payment) throw new Error("Payment not found");

  const waterfall = applyPaymentWaterfall(amountPaid, payment.late_fee ?? 0, payment.interest_due ?? 0, payment.principal_due ?? 0, payment.escrow_due ?? 0);

  await admin.from("deal_payments").update({
    amount_paid: amountPaid, paid_date: data.paid_date, payment_method: data.payment_method, reference_number: data.reference_number, notes: data.notes,
    applied_to_late_fees: waterfall.applied_to_late_fees, applied_to_interest: waterfall.applied_to_interest,
    applied_to_principal: waterfall.applied_to_principal, applied_to_escrow: waterfall.applied_to_escrow,
    is_partial: waterfall.is_partial, status: waterfall.is_partial ? "partial" : "paid", days_past_due: 0,
  }).eq("id", paymentId);

  const { data: nextPayment } = await admin.from("deal_payments").select("due_date").eq("deal_id", payment.deal_id).neq("status", "paid").order("due_date", { ascending: true }).limit(1).single();
  await admin.from("unified_deals").update({ last_payment_date: data.paid_date, next_payment_due: nextPayment?.due_date ?? null, servicing_status: "current" }).eq("id", payment.deal_id);

  await admin.from("deal_servicing_events").insert({
    deal_id: payment.deal_id, event_type: "payment_received", amount: amountPaid,
    description: `Payment #${payment.payment_number} received — ${formatCurrency(amountPaid)} via ${data.payment_method}`,
    metadata: { payment_id: paymentId, payment_number: payment.payment_number, amount_due: payment.amount_due, amount_paid: amountPaid, waterfall, method: data.payment_method, reference: data.reference_number, paid_date: data.paid_date },
  });

  revalidatePath(`/pipeline/${payment.deal_id}`);
}

export async function applyPaymentToAccount(dealId: string, data: { amount_received: number; paid_date: string; payment_method: string; reference_number?: string; notes?: string }) {
  const admin = createAdminClient();
  const { data: outstanding } = await admin.from("deal_payments").select("*").eq("deal_id", dealId).in("status", ["past_due", "due", "scheduled", "partial"]).eq("is_reversed", false).order("due_date", { ascending: true });
  if (!outstanding || outstanding.length === 0) throw new Error("No outstanding payments");

  let remaining = roundCents(data.amount_received);
  const appliedPayments: any[] = [];

  for (const pmt of outstanding) {
    if (remaining <= 0) break;
    const totalOwed = roundCents((pmt.late_fee ?? 0) + (pmt.interest_due ?? 0) + (pmt.principal_due ?? 0) + (pmt.escrow_due ?? 0) - (pmt.amount_paid ?? 0));
    if (totalOwed <= 0) continue;
    const applying = roundCents(Math.min(remaining, totalOwed));
    const waterfall = applyPaymentWaterfall(applying, pmt.late_fee ?? 0, pmt.interest_due ?? 0, pmt.principal_due ?? 0, pmt.escrow_due ?? 0);
    const newAmountPaid = roundCents((pmt.amount_paid ?? 0) + applying);
    const isFullyPaid = newAmountPaid >= roundCents((pmt.late_fee ?? 0) + (pmt.interest_due ?? 0) + (pmt.principal_due ?? 0) + (pmt.escrow_due ?? 0));

    await admin.from("deal_payments").update({
      amount_paid: newAmountPaid, paid_date: data.paid_date, payment_method: data.payment_method, reference_number: data.reference_number,
      applied_to_late_fees: roundCents((pmt.applied_to_late_fees ?? 0) + waterfall.applied_to_late_fees),
      applied_to_interest: roundCents((pmt.applied_to_interest ?? 0) + waterfall.applied_to_interest),
      applied_to_principal: roundCents((pmt.applied_to_principal ?? 0) + waterfall.applied_to_principal),
      applied_to_escrow: roundCents((pmt.applied_to_escrow ?? 0) + waterfall.applied_to_escrow),
      is_partial: !isFullyPaid, status: isFullyPaid ? "paid" : "partial", days_past_due: isFullyPaid ? 0 : pmt.days_past_due,
    }).eq("id", pmt.id);

    appliedPayments.push({ payment_number: pmt.payment_number, applied: applying, fully_paid: isFullyPaid });
    remaining = roundCents(remaining - applying);
  }

  await admin.from("deal_servicing_events").insert({
    deal_id: dealId, event_type: "payment_applied", amount: data.amount_received,
    description: `${formatCurrency(data.amount_received)} applied to ${appliedPayments.length} payment(s), oldest first`,
    metadata: { total_received: data.amount_received, method: data.payment_method, reference: data.reference_number, payments_applied: appliedPayments, unapplied: remaining },
  });

  const { data: nextPmt } = await admin.from("deal_payments").select("due_date").eq("deal_id", dealId).neq("status", "paid").order("due_date", { ascending: true }).limit(1).single();
  await admin.from("unified_deals").update({ last_payment_date: data.paid_date, next_payment_due: nextPmt?.due_date ?? null, servicing_status: "current" }).eq("id", dealId);

  revalidatePath(`/pipeline/${dealId}`);
  return { applied: appliedPayments, unapplied: remaining };
}

export async function reversePayment(paymentId: string, reason: string) {
  const admin = createAdminClient();
  const { data: payment } = await admin.from("deal_payments").select("*").eq("id", paymentId).single();
  if (!payment || payment.status !== "paid") throw new Error("Can only reverse a paid payment");
  if (payment.is_reversed) throw new Error("Already reversed");

  await admin.from("deal_payments").update({
    is_reversed: true, reversed_at: new Date().toISOString(), reversal_reason: reason,
    status: "past_due", amount_paid: 0, applied_to_late_fees: 0, applied_to_interest: 0, applied_to_principal: 0, applied_to_escrow: 0,
  }).eq("id", paymentId);

  const { data: lastGood } = await admin.from("deal_payments").select("paid_date").eq("deal_id", payment.deal_id).eq("status", "paid").eq("is_reversed", false).order("paid_date", { ascending: false }).limit(1).single();
  const { data: nextPmt } = await admin.from("deal_payments").select("due_date").eq("deal_id", payment.deal_id).neq("status", "paid").eq("is_reversed", false).order("due_date", { ascending: true }).limit(1).single();
  await admin.from("unified_deals").update({ last_payment_date: lastGood?.paid_date ?? null, next_payment_due: nextPmt?.due_date ?? payment.due_date }).eq("id", payment.deal_id);

  await admin.from("deal_servicing_events").insert({
    deal_id: payment.deal_id, event_type: "payment_reversed", amount: -(payment.amount_paid),
    description: `Payment #${payment.payment_number} reversed — ${formatCurrency(payment.amount_paid)} (${reason})`,
    metadata: { original_payment_id: paymentId, payment_number: payment.payment_number, original_amount: payment.amount_paid, reason, waterfall_reversed: { late_fees: payment.applied_to_late_fees, interest: payment.applied_to_interest, principal: payment.applied_to_principal, escrow: payment.applied_to_escrow } },
  });

  await updateDelinquencyStatus(payment.deal_id);
  revalidatePath(`/pipeline/${payment.deal_id}`);
}

export async function updateDelinquencyStatus(dealId: string) {
  const admin = createAdminClient();
  const today = new Date().toISOString().split("T")[0];
  const { data: overduePayments } = await admin.from("deal_payments").select("id, due_date, late_fee, amount_due, payment_number").eq("deal_id", dealId).neq("status", "paid").eq("is_reversed", false).lt("due_date", today);
  if (!overduePayments || overduePayments.length === 0) return;

  const { data: deal } = await admin.from("unified_deals").select("late_charge_pct, late_charge_grace_days, interest_rate, default_rate, loan_amount").eq("id", dealId).single();
  const graceDays = deal?.late_charge_grace_days ?? 15;
  const latePct = deal?.late_charge_pct ?? 0.05;

  let maxDaysPastDue = 0;
  for (const pmt of overduePayments) {
    const daysPastDue = Math.ceil((Date.now() - new Date(pmt.due_date).getTime()) / (1000 * 60 * 60 * 24));
    if (daysPastDue > maxDaysPastDue) maxDaysPastDue = daysPastDue;

    await admin.from("deal_payments").update({ status: "past_due", days_past_due: daysPastDue }).eq("id", pmt.id);

    if (daysPastDue > graceDays && !pmt.late_fee) {
      const lateFee = roundCents((pmt.amount_due ?? 0) * latePct);
      await admin.from("deal_payments").update({ late_fee: lateFee }).eq("id", pmt.id);
      await admin.from("deal_servicing_events").insert({
        deal_id: dealId, event_type: "late_fee_assessed", amount: lateFee,
        description: `Late fee on payment #${pmt.payment_number}: ${formatCurrency(lateFee)}`,
        metadata: { payment_id: pmt.id, amount_due: pmt.amount_due, late_pct: latePct, grace_days: graceDays, days_past_due: daysPastDue },
      });
    }
  }

  let servicingStatus = "current";
  if (maxDaysPastDue > 90) servicingStatus = "default";
  else if (maxDaysPastDue > 0) servicingStatus = "delinquent";
  await admin.from("unified_deals").update({ servicing_status: servicingStatus }).eq("id", dealId);

  // Default rate escalation
  if (servicingStatus === "default" && deal?.default_rate) {
    const { data: futurePayments } = await admin.from("deal_payments").select("id").eq("deal_id", dealId).in("status", ["scheduled", "due", "past_due"]).eq("is_reversed", false);
    const newUPB = deal.loan_amount ?? 0; // Simplified — could add draws
    for (const fp of (futurePayments ?? [])) {
      const newInterest = roundCents(calculateInterestPrecise(newUPB, deal.default_rate, 30));
      await admin.from("deal_payments").update({ interest_due: newInterest, amount_due: newInterest, interest_rate_used: deal.default_rate }).eq("id", fp.id);
    }
    await admin.from("deal_servicing_events").insert({
      deal_id: dealId, event_type: "rate_escalated",
      description: `Default rate applied: ${(deal.default_rate * 100).toFixed(2)}% (${maxDaysPastDue} days past due)`,
      metadata: { previous_rate: deal.interest_rate, default_rate: deal.default_rate, days_past_due: maxDaysPastDue },
    });
  }
}

export async function onDrawFunded(drawId: string) {
  const admin = createAdminClient();
  const { data: draw } = await admin.from("deal_draw_requests").select("deal_id, wire_amount, wire_date").eq("id", drawId).single();
  if (!draw) throw new Error("Draw not found");

  const { data: deal } = await admin.from("unified_deals").select("loan_amount, interest_rate, default_rate, servicing_status").eq("id", draw.deal_id).single();
  const { data: allDraws } = await admin.from("deal_draw_requests").select("wire_amount").eq("deal_id", draw.deal_id).eq("status", "funded");
  const totalDrawn = (allDraws ?? []).reduce((s: number, d: any) => s + (d.wire_amount ?? 0), 0);
  const oldUPB = (deal?.loan_amount ?? 0) + totalDrawn - (draw.wire_amount ?? 0);
  const newUPB = (deal?.loan_amount ?? 0) + totalDrawn;

  await admin.from("deal_draw_requests").update({ principal_balance_before: oldUPB, principal_balance_after: newUPB }).eq("id", drawId);

  const activeRate = deal?.servicing_status === "default" && deal?.default_rate ? deal.default_rate : (deal?.interest_rate ?? 0);
  const { data: futurePayments } = await admin.from("deal_payments").select("id").eq("deal_id", draw.deal_id).in("status", ["scheduled", "due"]).eq("is_reversed", false).order("due_date", { ascending: true });

  let totalPrecise = 0, totalRounded = 0;
  for (const fp of (futurePayments ?? [])) {
    const precise = calculateInterestPrecise(newUPB, activeRate, 30);
    const cents = roundCents(precise);
    totalPrecise += precise;
    totalRounded += cents;
    await admin.from("deal_payments").update({ interest_due: cents, amount_due: cents, principal_balance_at_time: newUPB, interest_rate_used: activeRate }).eq("id", fp.id);
  }

  // True-up final
  if (futurePayments && futurePayments.length > 0) {
    const diff = roundCents(totalPrecise - totalRounded);
    if (diff !== 0) {
      const lastId = futurePayments[futurePayments.length - 1].id;
      const { data: last } = await admin.from("deal_payments").select("amount_due, interest_due").eq("id", lastId).single();
      await admin.from("deal_payments").update({ interest_due: roundCents((last?.interest_due ?? 0) + diff), amount_due: roundCents((last?.amount_due ?? 0) + diff) }).eq("id", lastId);
    }
  }

  const newPerDiem = calculatePerDiemPrecise(newUPB, activeRate);
  await admin.from("unified_deals").update({ per_diem_interest: roundCents(newPerDiem), monthly_payment: roundCents(calculateInterestPrecise(newUPB, activeRate, 30)) }).eq("id", draw.deal_id);

  await admin.from("deal_servicing_events").insert({
    deal_id: draw.deal_id, event_type: "draw_funded_recalc", amount: draw.wire_amount,
    description: `Draw funded: ${formatCurrency(draw.wire_amount)}. UPB ${formatCurrency(oldUPB)} → ${formatCurrency(newUPB)}.`,
    metadata: { draw_id: drawId, wire_amount: draw.wire_amount, upb_before: oldUPB, upb_after: newUPB, rate_used: activeRate, payments_recalculated: futurePayments?.length ?? 0 },
  });

  revalidatePath(`/pipeline/${draw.deal_id}`);
}

export async function updateLoanTerms(dealId: string, terms: Record<string, any>) {
  const admin = createAdminClient();
  const { data: before } = await admin.from("unified_deals").select("loan_amount, interest_rate, default_rate, monthly_payment, payment_frequency, first_payment_date, maturity_date, origination_date, late_charge_pct, late_charge_grace_days, prepayment_penalty_pct, day_count_convention, loan_term_months").eq("id", dealId).single();

  await admin.from("unified_deals").update(terms).eq("id", dealId);

  await admin.from("deal_servicing_events").insert({
    deal_id: dealId, event_type: "terms_updated",
    description: "Loan terms updated",
    metadata: { before, after: terms },
  });

  revalidatePath(`/pipeline/${dealId}`);
}
