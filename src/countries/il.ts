/**
 * Israel — Teudat Zehut (מספר זהות), 9 digits: 8 digits + a check digit.
 *
 * - Check digit: weights 1,2,1,2,... from the left, two-digit products
 *   reduced to their digit sum, total ≡ 0 (mod 10). That is the Luhn scheme.
 * - Older numbers are often written with fewer digits because the leading
 *   zeros are dropped (e.g. by spreadsheets). The standard check pads to 9
 *   digits with leading zeros first (he.wikipedia, מספר זהות), so 5-8 digit
 *   input is padded here too.
 * - The number encodes nothing about the holder.
 *
 * Ported from idnumbers and personal-identity-validation.
 *
 * Improves on upstream:
 * - personal-identity-validation rejects numbers with a leading zero, which
 *   are valid and common (older IDs).
 * - idnumbers requires exactly 9 digits; we pad 5-8 digit input.
 * - Both accept the all-zero number 000000000 (it passes Luhn); it's never issued.
 */
import { luhnValid } from "../core/algorithms.js";
import { compact, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

/** Compact, then left-pad 5-8 digit numbers to 9 digits. */
export function padTeudatZehut(input: string): string {
  const c = compact(input);
  return /^\d{5,8}$/.test(c) ? c.padStart(9, "0") : c;
}

export const documents: DocumentSpec[] = [
  {
    code: "IL_TZ",
    country: "IL",
    name: "Israeli Identity Number",
    localName: "מספר זהות",
    aliases: ["Teudat Zehut", "Mispar Zehut", "TZ", "Israeli ID"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "high",
    lengths: [9],
    pattern: /^\d{9}$/,
    example: "123456782",
    sources: [
      "https://www.gov.il/en/departments/population_and_immigration_authority",
      "https://he.wikipedia.org/wiki/מספר_זהות",
      "https://en.wikipedia.org/wiki/Israeli_identity_card",
    ],
    upstream: ["idnumbers", "personal-identity-validation"],
    normalize: padTeudatZehut,
    format: (c) => group(c, [8, 1], "-"),
    parse(id) {
      if (/^0+$/.test(id)) return { ok: false, reason: "invalid_format" };
      if (!luhnValid(id)) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { extra: {} } };
    },
  },
];
