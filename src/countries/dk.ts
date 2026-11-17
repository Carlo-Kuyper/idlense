/**
 * Denmark — CPR-nummer, CVR-nummer and VAT number.
 *
 * CPR: DDMMYY-SSSS, 10 digits (CPR-kontoret, "Personnummeret i CPR").
 * - The century comes from the 7th digit together with YY:
 *     7th digit 0-3          → 1900-1999
 *     7th digit 4 or 9       → YY 00-36: 2000s, 37-99: 1900s
 *     7th digit 5-8          → YY 00-57: 2000s, 58-99: 1800s
 * - Last digit odd for men, even for women.
 * - The modulus-11 check (weights 4,3,2,7,6,5,4,3,2,1) was dropped in 2007:
 *   numbers issued since then often fail it, so it is not enforced. Whether
 *   a number passes is reported as `extra.modulus11`.
 *
 * CVR (company register): 8 digits, Σ d·(2,7,6,5,4,3,2,1) ≡ 0 (mod 11).
 * VAT: `DK` + the CVR number.
 *
 * Improves on upstream:
 * - idnumbers picks the century from YY alone (> 50 → 1900s), ignoring the
 *   7th digit: 010120-0xxx is read as 2020 instead of 1920 and 010170-5xxx
 *   as 1970 instead of 1870.
 * - Neither upstream rejects future birth dates; nationid also accepts
 *   impossible dates (310299-...).
 */
import { weightedSum } from "../core/algorithms.js";
import { birthFields } from "../core/dates.js";
import { digitsOnly } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

export function cprCentury(seventh: number, yy: number): number {
  if (seventh <= 3) return 1900;
  if (seventh === 4 || seventh === 9) return yy <= 36 ? 2000 : 1900;
  return yy <= 57 ? 2000 : 1800;
}

const cvrValid = (d: string) => weightedSum(d, [2, 7, 6, 5, 4, 3, 2, 1]) % 11 === 0;

export const documents: DocumentSpec[] = [
  {
    code: "DK_CPR",
    country: "DK",
    name: "Danish Personal Identification Number",
    localName: "CPR-nummer",
    aliases: ["CPR", "personnummer"],
    purpose: "identity",
    holder: "person",
    checksum: false,
    confidence: "high",
    lengths: [10],
    pattern: /^(0[1-9]|[12]\d|3[01])(0[1-9]|1[0-2])\d{6}$/,
    example: "0101601234",
    sources: [
      "https://admin.cpr.dk/media/12066/personnummeret-i-cpr.pdf",
      "https://cpr.dk/cpr-systemet/personnumre-uden-kontrolciffer-modulus-11-kontrol",
      "https://en.wikipedia.org/wiki/Personal_identification_number_(Denmark)",
    ],
    upstream: ["idnumbers", "nationid"],
    normalize: digitsOnly,
    format: (c) => `${c.slice(0, 6)}-${c.slice(6)}`,
    parse(id, { referenceDate }) {
      const yy = Number(id.slice(4, 6));
      const birth = birthFields(
        cprCentury(Number(id[6]), yy) + yy,
        Number(id.slice(2, 4)),
        Number(id.slice(0, 2)),
        referenceDate,
      );
      if (!birth) return { ok: false, reason: "invalid_date" };
      const modulus11 = weightedSum(id, [4, 3, 2, 7, 6, 5, 4, 3, 2, 1]) % 11 === 0;
      return {
        ok: true,
        data: { ...birth, gender: Number(id[9]) % 2 === 1 ? "male" : "female", serial: id.slice(6), extra: { modulus11 } },
      };
    },
  },
  {
    code: "DK_CVR",
    country: "DK",
    name: "Danish Business Registration Number",
    localName: "CVR-nummer",
    aliases: ["CVR", "SE-nummer"],
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "high",
    lengths: [8],
    pattern: /^\d{8}$/,
    example: "13585628",
    sources: ["https://datacvr.virk.dk/", "https://en.wikipedia.org/wiki/VAT_identification_number"],
    upstream: ["nationid"],
    normalize: digitsOnly,
    parse: (id) => (cvrValid(id) ? { ok: true, data: { extra: {} } } : { ok: false, reason: "invalid_checksum" }),
  },
  {
    code: "DK_VAT",
    country: "DK",
    name: "Danish VAT Number",
    localName: "Momsnummer",
    aliases: ["VAT ID", "moms-nummer"],
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "high",
    lengths: [10],
    pattern: /^DK\d{8}$/,
    example: "DK13585628",
    sources: ["https://skat.dk/", "https://ec.europa.eu/taxation_customs/vies/"],
    upstream: ["nationid"],
    format: (c) => `DK ${c.slice(2, 4)} ${c.slice(4, 6)} ${c.slice(6, 8)} ${c.slice(8)}`,
    parse: (id) => (cvrValid(id.slice(2)) ? { ok: true, data: { extra: {} } } : { ok: false, reason: "invalid_checksum" }),
  },
];
