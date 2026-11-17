/**
 * Greece — ΑΦΜ (tax number, also the VAT number), ΑΜΚΑ (social security number)
 * and the police identity card number (ΑΔΤ).
 *
 * ΑΦΜ, 9 digits: check digit = (Σ digit·2^(9-i) for the first 8 digits mod 11) mod 10.
 * Issued to people and companies alike. On VIES the prefix is `EL` (not `GR`);
 * both prefixes are accepted on input and dropped.
 *
 * ΑΜΚΑ, 11 digits: DDMMYY + 4-digit serial (odd for men, even for women) + Luhn
 * check digit (Law 2084/1992 art. 64; Law 3655/2008). The century isn't encoded:
 * we take the latest past date.
 *
 * ΑΔΤ: one or two Greek capital letters + 6 digits. Two letters on the cards
 * issued since 2000, one on older ones. No check digit. Latin lookalikes
 * (A, B, E, Z, H, I, K, M, N, O, P, T, Y, X) are mapped to the Greek letters,
 * as people often type them on a Latin keyboard.
 *
 * Improves on upstream:
 * - ΑΜΚΑ is new (neither upstream has it).
 * - ΑΦΜ 000000000 passes the checksum but is not an issued number; rejected.
 * - idnumbers' identity-card regex accepts lowercase and mixed Latin/Greek but
 *   gives no normalised form; we map lookalikes to Greek so the same card has one
 *   compact form. Old one-letter cards accept Latin lookalikes too.
 */
import { luhnValid, weightedSum } from "../core/algorithms.js";
import { birthFields, latestPastYear } from "../core/dates.js";
import { compact, digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export function afmCheckDigit(body8: string): number {
  return (weightedSum(body8, [256, 128, 64, 32, 16, 8, 4, 2]) % 11) % 10;
}

const LATIN_TO_GREEK: Record<string, string> = {
  A: "Α",
  B: "Β",
  E: "Ε",
  Z: "Ζ",
  H: "Η",
  I: "Ι",
  K: "Κ",
  M: "Μ",
  N: "Ν",
  O: "Ο",
  P: "Ρ",
  T: "Τ",
  Y: "Υ",
  X: "Χ",
};

/** compact() plus Greek uppercase and Latin lookalikes → Greek. */
export function normalizeGreekLetters(input: string): string {
  return compact(input)
    .replace(/[α-ω]/g, (c) => (c === "ς" ? "Σ" : c.toUpperCase()))
    .replace(/[ABEZHIKMNOPTYX]/g, (c) => LATIN_TO_GREEK[c]!);
}

export const documents: DocumentSpec[] = [
  {
    code: "GR_VAT",
    country: "GR",
    name: "Greek Tax Identification Number",
    localName: "Αριθμός Φορολογικού Μητρώου",
    aliases: ["AFM", "ΑΦΜ", "Greek VAT number", "EL VAT"],
    purpose: "tax",
    holder: "both",
    checksum: true,
    confidence: "high",
    lengths: [9],
    pattern: /^\d{9}$/,
    example: "123456783",
    sources: [
      "https://www.aade.gr/",
      "https://ec.europa.eu/taxation_customs/vies/",
      "https://en.wikipedia.org/wiki/VAT_identification_number",
    ],
    upstream: ["nationid", "idnumbers"],
    normalize: (input) => compact(input).replace(/^(EL|GR)/, ""),
    parse(id) {
      if (id === "000000000") return { ok: false, reason: "invalid_range" };
      if (afmCheckDigit(id) !== Number(id[8])) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { extra: {} } };
    },
  },
  {
    code: "GR_AMKA",
    country: "GR",
    name: "Greek Social Security Number",
    localName: "Αριθμός Μητρώου Κοινωνικής Ασφάλισης",
    aliases: ["AMKA", "ΑΜΚΑ"],
    purpose: "social_security",
    holder: "person",
    checksum: true,
    confidence: "moderate",
    lengths: [11],
    pattern: /^(0[1-9]|[12]\d|3[01])(0[1-9]|1[0-2])\d{7}$/,
    example: "01018012342",
    sources: [
      "https://www.amka.gr/",
      "https://el.wikipedia.org/wiki/%CE%91%CF%81%CE%B9%CE%B8%CE%BC%CF%8C%CF%82_%CE%9C%CE%B7%CF%84%CF%81%CF%8E%CE%BF%CF%85_%CE%9A%CE%BF%CE%B9%CE%BD%CF%89%CE%BD%CE%B9%CE%BA%CE%AE%CF%82_%CE%91%CF%83%CF%86%CE%AC%CE%BB%CE%B9%CF%83%CE%B7%CF%82",
    ],
    normalize: digitsOnly,
    format: (c) => group(c, [6, 5], " "),
    parse(id, { referenceDate }) {
      const day = Number(id.slice(0, 2));
      const month = Number(id.slice(2, 4));
      const yy = Number(id.slice(4, 6));
      const year = latestPastYear(yy, month, day, referenceDate);
      const birth = year === undefined ? undefined : birthFields(year, month, day, referenceDate);
      if (!birth) return { ok: false, reason: "invalid_date" };
      if (!luhnValid(id)) return { ok: false, reason: "invalid_checksum" };
      const serial = id.slice(6, 10);
      return {
        ok: true,
        data: { ...birth, gender: Number(id[9]) % 2 === 1 ? "male" : "female", serial, extra: {} },
      };
    },
  },
  {
    code: "GR_ADT",
    country: "GR",
    name: "Greek Identity Card Number",
    localName: "Αριθμός Δελτίου Ταυτότητας",
    aliases: ["ADT", "ΑΔΤ", "Δελτίο Ταυτότητας", "police ID"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "low",
    lengths: [7, 8],
    pattern: /^[Α-ΡΣ-Ω]{1,2}\d{6}$/,
    example: "ΑΒ123456",
    sources: [
      "https://www.astynomia.gr/",
      "https://en.wikipedia.org/wiki/Greek_identity_card",
    ],
    upstream: ["idnumbers"],
    normalize: normalizeGreekLetters,
    format: (c) => c.replace(/(\d{6})$/, " $1"),
    parse(id) {
      const letters = id.length - 6;
      return { ok: true, data: { serial: id.slice(letters), extra: { kind: letters === 2 ? "current" : "old" } } };
    },
  },
];
