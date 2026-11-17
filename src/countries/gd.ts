/**
 * Grenada — Taxpayer Identification Number (TIN), issued by the Inland
 * Revenue Division to entities and to individuals liable to file a return.
 *
 * Per the IRD's TIN sheet on the OECD AEOI portal: "There is no TIN
 * structure other than the issuing of a six (6) digit unique number." No
 * check digit, so this is a shape check.
 *
 * No upstream library has it.
 */
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "GD_TIN",
    country: "GD",
    name: "Grenada Taxpayer Identification Number",
    aliases: ["TIN"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "moderate",
    lengths: [6],
    pattern: /^\d{6}$/,
    example: "123456",
    sources: ["https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/grenada-tin.pdf"],
    normalize: digitsOnly,
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
];
