// ═══════════════════════════════════════════════════════════
// Financial Functions for Formula Engine
// Excel-compatible implementations of TVM and cashflow functions
// ═══════════════════════════════════════════════════════════

import type { MathJsInstance } from "mathjs";

/**
 * PMT - Payment for a loan based on constant payments and a constant interest rate.
 * Matches Excel PMT(rate, nper, pv, [fv], [type])
 */
function pmt(rate: number, nper: number, pv: number, fv = 0, type = 0): number {
  if (nper === 0) return 0;
  if (rate === 0) return -(pv + fv) / nper;
  const pvif = Math.pow(1 + rate, nper);
  let payment = (rate * (pv * pvif + fv)) / (pvif - 1);
  if (type === 1) payment /= 1 + rate;
  return -payment;
}

/**
 * IPMT - Interest portion of a payment for a given period.
 */
function ipmt(rate: number, per: number, nper: number, pv: number, fv = 0, type = 0): number {
  const payment = pmt(rate, nper, pv, fv, type);
  if (per === 1) {
    return type === 1 ? 0 : -pv * rate;
  }
  const cumPrincipal = fvCalc(rate, per - 1, payment, pv, type) * rate;
  return type === 1 ? cumPrincipal / (1 + rate) : cumPrincipal;
}

/**
 * PPMT - Principal portion of a payment for a given period.
 */
function ppmt(rate: number, per: number, nper: number, pv: number, fv = 0, type = 0): number {
  return pmt(rate, nper, pv, fv, type) - ipmt(rate, per, nper, pv, fv, type);
}

/**
 * FV - Future value of an investment.
 */
function fvCalc(rate: number, nper: number, payment: number, pv: number, type = 0): number {
  if (rate === 0) return -(pv + payment * nper);
  const pvif = Math.pow(1 + rate, nper);
  const fvResult = -pv * pvif - (payment * (1 + rate * type) * (pvif - 1)) / rate;
  return fvResult;
}

/**
 * PV - Present value of an investment.
 */
function pvCalc(rate: number, nper: number, payment: number, fv = 0, type = 0): number {
  if (rate === 0) return -(fv + payment * nper);
  const pvif = Math.pow(1 + rate, nper);
  const pvResult = (-fv - (payment * (1 + rate * type) * (pvif - 1)) / rate) / pvif;
  return pvResult;
}

/**
 * NPER - Number of periods for an investment.
 */
function nperCalc(rate: number, payment: number, pv: number, fv = 0, type = 0): number {
  if (rate === 0) return -(pv + fv) / payment;
  const z = payment * (1 + rate * type) / rate;
  return Math.log((-fv + z) / (pv + z)) / Math.log(1 + rate);
}

/**
 * NPV - Net present value of a series of cashflows.
 */
function npvCalc(rate: number, ...cashflows: number[]): number {
  let npv = 0;
  for (let i = 0; i < cashflows.length; i++) {
    npv += cashflows[i] / Math.pow(1 + rate, i + 1);
  }
  return npv;
}

/**
 * IRR - Internal rate of return using Newton-Raphson method.
 * Accepts cashflows as variadic args: IRR(cf0, cf1, cf2, ...) or IRR([cf0, cf1, cf2, ...])
 */
function irrCalc(...args: (number | number[])[]): number {
  // Handle both IRR(cf0, cf1, cf2) and IRR([cf0, cf1, cf2])
  let cashflows: number[];
  if (args.length === 1 && Array.isArray(args[0])) {
    cashflows = args[0];
  } else {
    cashflows = args as number[];
  }

  if (cashflows.length < 2) return NaN;

  // Newton-Raphson
  let guess = 0.1;
  const maxIter = 100;
  const tolerance = 1e-7;

  for (let iter = 0; iter < maxIter; iter++) {
    let fValue = 0;
    let fDerivative = 0;
    for (let i = 0; i < cashflows.length; i++) {
      const factor = Math.pow(1 + guess, i);
      fValue += cashflows[i] / factor;
      if (i > 0) fDerivative -= (i * cashflows[i]) / (factor * (1 + guess));
    }
    if (Math.abs(fValue) < tolerance) return guess;
    if (fDerivative === 0) break;
    guess = guess - fValue / fDerivative;
  }

  return guess;
}

/**
 * RATE - Interest rate per period using Newton-Raphson.
 * RATE(nper, pmt, pv, [fv], [type])
 */
function rateCalc(nper: number, payment: number, pv: number, fv = 0, type = 0): number {
  let guess = 0.01;
  const maxIter = 100;
  const tolerance = 1e-7;

  for (let iter = 0; iter < maxIter; iter++) {
    const pvif = Math.pow(1 + guess, nper);
    const y = pv * pvif + payment * (1 + guess * type) * (pvif - 1) / guess + fv;
    const dy = nper * pv * Math.pow(1 + guess, nper - 1)
      + payment * (1 + guess * type) * (nper * Math.pow(1 + guess, nper - 1) * guess - (pvif - 1)) / (guess * guess)
      + (type === 1 ? payment * (pvif - 1) / guess : 0);

    if (Math.abs(y) < tolerance) return guess;
    if (dy === 0) break;
    guess -= y / dy;
  }

  return guess;
}

export function registerFinancialFunctions(math: MathJsInstance): void {
  math.import(
    {
      PMT: pmt,
      IPMT: ipmt,
      PPMT: ppmt,
      FV: fvCalc,
      PV: pvCalc,
      NPER: nperCalc,
      NPV: npvCalc,
      IRR: irrCalc,
      RATE: rateCalc,
      // Lowercase aliases for convenience
      pmt,
      ipmt,
      ppmt,
      fv: fvCalc,
      pv: pvCalc,
      nper: nperCalc,
      npv: npvCalc,
      irr: irrCalc,
      rate: rateCalc,
    },
    { override: false }
  );
}
