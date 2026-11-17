/**
 * Dominica — Taxpayer Identification Number (TIN), issued by the Inland
 * Revenue Division to individuals and entities on application.
 *
 * Per the IRD's TIN sheet on the OECD AEOI portal: generated sequentially by
 * SIGTAS, "a maximum of six (6) digits and one (1) check digit"; the
 * taxpayer number used in practice is the TIN without its check digit. So a
 * number may be quoted with or without the check digit, and we can't tell
 * which. The check algorithm isn't published.
 *
 * Shape check only, confidence low: 1-7 digits. We also require a non-zero
 * first digit (a sequential number has no leading zero); the sheet doesn't
 * say so explicitly.
 *
 * No upstream library has it.
 */
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "DM_TIN",
    country: "DM",
    name: "Dominica Taxpayer Identification Number",
    aliases: ["TIN", "taxpayer number"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "low",
    lengths: [1, 2, 3, 4, 5, 6, 7],
    pattern: /^[1-9]\d{0,6}$/,
    example: "1234567",
    sources: ["https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/dominica-tin.pdf"],
    normalize: digitsOnly,
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
];
