/**
 * Marshall Islands — MISSA social security and employer numbers.
 *
 * The RMI issues no TINs. Per its TIN sheet for the OECD, taxpayers are
 * identified by numbers from the Marshall Islands Social Security
 * Administration (MISSA):
 * - MH_SSN, the employee identification number / personal social security
 *   number: "04" + 6 digits, written 04-086123 (issuer's example). It is also
 *   printed on passports and driver's licences.
 * - MH_EIN, the employer identification number: 5 digits + "04", written
 *   08612-04 (issuer's example).
 * "04" is the code the United States assigned to the Marshall Islands among
 * the freely associated states. No check digit is described. Confidence
 * `high` (issuer document).
 */
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

const OECD_SHEET = "https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/marshall-islands-tin.pdf";

export const documents: DocumentSpec[] = [
  {
    code: "MH_SSN",
    country: "MH",
    name: "Marshall Islands Social Security Number",
    aliases: ["SSN", "MISSA number", "employee identification number"],
    purpose: "social_security",
    holder: "person",
    checksum: false,
    confidence: "high",
    lengths: [8],
    pattern: /^04\d{6}$/,
    example: "04086123",
    sources: [OECD_SHEET, "http://www.rmimissa.org/"],
    normalize: digitsOnly,
    format: (c) => `${c.slice(0, 2)}-${c.slice(2)}`,
    parse(id) {
      return { ok: true, data: { serial: id.slice(2), extra: {} } };
    },
  },
  {
    code: "MH_EIN",
    country: "MH",
    name: "Marshall Islands Employer Identification Number",
    aliases: ["EIN", "MISSA employer number"],
    purpose: "tax",
    holder: "entity",
    checksum: false,
    confidence: "high",
    lengths: [7],
    pattern: /^\d{5}04$/,
    example: "0861204",
    sources: [OECD_SHEET, "http://www.rmimissa.org/"],
    normalize: digitsOnly,
    format: (c) => `${c.slice(0, 5)}-${c.slice(5)}`,
    parse(id) {
      return { ok: true, data: { serial: id.slice(0, 5), extra: {} } };
    },
  },
];
