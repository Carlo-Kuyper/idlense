/**
 * Nauru — Taxpayer Identification Number.
 *
 * Per the Nauru Revenue Office's TIN sheet for the OECD, the TIN
 * Registration Data Base generates a unique number of 9 digits for every
 * taxpayer (individuals and entities), shown as 123-456-789 in the sheet.
 * No structure or check digit is described. Confidence `high` for the
 * length (issuer document).
 */
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "NR_TIN",
    country: "NR",
    name: "Nauru Taxpayer Identification Number",
    aliases: ["TIN", "NRO TIN"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "high",
    lengths: [9],
    pattern: /^\d{9}$/,
    example: "123456789",
    sources: ["https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/nauru-tin.pdf"],
    normalize: digitsOnly,
    format: (c) => group(c, [3, 3, 3], "-"),
    parse() {
      return { ok: true, data: { extra: {} } };
    },
  },
];
