/**
 * Barbados — Taxpayer Identification Number (TIN), issued by the Barbados
 * Revenue Authority to individuals and companies that must file returns.
 *
 * Per the BRA's TIN sheet on the OECD AEOI portal: "a unique 13 digit
 * number", randomly generated, always starting with "1", digits only, no
 * slashes or dashes. No check digit or encoded data, so this is a shape check.
 *
 * No upstream library has it.
 */
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "BB_TIN",
    country: "BB",
    name: "Barbados Taxpayer Identification Number",
    aliases: ["TIN", "BRA TIN"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "moderate",
    lengths: [13],
    pattern: /^1\d{12}$/,
    example: "1234567890123",
    sources: ["https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/barbados-tin.pdf"],
    normalize: digitsOnly,
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
];
