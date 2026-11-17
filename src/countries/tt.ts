/**
 * Trinidad and Tobago — Board of Inland Revenue file number (BIR number), the
 * taxpayer number for individuals, companies, partnerships and trusts
 * (Income Tax Act Chap. 75:01, s. 76/76A).
 *
 * Per the BIR's CRS submission to the OECD: 10 digits, system-generated, never
 * reused, no check digit and no digit that marks the taxpayer type. So this
 * is a shape check only.
 *
 * No upstream library has it.
 */
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "TT_BIR",
    country: "TT",
    name: "Trinidad and Tobago Board of Inland Revenue Number",
    aliases: ["BIR number", "BIR file number", "TIN"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "moderate",
    lengths: [10],
    pattern: /^\d{10}$/,
    example: "1234567890",
    sources: [
      "https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/trinidad-and-tobago-tin.pdf",
      "https://www.ird.gov.tt/",
    ],
    normalize: digitsOnly,
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
];
