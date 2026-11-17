/**
 * Jamaica — Taxpayer Registration Number (TRN), issued by Tax Administration
 * Jamaica to individuals, businesses and organisations.
 *
 * 9 digits, randomly generated, no published check digit. Per TAJ's CRS
 * submission to the OECD, the first digit is currently 1 for individuals and
 * 0 for organisations; we require one of the two.
 *
 * No upstream library has it.
 */
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "JM_TRN",
    country: "JM",
    name: "Jamaican Taxpayer Registration Number",
    aliases: ["TRN"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "moderate",
    lengths: [9],
    pattern: /^[01]\d{8}$/,
    example: "123456789",
    sources: [
      "https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/jamaica-tin.pdf",
      "https://www.jamaicatax.gov.jm/web/guest/trn1",
    ],
    normalize: digitsOnly,
    format: (c) => group(c, [3, 3, 3], "-"),
    parse: (id) => ({ ok: true, data: { extra: { holderType: id[0] === "1" ? "individual" : "organization" } } }),
  },
];
