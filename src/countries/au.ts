/**
 * Australia — tax, business, health and driver-licence numbers. Australia has
 * no national identity number.
 *
 * - TFN (Tax File Number): 9 digits, Σ d·(1,4,3,7,5,8,6,9,10) ≡ 0 (mod 11).
 *   Issued to individuals and to entities (OECD TIN sheet). Older TFNs have
 *   8 digits, but the ATO doesn't publish their weights and secondary sources
 *   disagree, so we only accept the 9-digit form.
 * - ABN (Australian Business Number): 11 digits. Subtract 1 from the first
 *   digit, Σ d·(10,1,3,5,...,19) ≡ 0 (mod 89) (ABR). Companies' ABN is their
 *   ACN with two leading check digits.
 * - ACN (Australian Company Number): 9 digits, check = (10 − Σ d·(8..1) mod 10) mod 10 (ASIC).
 * - Medicare card number: 10 digits, first 2-6, 9th digit = Σ d·(1,3,7,9,1,3,7,9) mod 10,
 *   10th digit the card issue number; an 11th digit (the IRN, the person's
 *   line on the card) is often written after it. The check-digit weights are
 *   not officially published. Services Australia says the issue number runs
 *   1-9 (after 9 it wraps back to 1) and the IRN is 1-9, so a 0 in either
 *   position is `invalid_format`. The check digit isn't the last character,
 *   so the spec sets `checkIndex: 8`.
 * - Driver licence: issued per state, no check digit; shape only.
 *
 * Improves on upstream:
 * - idnumbers TFN reads an 8-digit TFN by inserting a 0 before the last digit,
 *   which is unsourced; we reject 8-digit TFNs instead of guessing.
 * - idnumbers Medicare doesn't parse the trailing digits; we extract the
 *   card issue number and the IRN.
 * - idnumbers Medicare accepts an issue number or IRN of 0; Services Australia
 *   says both are 1-9, so we reject 0.
 * - idnumbers driver licence rejects numbers whose last five digits repeat
 *   (a DLP false-positive heuristic, not an issuer rule); we don't.
 * - Adds ABN and ACN (no upstream counterpart).
 */
import { weightedSum } from "../core/algorithms.js";
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec, ParseOutcome } from "../core/types.js";

const TFN_W = [1, 4, 3, 7, 5, 8, 6, 9, 10];
const ABN_W = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
const ACN_W = [8, 7, 6, 5, 4, 3, 2, 1];
const MEDICARE_W = [1, 3, 7, 9, 1, 3, 7, 9];

export function abnValid(abn: string): boolean {
  const adjusted = String(Number(abn[0]) - 1) + abn.slice(1);
  return weightedSum(adjusted, ABN_W) % 89 === 0;
}

export function acnCheckDigit(first8: string): number {
  return (10 - (weightedSum(first8, ACN_W) % 10)) % 10;
}

const fail = (reason: "invalid_checksum"): ParseOutcome => ({ ok: false, reason });

const OECD_AU = "https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/australia-tin.pdf";

export const documents: DocumentSpec[] = [
  {
    code: "AU_TFN",
    country: "AU",
    name: "Australian Tax File Number",
    aliases: ["TFN"],
    purpose: "tax",
    holder: "both",
    checksum: true,
    confidence: "high",
    lengths: [9],
    pattern: /^\d{9}$/,
    example: "123456782",
    sources: [
      "https://www.ato.gov.au/individuals-and-families/tax-file-number",
      OECD_AU,
      "https://en.wikipedia.org/wiki/Tax_file_number",
    ],
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    format: (c) => group(c, [3, 3, 3], " "),
    parse: (id) => (weightedSum(id, TFN_W) % 11 === 0 ? { ok: true, data: { extra: {} } } : fail("invalid_checksum")),
  },
  {
    code: "AU_ABN",
    country: "AU",
    name: "Australian Business Number",
    aliases: ["ABN"],
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "high",
    lengths: [11],
    pattern: /^[1-9]\d{10}$/,
    example: "51824753556",
    sources: ["https://abr.business.gov.au/Help/AbnFormat", OECD_AU],
    normalize: digitsOnly,
    format: (c) => group(c, [2, 3, 3, 3], " "),
    parse: (id) => (abnValid(id) ? { ok: true, data: { extra: {} } } : fail("invalid_checksum")),
  },
  {
    code: "AU_ACN",
    country: "AU",
    name: "Australian Company Number",
    aliases: ["ACN", "ARBN"],
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "high",
    lengths: [9],
    pattern: /^\d{9}$/,
    example: "000250000",
    sources: [
      "https://asic.gov.au/for-business/registering-a-company/steps-to-register-a-company/australian-company-numbers/australian-company-number-digit-check/",
    ],
    normalize: digitsOnly,
    format: (c) => group(c, [3, 3, 3], " "),
    parse: (id) =>
      acnCheckDigit(id.slice(0, 8)) === Number(id[8]) ? { ok: true, data: { extra: {} } } : fail("invalid_checksum"),
  },
  {
    code: "AU_MEDICARE",
    country: "AU",
    name: "Australian Medicare Card Number",
    aliases: ["Medicare number"],
    purpose: "health",
    holder: "person",
    // The 9th digit is the check digit; the issue number / IRN follow it.
    checksum: true,
    checkIndex: 8,
    confidence: "moderate",
    lengths: [10, 11],
    // 8-digit serial, check digit, issue number 1-9, optional IRN 1-9
    pattern: /^[2-6]\d{8}[1-9][1-9]?$/,
    example: "21234567011",
    sources: [
      "https://www.servicesaustralia.gov.au/medicare-card",
      "https://operational.servicesaustralia.gov.au/public/Pages/your-health/011-44150000-01.html",
      "https://stackoverflow.com/questions/3589345/how-do-i-validate-an-australian-medicare-number",
    ],
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    format: (c) => group(c, [4, 5, 1, 1], " "),
    parse(id) {
      if (weightedSum(id, MEDICARE_W) % 10 !== Number(id[8])) return fail("invalid_checksum");
      const extra: Record<string, number> = { issueNumber: Number(id[9]) };
      if (id.length === 11) extra.irn = Number(id[10]);
      return { ok: true, data: { serial: id.slice(0, 8), extra } };
    },
  },
  {
    code: "AU_DL",
    country: "AU",
    name: "Australian Driver Licence Number",
    aliases: ["driver's licence", "driver license"],
    purpose: "driver_license",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [6, 8, 9, 10],
    // 8-10 digits (most states) or one letter + 5 digits (SA, TAS)
    pattern: /^(\d{8,10}|[A-Z]\d{5})$/,
    example: "1234567890",
    sources: ["https://learn.microsoft.com/en-us/purview/sit-defn-australia-drivers-license-number"],
    upstream: ["idnumbers"],
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
];
