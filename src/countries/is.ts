/**
 * Iceland — kennitala (persons and legal entities) and VSK number.
 *
 * Kennitala: DDMMYY-RRKC, 10 digits (Þjóðskrá).
 * - RR two serial digits.
 * - K the old check digit: 11 - (Σ d·(3,2,7,6,5,4,3,2) mod 11). Þjóðskrá
 *   stopped calculating it on 18 February 2026 and asks users to drop the
 *   check, so it is reported as `extra.legacyCheckDigit` and not enforced.
 * - C century: 8 → 1800s, 9 → 1900s, 0 → 2000s.
 * - Legal entities use the same layout with day + 40 (41-71).
 *
 * VSK (VAT) number: 5-6 digits, no published check digit.
 *
 * Improves on upstream (the published idnumbers 2.3.0 we test against; its
 * newer source has since fixed the first two):
 * - idnumbers enforces the check digit Þjóðskrá stopped issuing in 2026.
 * - idnumbers rejects century digit 8 (people born in the 1800s).
 * - idnumbers' legacy check also rejects every number whose check digit is
 *   1 (sum mod 11 = 10); only a computed 10 means "never issued".
 * - idnumbers accepts future birth dates (a 2000s century digit with YY = 99);
 *   rejected as `invalid_date`.
 * - idnumbers rejects company kennitölur (day + 40); they're added as
 *   IS_KENNITALA_ENTITY.
 * - idnumbers builds the birth date with `new Date` and returns it shifted by
 *   the server timezone (120174 → 1974-01-11T22:00Z); we return a plain
 *   YYYY-MM-DD string.
 */
import { weightedSum } from "../core/algorithms.js";
import { birthFields, isPastDate } from "../core/dates.js";
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

const CENTURY: Record<string, number> = { "8": 1800, "9": 1900, "0": 2000 };

/** Whether the pre-2026 check digit (9th digit) is right. */
export function kennitalaLegacyCheck(id: string): boolean {
  const k = 11 - (weightedSum(id, [3, 2, 7, 6, 5, 4, 3, 2]) % 11);
  return (k === 11 ? 0 : k) === Number(id[8]);
}

const SOURCES = [
  "https://www.skra.is/folk/eg-i-thjodskra/um-kennitolur/",
  "https://www.skra.is/um-okkur/frettir/frett/2025/05/14/Kennitolur-an-vartolu/",
  "https://en.wikipedia.org/wiki/Icelandic_identification_number",
];

export const documents: DocumentSpec[] = [
  {
    code: "IS_KENNITALA",
    country: "IS",
    name: "Icelandic Identification Number",
    localName: "Kennitala",
    aliases: ["kt.", "kennitala"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "high",
    lengths: [10],
    pattern: /^(0[1-9]|[12]\d|3[01])(0[1-9]|1[0-2])\d{5}[890]$/,
    example: "1201743399",
    sources: SOURCES,
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    format: (c) => `${c.slice(0, 6)}-${c.slice(6)}`,
    parse(id, { referenceDate }) {
      const birth = birthFields(
        CENTURY[id[9]!]! + Number(id.slice(4, 6)),
        Number(id.slice(2, 4)),
        Number(id.slice(0, 2)),
        referenceDate,
      );
      if (!birth) return { ok: false, reason: "invalid_date" };
      return { ok: true, data: { ...birth, serial: id.slice(6, 8), extra: { legacyCheckDigit: kennitalaLegacyCheck(id) } } };
    },
  },
  {
    code: "IS_KENNITALA_ENTITY",
    country: "IS",
    name: "Icelandic Legal Entity Identification Number",
    localName: "Kennitala lögaðila",
    aliases: ["company kennitala"],
    purpose: "tax",
    holder: "entity",
    checksum: false,
    confidence: "moderate",
    lengths: [10],
    // day + 40
    pattern: /^(4[1-9]|[56]\d|7[01])(0[1-9]|1[0-2])\d{5}[890]$/,
    example: "5902697199",
    sources: SOURCES,
    normalize: digitsOnly,
    format: (c) => `${c.slice(0, 6)}-${c.slice(6)}`,
    parse(id, { referenceDate }) {
      const year = CENTURY[id[9]!]! + Number(id.slice(4, 6));
      const month = Number(id.slice(2, 4));
      const day = Number(id.slice(0, 2)) - 40;
      if (!isPastDate(year, month, day, referenceDate)) return { ok: false, reason: "invalid_date" };
      return {
        ok: true,
        data: { serial: id.slice(6, 8), extra: { registrationYear: year, legacyCheckDigit: kennitalaLegacyCheck(id) } },
      };
    },
  },
  {
    code: "IS_VSK",
    country: "IS",
    name: "Icelandic VAT Number",
    localName: "Virðisaukaskattsnúmer",
    aliases: ["VSK", "VAT"],
    purpose: "tax",
    holder: "entity",
    checksum: false,
    confidence: "moderate",
    lengths: [5, 6],
    pattern: /^\d{5,6}$/,
    example: "123456",
    sources: ["https://www.skatturinn.is/", "https://en.wikipedia.org/wiki/VAT_identification_number"],
    upstream: ["nationid"],
    normalize: (s) => digitsOnly(s.replace(/^\s*IS/i, "")),
    parse: () => ({ ok: true, data: { extra: {} } }),
  },
];
