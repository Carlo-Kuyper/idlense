/**
 * Tajikistan — taxpayer identification number (ИНН / РМА).
 *
 * 9 digits, issued by the Tax Committee to legal entities and individuals.
 * One secondary source says digits 1-2 are the tax office, 3 a status digit
 * and 4-8 a serial; that is unverified, so we extract nothing.
 *
 * The last digit is a check digit. The rule isn't published; we use one
 * derived from the official e-procurement supplier register:
 * r = Σ d[i]·(10,7,5,10,4,3,8,6) mod 11; check = r, or 5 when r = 10
 * (seen in 12 of 12 such cases). It matched 239 of 240 registered suppliers,
 * e.g. 640001675 (military unit 08030), 040052973, 010011817; the miss was a
 * number starting with 9, so foreign-entity numbers may follow another rule.
 * Confidence `low` (reverse-engineered).
 *
 * Not covered: a personal number on the ID card or passport (none found)
 * and the 10-digit unified entity number (one commercial source only).
 */
import { weightedSum } from "../core/algorithms.js";
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

const WEIGHTS = [10, 7, 5, 10, 4, 3, 8, 6];

export function tjInnCheckDigit(first8: string): number {
  const r = weightedSum(first8, WEIGHTS) % 11;
  return r === 10 ? 5 : r;
}

export const documents: DocumentSpec[] = [
  {
    code: "TJ_INN",
    country: "TJ",
    name: "Tajik Taxpayer Identification Number",
    localName: "Рақами мушаххаси андозсупоранда",
    aliases: ["INN", "ИНН", "РМА", "TIN"],
    purpose: "tax",
    holder: "both",
    checksum: true,
    confidence: "low",
    lengths: [9],
    pattern: /^\d{9}$/,
    example: "012345673",
    sources: [
      "https://eprocurement.gov.tj/ru/register/supplierreg",
      "https://eprocurement.gov.tj/en/register/supplierreg/show/125808",
    ],
    normalize: digitsOnly,
    parse(id) {
      if (tjInnCheckDigit(id) !== Number(id[8])) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { extra: {} } };
    },
  },
];
