/**
 * Oman — VAT / excise Tax Identification Number.
 *
 * The Oman Tax Authority's TIN sheet for the OECD says the VAT and excise TIN
 * "consists of 12 alphabetic-numeric characters"; secondary sources (and the
 * PINT-OM e-invoicing scheme) give the layout as "OM" + 10 digits. No check
 * digit is published. Confidence `moderate` for the layout.
 *
 * Not covered:
 * - the civil number (الرقم المدني): Royal Decree 66/1999 leaves its make-up to
 *   the executive regulation, which we couldn't obtain; no length is sourced.
 * - the entity tax card number: "up to seven digits" with no other rule,
 *   which would accept any short number.
 */
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "OM_VAT",
    country: "OM",
    name: "Omani VAT Tax Identification Number",
    aliases: ["VATIN", "VAT number", "TIN", "الرقم الضريبي"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "moderate",
    lengths: [12],
    pattern: /^OM\d{10}$/,
    example: "OM1100012345",
    sources: [
      "https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Oman-TIN.pdf",
      "https://lookuptax.com/validate/oman/vat",
    ],
    parse(id) {
      return { ok: true, data: { serial: id.slice(2), extra: {} } };
    },
  },
];
