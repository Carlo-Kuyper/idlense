/**
 * Iran — national code (کد ملی, code melli), 10 digits: CCC SSSSSS K.
 *
 * - CCC    code of the civil-registration office (city) that issued it.
 * - SSSSSS serial.
 * - K      check digit: S = Σ d[i] × (10 − i) over the first nine digits,
 *          r = S mod 11, K = r when r < 2, else 11 − r.
 * - Numbers made of one repeated digit (1111111111, ...) pass the check but
 *   are placeholders, not issued codes (e.g. office 000 / 111 / 999), and the
 *   commonly used validators reject them.
 * - The code is often stored as an integer, losing leading zeros (Tehran codes
 *   start with 00). 8-9 digit input is left-padded to 10.
 *
 * Ported from idnumbers.
 *
 * Improves on upstream:
 * - idnumbers accepts the repeated-digit numbers (1111111111, 2222222222, ...).
 * - idnumbers rejects 8-9 digit input whose leading zeros were dropped.
 */
import { digit } from "../core/algorithms.js";
import { compact, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export function codeMelliCheckDigit(body9: string): number {
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += digit(body9, i) * (10 - i);
  const r = sum % 11;
  return r < 2 ? r : 11 - r;
}

export const documents: DocumentSpec[] = [
  {
    code: "IR_NID",
    country: "IR",
    name: "Iranian National Code",
    localName: "کد ملی",
    aliases: ["code melli", "kart-e melli", "national ID", "shomare melli"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "moderate",
    lengths: [10],
    pattern: /^\d{10}$/,
    example: "0012345679",
    sources: [
      "https://www.sabteahval.ir/",
      "https://fa.wikipedia.org/wiki/کارت_شناسایی_ملی",
      "https://en.wikipedia.org/wiki/National_identification_number#Iran,_Islamic_Republic_of",
    ],
    upstream: ["idnumbers"],
    normalize(input) {
      const c = compact(input);
      return /^\d{8,9}$/.test(c) ? c.padStart(10, "0") : c;
    },
    format: (c) => group(c, [3, 6, 1], "-"),
    parse(id) {
      if (/^(\d)\1{9}$/.test(id)) return { ok: false, reason: "invalid_format" };
      if (codeMelliCheckDigit(id) !== digit(id, 9)) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { region: id.slice(0, 3), serial: id.slice(3, 9), extra: {} } };
    },
  },
];
