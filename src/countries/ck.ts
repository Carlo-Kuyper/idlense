/**
 * Cook Islands — Revenue Management Division (RMD) number.
 *
 * The Cook Islands' TIN is the RMD number, issued on application to people and
 * entities (not automatically). Its OECD TIN sheet says: numeric, 5 digits
 * (NNNNN). No structure or check digit is published. Confidence `moderate`.
 *
 * Cook Islanders are New Zealand citizens, but NZ has no national ID number
 * and its IRD number is for NZ tax, so CK isn't mapped to NZ.
 */
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "CK_RMD",
    country: "CK",
    name: "Cook Islands Revenue Management Division Number",
    aliases: ["RMD number", "TIN"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "moderate",
    lengths: [5],
    pattern: /^\d{5}$/,
    example: "12345",
    sources: [
      "https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Cook-Islands-TIN.pdf",
      "http://www.mfem.gov.ck/tax/forms-returns#registrations",
    ],
    normalize: digitsOnly,
    parse(id) {
      return { ok: true, data: { serial: id, extra: {} } };
    },
  },
];
