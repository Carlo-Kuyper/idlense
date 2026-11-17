/**
 * Curaçao — CRIB number / persoonsnummer (TIN).
 *
 * The Curaçao tax department allocates a "persoonsnummer" (also called the
 * CRIB number) on request to people and entities; the same number is used for
 * every tax. Curaçao's OECD TIN sheet says it is system-generated and has 9
 * digits, with no published structure or check digit. Sint Maarten's sheet
 * says its CRIB numbers (same origin, the former Netherlands Antilles) pass an
 * "11-proof", but Curaçao doesn't say so and no weights are published, so we
 * don't verify one. Confidence `moderate`.
 *
 * The identity-card number (ID-nummer) isn't covered: its format isn't
 * published in the card model decree or elsewhere we could find.
 */
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export const documents: DocumentSpec[] = [
  {
    code: "CW_CRIB",
    country: "CW",
    name: "Curaçao Tax Identification Number",
    localName: "Persoonsnummer",
    aliases: ["CRIB", "CRIB number", "TIN"],
    purpose: "tax",
    holder: "both",
    checksum: false,
    confidence: "moderate",
    lengths: [9],
    pattern: /^\d{9}$/,
    example: "123456789",
    sources: [
      "https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Curacao-TIN.pdf",
      "https://lookuptax.com/docs/tax-identification-number/curacao-tax-id-guide",
    ],
    normalize: digitsOnly,
    parse(id) {
      return { ok: true, data: { serial: id, extra: {} } };
    },
  },
];
