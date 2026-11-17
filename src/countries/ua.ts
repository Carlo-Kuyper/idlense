/**
 * Ukraine — RNOKPP (individual tax number), EDRPOU code (legal entities) and
 * UNZR (record number in the Unified State Demographic Register).
 *
 * RNOKPP, 10 digits: XXXXX NNNN K (State Tax Service, OECD TIN sheet).
 * - XXXXX the date of birth as a day count: 00001 = 1900-01-01
 *         (i.e. days since 1899-12-31). The STS calls it the "sequence number
 *         of the birth date", so treat the date as what the register holds.
 * - NNNN  serial; the last digit (9th of the number) is odd for men, even for women.
 * - K     (Σ d·(−1,5,7,9,4,6,10,5,7)) mod 11, then mod 10.
 *
 * EDRPOU code, 8 digits. Weights 1..7, or 7,1,2,3,4,5,6 when the code is
 * in 30 000 000 <= code < 60 000 000 (first digit 3, 4 or 5); a remainder of 10 retries with
 * every weight raised by 2; a second 10 gives 0.
 *
 * UNZR, 13 digits: YYYYMMDD-NNNNC. Date of birth, a code 0001-9999 and a check
 * digit computed as for passport machine-readable zones (ICAO 9303, weights
 * 7,3,1 mod 10) over the first 12 digits.
 *
 * Improves on upstream (idnumbers):
 * - RNOKPP: the negative first weight can make the sum negative, and JS `%`
 *   then yields a negative remainder that never matches; we use a true modulo.
 *   Future birth dates are rejected.
 * - EDRPOU: idnumbers uses the shifted weights for every code starting 3-6;
 *   the rule is 30 000 000 <= code < 60 000 000, so codes starting with 6 use
 *   the plain weights.
 * - UNZR is new (not in upstream).
 */
import { icaoCheckDigit, weightedSum } from "../core/algorithms.js";
import { birthFields } from "../core/dates.js";
import { digitsOnly, group } from "../core/normalize.js";
import type { DocumentSpec } from "../core/types.js";

const RNOKPP_WEIGHTS = [-1, 5, 7, 9, 4, 6, 10, 5, 7];

export function rnokppCheckDigit(id: string): number {
  return (((weightedSum(id, RNOKPP_WEIGHTS) % 11) + 11) % 11) % 10;
}

/** Y/M/D for day `n` counted from 1899-12-31 (day 0). Pure UTC arithmetic. */
export function dateFromDayCount(n: number): { y: number; m: number; d: number } {
  const t = new Date(Date.UTC(1899, 11, 31) + n * 86_400_000);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

export function edrpouCheckDigit(id: string): number {
  const code = Number(id);
  const shifted = code >= 30_000_000 && code < 60_000_000;
  const base = shifted ? [7, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6, 7];
  let r = weightedSum(id, base) % 11;
  if (r === 10) {
    r = weightedSum(id, base.map((w) => w + 2)) % 11;
    if (r === 10) r = 0;
  }
  return r;
}

export const documents: DocumentSpec[] = [
  {
    code: "UA_RNOKPP",
    country: "UA",
    name: "Ukrainian Individual Tax Number",
    localName: "РНОКПП (реєстраційний номер облікової картки платника податків)",
    aliases: ["RNOKPP", "IPN", "ІПН", "ідентифікаційний код", "DRFO", "taxpayer registration number"],
    purpose: "tax",
    holder: "person",
    checksum: true,
    confidence: "moderate",
    lengths: [10],
    pattern: /^\d{10}$/,
    example: "2922012341",
    sources: [
      "https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/ukraine-tin.pdf",
      "https://tax.gov.ua",
      "https://en.wikipedia.org/wiki/National_identification_number#Ukraine",
    ],
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    parse(id, { referenceDate }) {
      const { y, m, d } = dateFromDayCount(Number(id.slice(0, 5)));
      const birth = birthFields(y, m, d, referenceDate);
      if (!birth) return { ok: false, reason: "invalid_date" };
      if (rnokppCheckDigit(id) !== Number(id[9])) return { ok: false, reason: "invalid_checksum" };
      return {
        ok: true,
        data: { ...birth, gender: Number(id[8]) % 2 === 1 ? "male" : "female", serial: id.slice(5, 9), extra: {} },
      };
    },
  },
  {
    code: "UA_EDRPOU",
    country: "UA",
    name: "Ukrainian Legal Entity Code",
    localName: "Код ЄДРПОУ",
    aliases: ["EDRPOU", "ЄДРПОУ", "USREOU"],
    purpose: "tax",
    holder: "entity",
    checksum: true,
    confidence: "moderate",
    lengths: [8],
    pattern: /^\d{8}$/,
    example: "32855961",
    sources: [
      "https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/ukraine-tin.pdf",
      "https://uk.wikipedia.org/wiki/%D0%9A%D0%BE%D0%B4_%D0%84%D0%94%D0%A0%D0%9F%D0%9E%D0%A3",
      "https://1cinfo.com.ua/Article/Detail/Proverka_koda_po_EDRPOU/",
    ],
    upstream: ["idnumbers"],
    normalize: digitsOnly,
    parse(id) {
      if (edrpouCheckDigit(id) !== Number(id[7])) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { extra: {} } };
    },
  },
  {
    code: "UA_UNZR",
    country: "UA",
    name: "Ukrainian Demographic Register Record Number",
    localName: "УНЗР (унікальний номер запису в ЄДДР)",
    aliases: ["UNZR", "УНЗР", "record number"],
    purpose: "identity",
    holder: "person",
    checksum: true,
    confidence: "moderate",
    lengths: [13],
    // YYYY 18xx-20xx, MM 01-12, DD 01-31, code 0001-9999
    pattern: /^(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])(?!0000)\d{5}$/,
    example: "1980010100121",
    sources: ["https://www.kmu.gov.ua/news/unikalnyi-nomer-zapysu-v-ieddr-shcho-tse-ta-de-shukaty"],
    normalize: digitsOnly,
    format: (c) => group(c, [8, 5], "-"),
    parse(id, { referenceDate }) {
      const birth = birthFields(Number(id.slice(0, 4)), Number(id.slice(4, 6)), Number(id.slice(6, 8)), referenceDate);
      if (!birth) return { ok: false, reason: "invalid_date" };
      if (icaoCheckDigit(id.slice(0, 12)) !== Number(id[12])) return { ok: false, reason: "invalid_checksum" };
      return { ok: true, data: { ...birth, serial: id.slice(8, 12), extra: {} } };
    },
  },
];
