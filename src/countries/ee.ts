/**
 * Estonia — isikukood (personal identification code) and KMKR (VAT number).
 *
 * Isikukood, 11 digits: G YYMMDD SSS C (EVS 585, as published by the Tax and
 * Customs Board in the OECD TIN sheet).
 * - G   sex and century: 1/2 → 1800s, 3/4 → 1900s, 5/6 → 2000s; odd male, even female.
 * - SSS serial separating people born on the same day (before 2013 the first
 *       digits also identified the hospital; not decoded).
 * - C   mod 11 with weights 1..9,1; on remainder 10 retry with 3..9,1,2,3;
 *       a second 10 gives 0. Shared with Lithuania (`balticCheckDigit`).
 *
 * KMKR (VAT), `EE` + 9 digits: weights 3,7,1,... and the weighted sum of all
 * nine digits is a multiple of 10.
 *
 * Improves on upstream:
 * - idnumbers accepts G = 7/8 (2100s), which the standard doesn't define;
 *   we reject G outside 1-6 as `invalid_format`.
 * - idnumbers accepts birth dates in the future.
 */
import { weightedSum } from "../core/algorithms.js";
import { birthFields } from "../core/dates.js";
import { compact, digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

/**
 * Two-pass mod 11 check digit used by Estonia and Lithuania: weights cycle
 * 1..9 (first pass) or 3..9,1,2 (second pass) from the first digit.
 */
export function balticCheckDigit(body: string): number {
  const w1 = Array.from({ length: body.length }, (_, i) => (i % 9) + 1);
  const r1 = weightedSum(body, w1) % 11;
  if (r1 < 10) return r1;
  const w2 = Array.from({ length: body.length }, (_, i) => ((i + 2) % 9) + 1);
  const r2 = weightedSum(body, w2) % 11;
  return r2 < 10 ? r2 : 0;
}

/** Shared century/sex digit (Estonia, Lithuania): 1-6. */
export function balticCenturyGender(g: number): { century: number; gender: "male" | "female" } | undefined {
  if (g < 1 || g > 6) return undefined;
  return { century: 1800 + Math.floor((g - 1) / 2) * 100, gender: g % 2 === 1 ? "male" : "female" };
}

const VAT_WEIGHTS = [3, 7, 1, 3, 7, 1, 3, 7, 1];

function normalizeVat(input: string): string {
  const c = compact(input);
  return /^\d{9}$/.test(c) ? "EE" + c : c;
}

export const documents: DocumentSpec[] = [
  {
    code: "EE_ISIKUKOOD",
    country: "EE",
    name: "Estonian Personal Identification Code",
    localName: "Isikukood",
    aliases: ["IK", "personal code", "personal identification code"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [11],
    // G 1-6, MM 01-12, DD 01-31
    pattern: /^[1-6]\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{4}$/,
    example: "38001010009",
    sources: [
      "https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/estonia-tin.pdf",
      "https://www.riigiteataja.ee/akt/106032012004",
      "https://et.wikipedia.org/wiki/Isikukood",
    ],
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    parse(id, { referenceDate }) {
      const cg = balticCenturyGender(Number(id[0]));
      if (!cg) return { ok: false, reason: "invalid_format" };
      const birth = birthFields(cg.century + Number(id.slice(1, 3)), Number(id.slice(3, 5)), Number(id.slice(5, 7)), referenceDate);
      if (!birth) return { ok: false, reason: "invalid_date" };
      if (balticCheckDigit(id.slice(0, 10)) !== Number(id[10])) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { ...birth, gender: cg.gender, serial: id.slice(7, 10), extra: {} } };
    },
  },
  {
    code: "EE_VAT",
    country: "EE",
    name: "Estonian VAT Number",
    localName: "Käibemaksukohustuslase number",
    aliases: ["KMKR", "VAT", "KMKR number"],
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "moderate",
    lengths: [11],
    pattern: /^EE\d{9}$/,
    example: "EE100931558",
    sources: [
      "https://www.emta.ee/en/business-client/registration-business/vat-registration",
      "https://ec.europa.eu/taxation_customs/vies/",
    ],
    upstream: ["nationid"],
    normalize: normalizeVat,
    format: (c) => `EE ${c.slice(2)}`,
    parse(id) {
      if (weightedSum(id.slice(2), VAT_WEIGHTS) % 10 !== 0) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { extra: {} } };
    },
  },
];
