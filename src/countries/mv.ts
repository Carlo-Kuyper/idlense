/**
 * Maldives — MIRA Taxpayer Identification Number.
 *
 * Per MIRA's TIN sheet for the OECD, every taxpayer gets a unique 7-digit
 * business partner (BP) number, and each tax registration gets a TIN built
 * as {BP}{revenue code}{running number}, e.g. the sheet's specimen
 * 1000001GST501: BP 1000001, tax type GST, registration 501. Revenue codes
 * listed include BIT (bank profit tax), IIT (insurance), PIT (personal income
 * tax), CIT (corporate income tax), EWT/NWT (withholding), GST and GRT (green
 * tax); we accept any three letters since the list may not be complete. We
 * accept both the bare BP number and the full registration TIN. No check
 * digit is described. Confidence `high` (issuer document).
 *
 * Not covered: the national ID card number. The "A" + 6 digits form
 * couldn't be confirmed from an official source.
 */
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "MV_TIN",
    country: "MV",
    name: "Maldives Taxpayer Identification Number",
    aliases: ["MIRA TIN", "TIN", "BP number", "business partner number", "GST TIN"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "high",
    lengths: [7, 13],
    pattern: /^\d{7}([A-Z]{3}\d{3})?$/,
    example: "1000001GST501",
    sources: [
      "https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Maldives-TIN.pdf",
      "https://www.mira.gov.mv/Pages/View/gstlookup",
    ],
    parse(id) {
      const extra: Record<string, string> = { businessPartnerNumber: id.slice(0, 7) };
      if (id.length === 13) {
        extra.taxType = id.slice(7, 10);
        extra.registration = id.slice(10);
      }
      return { ok: true, data: { serial: id.slice(0, 7), extra } };
    },
  },
];
