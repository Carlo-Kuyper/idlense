/**
 * Anguilla — Inland Revenue Department TIN.
 *
 * Issued to individuals and entities when they register with the IRD (for a
 * business or driver's licence, a certificate of good standing, ...), not
 * automatically to all residents. Anguilla's OECD TIN sheet says it is a
 * unique, system-generated 10-digit number used for every tax type; it
 * replaced the older Customer Identification and Enterprise numbers. The
 * sheet says individual TINs start with 1 and business TINs with 2, so the
 * pattern is `^[12]\d{9}$` and the holder kind goes into `extra.kind`. The
 * check-digit algorithm is not published, so `checksum` is false.
 * Confidence `moderate`.
 */
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "AI_TIN",
    country: "AI",
    name: "Anguilla Taxpayer Identification Number",
    aliases: ["TIN", "IRD number"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "moderate",
    lengths: [10],
    pattern: /^[12]\d{9}$/,
    example: "1234567890",
    sources: [
      "https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Anguilla-TIN.pdf",
    ],
    normalize: digitsOnly,
    parse(id) {
      return { ok: true, data: { serial: id, extra: { kind: id[0] === "1" ? "individual" : "business" } } };
    },
  },
];
