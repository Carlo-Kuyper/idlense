/**
 * Belize — Tax Identification Number (TIN), issued by the Belize Tax Service
 * to employees, sole proprietors, partnerships and companies.
 *
 * Per the Belize Tax Service's TIN sheet on the OECD AEOI portal: taxpayers
 * registered through the Revenue Management System get a 6-digit TIN plus a
 * single check digit at the end, and "the check digit is not visible to the
 * taxpayer". So people usually quote 6 digits; we accept 6 or 7. The check
 * digit's algorithm isn't published, so this is a shape check.
 *
 * No upstream library has it.
 */
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "BZ_TIN",
    country: "BZ",
    name: "Belize Tax Identification Number",
    aliases: ["TIN", "BTS TIN"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "moderate",
    lengths: [6, 7],
    pattern: /^\d{6,7}$/,
    example: "1234567",
    sources: [
      "https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/belize-tin.pdf",
      "https://bts.gov.bz/",
    ],
    normalize: digitsOnly,
    parse: (id) => ({
      ok: true,
      data: { serial: id.slice(0, 6), extra: { hasCheckDigit: id.length === 7 } },
    }),
  },
];
