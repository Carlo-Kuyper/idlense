/**
 * Saint Lucia — Taxpayer Identification Number (TIN), issued by the Inland
 * Revenue Department to individuals and entities on application.
 *
 * Per the IRD's TIN sheet on the OECD AEOI portal: numeric, generated in
 * sequential order, "a maximum of six (6) digits". A tax account number is
 * the TIN followed by a 2-digit tax type (TIN 1234 → VAT account 123427), so
 * an 8-digit number is an account number, not a TIN.
 *
 * Shape check only, confidence low: 1-6 digits. We also require a non-zero
 * first digit (a sequential number has no leading zero); the sheet doesn't
 * say so explicitly.
 *
 * No upstream library has it.
 */
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "LC_TIN",
    country: "LC",
    name: "Saint Lucia Taxpayer Identification Number",
    aliases: ["TIN"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "low",
    lengths: [1, 2, 3, 4, 5, 6],
    pattern: /^[1-9]\d{0,5}$/,
    example: "123456",
    sources: ["https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/saintlucia-tin.pdf"],
    normalize: digitsOnly,
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
];
